const { logger } = require('./logger');
const { transporter, transportConfig } = require('./smtp');
const { mqtt } = require('./mqtt');

// Enhance the sendMail function with better logging and error handling
const originalSendMail = transporter.sendMail.bind(transporter);
transporter.sendMail = function(mailOptions) {
    logger.debug('Sending email:', {
        to: mailOptions.to,
        from: mailOptions.from,
        subject: mailOptions.subject,
        hasAttachments: Boolean(mailOptions.attachments?.length),
        smtpHost: transportConfig.host,
        smtpPort: transportConfig.port
    });

    return originalSendMail(mailOptions)
        .then((info) => {
            logger.debug('Email sent successfully:', {
                messageId: info.messageId,
                response: info.response,
                envelope: info.envelope
            });
            return info;
        })
        .catch((error) => {
            const errorDetails = {
                message: error.message,
                code: error.code,
                responseCode: error.responseCode,
                response: error.response,
                smtpHost: transportConfig.host,
                smtpPort: transportConfig.port
            };
            
            logger.error('Failed to send email:', errorDetails);
            mqtt.reportError(`SMTP send failed: ${error.message}`);
            
            if (config.options.log_level === 'debug') {
                logger.debug('Failed email details:', {
                    to: mailOptions.to,
                    from: mailOptions.from,
                    subject: mailOptions.subject,
                    error: error.stack,
                    smtpHost: transportConfig.host,
                    smtpPort: transportConfig.port
                });
            }
            
            throw error;
        });
};

module.exports = {
    sender: transporter
};