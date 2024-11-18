import { join } from 'path';
import { readFileSync, existsSync } from 'fs';
import yaml from 'yaml';
import { safeReadFile } from './misc';
import { logger } from './logger';

// In a Home Assistant addon, runtime config is typically at /data/options.json
const HA_CONFIG_PATH = '/data/options.json';
const FALLBACK_CONFIG_PATH = join(__dirname, '../../../config.yaml');

export interface Config {
    incoming: {
        host: string;
        port: number;
    };
    aggregate: {
        subject: string;
        bodyText: string;
        checkExpiryEverySeconds: number;
        waitForUpToMinutes: number;
    };
    sendQueue: {
        threads: number;
        pollIntervalSeconds: number;
        failure: {
            retries: number;
            pauseMinutes: number;
        };
    };
    mqtt: {  
        discovery_prefix: string;
        device_name: string;
        device_id: string;
        status_topic: string;
        available_payload: string;
        unavailable_payload: string;
    };
    options: {
        smtp_mode: 'production' | 'mailpit';
        smtp_config_mailpit_host?: string;
        smtp_config_mailpit_port?: number;
        smtp_config_outgoing_host?: string;
        smtp_config_outgoing_port?: number;
        smtp_config_outgoing_secure?: boolean;
        smtp_config_outgoing_auth_user?: string;
        smtp_config_outgoing_auth_pass?: string;
        mqtt_error_topic?: string;
        mqtt_stats_topic?: string;
        mqtt_stats_interval?: number;
        incoming_host?: string;
        incoming_port?: number;
        log_level?: string;
    };
}

let config: Config;

try {
    let parsedConfig;
    let configSource;
    
    if (existsSync(HA_CONFIG_PATH)) {
        logger.info('Found Home Assistant config file at ' + HA_CONFIG_PATH);
        const rawConfig = readFileSync(HA_CONFIG_PATH, 'utf8');
        logger.info('Raw config content: ' + rawConfig);
        
        const haConfig = JSON.parse(rawConfig);
        logger.info('Parsed Home Assistant config: ' + JSON.stringify(haConfig, null, 2));
        
        parsedConfig = { options: haConfig }; // HA puts everything under options
        configSource = 'home-assistant';
    } else {
        logger.info('Config not found at ' + HA_CONFIG_PATH + ', falling back to yaml');
        const yamlContent = readFileSync(FALLBACK_CONFIG_PATH, 'utf8');
        parsedConfig = yaml.parse(yamlContent);
        configSource = 'yaml';
    }

    // Log each important value individually
    logger.info('Config source: ' + configSource);
    logger.info('SMTP mode from config: ' + parsedConfig.options?.smtp_mode);
    logger.info('Queue threads from config: ' + parsedConfig.options?.queue_threads);
    logger.info('Mailpit host from config: ' + parsedConfig.options?.smtp_config_mailpit_host);
    logger.info('Production host from config: ' + parsedConfig.options?.smtp_config_outgoing_host);
    logger.info('Production port from config: ' + parsedConfig.options?.smtp_config_outgoing_port);

    // Create config object with explicit logging of SMTP mode
    const smtpMode = parsedConfig.options?.smtp_mode || 'production';
    logger.info('Final SMTP mode selected: ' + smtpMode);

    config = {
        incoming: {
            host: parsedConfig.options?.incoming_host || "0.0.0.0",
            port: Number(parsedConfig.options?.incoming_port) || 5025
        },
    mqtt: {
        discovery_prefix: 'homeassistant',
        device_name: 'SMTP Email Aggregator',
        device_id: 'smtp_email_aggregator',
        status_topic: parsedConfig.options?.mqtt_stats_topic || 'smtp_aggregator/status',
        available_payload: 'online',
        unavailable_payload: 'offline'
        },
        aggregate: {
            subject: parsedConfig.options?.aggregate_subject || "Consolidated Invoice and Statement for {name}",
            bodyText: parsedConfig.options?.aggregate_body_text || "Dear {name},\n\nPlease find attached your latest invoices and statement.\n\nThank you for your business.",
            checkExpiryEverySeconds: Number(parsedConfig.options?.aggregate_check_seconds) || 10,
            waitForUpToMinutes: Number(parsedConfig.options?.aggregate_wait_minutes) || 5
        },
        sendQueue: {
            threads: Number(parsedConfig.options?.queue_threads) || 3,
            pollIntervalSeconds: Number(parsedConfig.options?.queue_poll_seconds) || 5,
            failure: {
                retries: Number(parsedConfig.options?.queue_retry_count) || 5,
                pauseMinutes: Number(parsedConfig.options?.queue_pause_minutes) || 1
            }
        },
        options: {
            smtp_mode: smtpMode,
            smtp_config_mailpit_host: parsedConfig.options?.smtp_config_mailpit_host,
            smtp_config_mailpit_port: Number(parsedConfig.options?.smtp_config_mailpit_port),
            smtp_config_outgoing_host: parsedConfig.options?.smtp_config_outgoing_host,
            smtp_config_outgoing_port: Number(parsedConfig.options?.smtp_config_outgoing_port),
            smtp_config_outgoing_secure: parsedConfig.options?.smtp_config_outgoing_secure,
            smtp_config_outgoing_auth_user: parsedConfig.options?.smtp_config_outgoing_auth_user,
            smtp_config_outgoing_auth_pass: parsedConfig.options?.smtp_config_outgoing_auth_pass,
            log_level: parsedConfig.options?.log_level || 'info'
        }
    };

    // Log final values individually to debug configuration
    logger.info('Final config values:');
    logger.info('- SMTP Mode: ' + config.options.smtp_mode);
    logger.info('- Queue Threads: ' + config.sendQueue.threads);
    logger.info('- Incoming Port: ' + config.incoming.port);
    logger.info('- Mailpit Host: ' + config.options.smtp_config_mailpit_host);
    logger.info('- Production Host: ' + config.options.smtp_config_outgoing_host);
    logger.info('- Production Port: ' + config.options.smtp_config_outgoing_port);
    logger.info('- Production Auth User: ' + (config.options.smtp_config_outgoing_auth_user ? 'configured' : 'not set'));

} catch (error: unknown) {
    if (error instanceof Error) {
        logger.error('Configuration error: ' + error.message);
        logger.error('Stack trace: ' + error.stack);
    } else {
        logger.error('Unknown configuration error: ' + String(error));
    }
    process.exit(1);
}

logger.configure(config.options.log_level || 'info');
logger.debug('Logger configured with level: ' + config.options.log_level);

export const configSanityCheck = async (): Promise<boolean> => {
    if (config.aggregate.subject.indexOf("{name}") === -1) return false;
    if (config.aggregate.bodyText.indexOf("{name}") === -1) return false;
    return true;
};

export { config };
export default config;