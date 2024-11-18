import Mail from 'nodemailer/lib/mailer';
import config from './config';
import { logger } from './logger';
import { mqtt } from './mqtt';
import * as nodemailer from 'nodemailer';

type Transporter = Mail;

interface TransportConfig {
    host: string;
    port: number;
    secure: boolean;
    service?: string;
    pool?: boolean;
    debug?: boolean;
    ignoreTLS?: boolean;
    auth?: {
        user: string;
        pass: string;
    } | false;
    tls?: {
        rejectUnauthorized: boolean;
        minVersion: string;
        ciphers?: string;
        requireTLS?: boolean;
    };
}

function validateMailpitConfig(): string[] {
    const errors: string[] = [];
    
    if (!config.options.smtp_config_mailpit_host) {
        errors.push('Mailpit host must be configured when using mailpit mode');
    }
    if (!config.options.smtp_config_mailpit_port) {
        logger.info('Missing mailpit port - using default 1025');
    }
    
    return errors;
}

function validateProductionConfig(): string[] {
    const errors: string[] = [];
    
    if (!config.options.smtp_config_outgoing_host) {
        errors.push('Production SMTP host must be configured when using production mode');
    }
    if (!config.options.smtp_config_outgoing_port) {
        errors.push('Production SMTP port must be configured when using production mode');
    }
    
    // Change warn to info for non-critical issues
    if (!config.options.smtp_config_outgoing_auth_user || !config.options.smtp_config_outgoing_auth_pass) {
        logger.info('Production SMTP authentication credentials not configured - this may cause issues with some providers');
    }
    
    return errors;
}

function getTransportConfig(): TransportConfig {
    logger.info('SMTP Configuration Check:', {
        mode: config.options.smtp_mode,
        mailpit_host: config.options.smtp_config_mailpit_host || 'not set',
        production_host: config.options.smtp_config_outgoing_host || 'not set',
        production_port: config.options.smtp_config_outgoing_port || 'not set'
    });

    if (config.options.smtp_mode === 'mailpit') {
        const errors = validateMailpitConfig();
        if (errors.length > 0) {
            throw new Error(`Invalid Mailpit configuration:\n${errors.join('\n')}`);
        }

        logger.info(`Configuring Mailpit mode with host ${config.options.smtp_config_mailpit_host}`);
        return {
            host: config.options.smtp_config_mailpit_host!,
            port: config.options.smtp_config_mailpit_port || 1025,
            secure: false,
            ignoreTLS: true,
            auth: false
        };
    } 
    else if (config.options.smtp_mode === 'production') {
        const errors = validateProductionConfig();
        if (errors.length > 0) {
            throw new Error(`Invalid Production configuration:\n${errors.join('\n')}`);
        }

        logger.info('Configuring Production SMTP mode');
        
        // Special handling for Gmail
        const isGmail = config.options.smtp_config_outgoing_host?.toLowerCase().includes('gmail.com');
        
        const smtpConfig: TransportConfig = {
            host: config.options.smtp_config_outgoing_host!,
            port: config.options.smtp_config_outgoing_port || 587,
            secure: config.options.smtp_config_outgoing_secure || false,
            pool: true,
            debug: isGmail, // Enable debug for Gmail
            tls: {
                rejectUnauthorized: true,
                minVersion: 'TLSv1.2',
                ciphers: isGmail ? 'HIGH' : undefined,
                requireTLS: isGmail
            }
        };

        if (config.options.smtp_config_outgoing_auth_user && config.options.smtp_config_outgoing_auth_pass) {
            smtpConfig.auth = {
                user: config.options.smtp_config_outgoing_auth_user,
                pass: config.options.smtp_config_outgoing_auth_pass
            };
            logger.info('Using standard SMTP authentication');
            
            // Add service name for Gmail
            if (isGmail) {
                smtpConfig.service = 'gmail';
                logger.info('Using Gmail-specific configuration');
            }
        } else {
            logger.info('No SMTP authentication configured for production mode');
        }

        // Log the final configuration (without sensitive data)
        logger.info('Production SMTP Configuration:', {
            host: smtpConfig.host,
            port: smtpConfig.port,
            secure: smtpConfig.secure,
            service: smtpConfig.service || 'not set',
            authConfigured: !!smtpConfig.auth
        });

        return smtpConfig;
    } 
    else {
        throw new Error(`Invalid SMTP mode: ${config.options.smtp_mode}`);
    }
}

let transporter: Transporter;
let transportConfig: TransportConfig;

try {
    transportConfig = getTransportConfig();
    transporter = nodemailer.createTransport(transportConfig);

    transporter.on('error', (error: Error & { code?: string }) => {
        logger.error('SMTP connection error:', {
            message: error.message,
            code: error.code || 'unknown',
            stack: error.stack,
            mode: config.options.smtp_mode,
            host: transportConfig.host,
            port: transportConfig.port
        });
        mqtt.reportError(`SMTP connection error: ${error.message}`);
    });
    
    // Add more detailed error logging
transporter.verify()
    .then(() => {
        logger.info('SMTP connection verified successfully');
        // Remove test_mode option as it's not valid
        return transporter.verify();
    })
    .then(() => {
        logger.info('SMTP parameters verified successfully');
    })
    .catch((error) => {
        logger.error('SMTP verification failed:', {
            message: error.message,
            code: error.code,
            command: error.command,
            responseCode: error.responseCode,
            response: error.response,
            stack: error.stack
        });
        logger.info('Continuing despite verification failure - will retry during actual sending');
    });

} catch (error) {
    logger.error('Failed to initialize SMTP transport:', {
        error: error instanceof Error ? error.message : String(error),
        mode: config.options.smtp_mode,
        stack: error instanceof Error ? error.stack : undefined
    });
    mqtt.reportError(`SMTP initialization failed: ${error instanceof Error ? error.message : String(error)}`);
    process.exit(1);
}

export { transporter, transportConfig };