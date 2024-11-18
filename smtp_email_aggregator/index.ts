import { SMTPServer } from 'smtp-server';
import { simpleParser, AddressObject, EmailAddress } from 'mailparser';
import config from './src/lib/config';
import { logger } from './src/lib/logger';
import { aggregator } from './src/lib/aggregator';
import { sendQueue } from './src/lib/send_queue';
import { checker } from './src/lib/checker';
import { ensureDirectoriesExist } from './src/lib/paths';
import { transporter, transportConfig } from './src/lib/smtp';
import { mqtt } from './src/lib/mqtt';

ensureDirectoriesExist();

interface SMTPError extends Error {
    code?: string;
    command?: string;
}

// Helper function to get email address string
function getEmailAddress(address: string | AddressObject | EmailAddress | (string | AddressObject | EmailAddress)[] | undefined): string {
    if (typeof address === 'string') {
        return address;
    } else if (Array.isArray(address)) {
        const firstAddress = address[0];
        if (typeof firstAddress === 'string') {
            return firstAddress;
        } else if (firstAddress && 'address' in firstAddress) {
            return firstAddress.address || '';
        }
    } else if (address && typeof address === 'object' && 'address' in address) {
        return address.address || '';
    }
    return '';
}

const server = new SMTPServer({
    authOptional: true,
    onRcptTo(address, session, callback) {
        logger.debug("SMTP: Recipient validation:", {
            address: address.address,
            session_id: session.id,
            client: session.remoteAddress
        });
        callback();
    },
    onMailFrom(address, session, callback) {
        logger.debug("SMTP: Sender validation:", {
            address: address.address,
            session_id: session.id,
            client: session.remoteAddress
        });
        if (!address.address.includes('@')) {
            logger.error("SMTP: Invalid sender address:", address.address);
            return callback(new Error('Invalid sender address format'));
        }
        callback();
    },
    async onData(stream, session, callback) {
        try {
            const from = session.envelope.mailFrom?.address || '';
            const to = session.envelope.rcptTo.map(({address}) => address).join(',');
            
            logger.info(`Receiving message: from=${from}, to=${to}`);
            mqtt.incrementStats('messages_received');

            await aggregator.addMessage({ from, to }, stream);
            callback();
        } catch (error) {
            logger.error('Error processing incoming message:', error);
            callback(new Error('Error processing message'));
        }
    }
});

// Add error event handler explicitly
(server as any).on('error', function(err) {
    logger.error("SMTP Server Error:", {
        message: err.message,
        code: err.code,
        stack: err.stack
    });
});

// Start the server with proper port binding
const incomingPort = config.options.incoming_port || 5025;
const incomingHost = config.options.incoming_host || '0.0.0.0';

server.listen(incomingPort, incomingHost, () => {
    logger.info(`SMTP server listening on ${incomingHost}:${incomingPort}`);
});
mqtt.publishStatus('online');


// Handle server errors with proper typing
(server as any).on('error', (err: SMTPError) => {
    logger.error('SMTP server error:', {
        message: err.message,
        code: err.code,
        command: err.command,
        stack: err.stack
    });
});

// Verify SMTP configuration
logger.info('SMTP Configuration:', {
    mode: config.options.smtp_mode,
    mailpitHost: config.options.smtp_config_mailpit_host,
    productionHost: config.options.smtp_config_outgoing_host,
    incomingPort: incomingPort,
    incomingHost: incomingHost
});

// Start services
sendQueue.start();
checker.start();
mqtt.publishDiscovery();


process.on('SIGTERM', () => {
    logger.info('Received SIGTERM signal, shutting down...');
    mqtt.publishStatus('offline');
    mqtt.shutdown();
    server.close(() => {
        process.exit(0);
    });
});

// Handle uncaught errors
process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', {
        message: error.message,
        stack: error.stack
    });
});

process.on('unhandledRejection', (reason, promise) => {
    logger.error('Unhandled rejection:', {
        reason: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined
    });
});