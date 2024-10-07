import { SMTPServer } from 'smtp-server';
import { simpleParser, ParsedMail, Attachment as MailparserAttachment } from 'mailparser';
import nodemailer from 'nodemailer';
import { Attachment as NodemailerAttachment } from 'nodemailer/lib/mailer';
import winston from 'winston';
import * as fs from 'fs-extra';
import * as path from 'path';


// Read Home Assistant add-on configuration
const options = JSON.parse(fs.readFileSync('/data/options.json', 'utf8'));

// Setup logger
const logger = winston.createLogger({
  level: options.log_level || 'info',
  format: winston.format.simple(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: '/data/smtp_aggregator.log' })
  ]
});

// Outgoing email configuration
const outgoingConfig = {
  host: options.outgoing_host,
  port: options.outgoing_port,
  secure: options.outgoing_secure,
  auth: {
    user: options.outgoing_auth_user,
    pass: options.outgoing_auth_pass
  }
};

// Create a nodemailer transporter
const transporter = nodemailer.createTransport(outgoingConfig);

// Modify your server setup to use the configuration
const server = new SMTPServer({
  authOptional: true,
    onData(stream, session, callback) {
    simpleParser(stream, {}, (err, parsed: ParsedMail) => {
      if (err) {
        logger.error('Error parsing email:', err);
        return callback(err);
      }

      const toAddress = Array.isArray(parsed.to) 
        ? parsed.to.map(to => to.text).join(', ')
        : parsed.to?.text || '';

      const convertAttachment = (att: MailparserAttachment): NodemailerAttachment => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
        contentDisposition: att.contentDisposition as "attachment" | "inline" | undefined,
      });

      const mailOptions: nodemailer.SendMailOptions = {
        from: parsed.from?.text,
        to: toAddress,
        subject: parsed.subject,
        text: parsed.text,
        html: parsed.html || undefined,
        attachments: parsed.attachments?.map(convertAttachment) || []
      };

      transporter.sendMail(mailOptions, (error) => {
        if (error) {
          logger.error('Error forwarding email:', error);
          return callback(error);
        }
        logger.info(`Forwarded email to: ${toAddress}`);
        callback();
      });
    });
  },
});

// Start the server
server.listen(options.smtp_port || 25, () => {
  logger.info(`SMTP server is running on port ${options.smtp_port || 25}`);
});