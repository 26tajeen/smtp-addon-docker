#!/bin/sh

# Use environment variables for configuration
RELAY_HOST="${RELAY_HOST:-smtp.example.com}"
RELAY_PORT="${RELAY_PORT:-587}"
RELAY_USERNAME="${RELAY_USERNAME:-username}"
RELAY_PASSWORD="${RELAY_PASSWORD:-password}"
ALLOW_NET="${ALLOW_NET:-10.0.0.0/8 172.16.0.0/12 192.168.0.0/16}"

# Configure Postfix
postconf -e "relayhost = [${RELAY_HOST}]:${RELAY_PORT}"
postconf -e "smtp_sasl_auth_enable = yes"
postconf -e "smtp_sasl_security_options = noanonymous"
postconf -e "smtp_sasl_password_maps = hash:/etc/postfix/sasl_passwd"
postconf -e "mynetworks = 127.0.0.0/8 [::ffff:127.0.0.0]/104 [::1]/128 ${ALLOW_NET}"

# Set up SASL authentication
echo "[${RELAY_HOST}]:${RELAY_PORT} ${RELAY_USERNAME}:${RELAY_PASSWORD}" > /etc/postfix/sasl_passwd
postmap /etc/postfix/sasl_passwd

# Start Postfix
postfix start

# Run the Node.js application
cd /usr/src/app
npm start