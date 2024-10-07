import { config } from './lib/config';
import { logger } from './lib/logger';
import { SMTPServer } from 'smtp-server';
import { simpleParser } from 'mailparser';
import * as nodemailer from 'nodemailer';
import { aggregator } from './lib/aggregator';

// Configure logger
logger.level = config.logging.level;

// Configure outgoing SMTP transport
const transporter = nodemailer.createTransport({
  host: config.smtp.outgoing.host,
  port: config.smtp.outgoing.port,
  secure: config.smtp.outgoing.secure,
  auth: {
    user: config.smtp.outgoing.auth.user,
    pass: config.smtp.outgoing.auth.pass
  }
});

// Configure incoming SMTP server
const server = new SMTPServer({
  authOptional: true,
  disabledCommands: ['AUTH'],
  onData(stream, session, callback) {
    simpleParser(stream, {}, (err, parsed) => {
      if (err) {
        logger.error('Error parsing email:', err);
        return callback(err);
      }

      logger.info('Received email:', parsed.subject);
      
      // Use the aggregator to process the email
      aggregator.processEmail(parsed).then(() => {
        callback();
      }).catch((error) => {
        logger.error('Error processing email:', error);
        callback(error);
      });
    });
  }
});

// Start the server
server.listen(config.smtp.incoming.port, () => {
  logger.info(`SMTP server is running on port ${config.smtp.incoming.port}`);
});

// Handle shutdown gracefully
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
  });
});