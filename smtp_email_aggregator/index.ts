import { SMTPServer } from 'smtp-server';
import { simpleParser, AddressObject, EmailAddress } from 'mailparser';
import * as nodemailer from 'nodemailer';
import config from './src/lib/config';
import { logger } from './src/lib/logger';
import { aggregator } from './src/lib/aggregator';
import { sendQueue } from './src/lib/send_queue';
import { checker } from './src/lib/checker';

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
    } else if (address && typeof address === 'object') {
        if ('address' in address) {
            return address.address || '';
        }
    }
    return ''; // Return an empty string if no valid address is found
}

// Safely get config values with defaults
const options = config.options || {};

// Outgoing email configuration
const transportConfig = {
    host: options.outgoing_host || 'localhost',
    port: options.outgoing_port || 25,
    secure: options.outgoing_secure || false,
    auth: {
        user: options.outgoing_auth_user || '',
        pass: options.outgoing_auth_pass || ''
    }
};

// Log the configuration (without sensitive info)
logger.info('Outgoing SMTP Configuration:', {
    host: transportConfig.host,
    port: transportConfig.port,
    secure: transportConfig.secure,
    auth: {
        user: transportConfig.auth.user ? '****' : 'not set',
        pass: transportConfig.auth.pass ? '****' : 'not set'
    }
});

// Create a nodemailer transporter
const transporter = nodemailer.createTransport(transportConfig);

// Modify your server setup to use the configuration
const server = new SMTPServer({
  authOptional: true,
  onData(stream, session, callback) {
    const from = session.envelope.mailFrom ? session.envelope.mailFrom.address : "";
    const to = session.envelope.rcptTo.map(({address}) => address).join(",");
    
    logger.debug(`SERVER received message with header: ${JSON.stringify({ from, to })}`);
    
    aggregator.addMessage({ from, to }, stream);
    callback();
  }
});

// Start the server
const incomingPort = options.incoming_port || 25;
const incomingHost = options.incoming_host || '0.0.0.0';
server.listen(incomingPort, incomingHost, () => {
    logger.info(`SMTP server is running on ${incomingHost}:${incomingPort}`);
});

// Start the send queue and checker
sendQueue.start();
checker.start();