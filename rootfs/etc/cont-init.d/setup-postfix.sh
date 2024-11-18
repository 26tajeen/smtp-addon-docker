#!/usr/bin/with-contenv bashio
# ==============================================================================
# Setup Postfix for Gmail SMTP relay
# ==============================================================================

# Ensure postfix directories exist
mkdir -p /etc/postfix
touch /etc/postfix/sasl_passwd

# Get configuration values
if bashio::config.exists 'outgoing_auth_user' && bashio::config.exists 'outgoing_auth_pass'; then
    SMTP_USER=$(bashio::config 'outgoing_auth_user')
    SMTP_PASS=$(bashio::config 'outgoing_auth_pass')
    HAS_AUTH=true
else
    HAS_AUTH=false
    bashio::log.warning "SMTP authentication credentials not provided - will attempt direct sending"
fi

RELAY_HOST=$(bashio::config 'postfix_relay_host')
POSTFIX_ENABLED=$(bashio::config 'postfix_enabled')

if [ "$POSTFIX_ENABLED" = "true" ]; then
    if [ "$HAS_AUTH" = "true" ]; then
        # Setup authenticated relay
        echo "$RELAY_HOST $SMTP_USER:$SMTP_PASS" > /etc/postfix/sasl_passwd
        
        # Create the hash db file
        postmap /etc/postfix/sasl_passwd || bashio::log.error "Failed to create postmap"
        
        # Secure the files - only attempt if files exist
        if [ -f /etc/postfix/sasl_passwd ]; then
            chmod 600 /etc/postfix/sasl_passwd
        fi
        if [ -f /etc/postfix/sasl_passwd.db ]; then
            chmod 600 /etc/postfix/sasl_passwd.db
        fi
        
        # Basic Postfix configuration
        postconf -e "mydomain = localhost"
        postconf -e "mydestination = localhost"
        postconf -e "relayhost = $RELAY_HOST"
        postconf -e "smtp_sasl_auth_enable = yes"
        postconf -e "smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd"
        postconf -e "smtp_sasl_security_options = noanonymous"
        postconf -e "smtp_tls_security_level = encrypt"
        postconf -e "smtp_tls_CAfile = /etc/ssl/certs/ca-certificates.crt"
        
        # Additional recommended settings
        postconf -e "smtp_use_tls = yes"
        postconf -e "smtp_tls_session_cache_database = btree:/var/lib/postfix/smtp_tls_session_cache"
        postconf -e "smtp_tls_protocols = !SSLv2,!SSLv3,!TLSv1,!TLSv1.1"
        postconf -e "smtp_tls_mandatory_protocols = !SSLv2,!SSLv3,!TLSv1,!TLSv1.1"
        
        bashio::log.info "Postfix configured with authentication"
    else
        # Configure Postfix without authentication for direct sending
        postconf -e "relayhost = "
        postconf -e "smtp_sasl_auth_enable = no"
        postconf -e "inet_protocols = ipv4"
        
        bashio::log.info "Postfix configured for direct sending without authentication"
    fi
    
    # Ensure Postfix directories exist
    mkdir -p /var/spool/postfix
    mkdir -p /var/lib/postfix
    
    # Start Postfix
    postfix stop || true  # Stop if running
    postfix start
    
    bashio::log.info "Postfix service started"
else
    bashio::log.info "Postfix integration disabled"
fi