const nodemailer = require('nodemailer');
const config = require('./config').default;

// Read SMTP configuration from config
const smtpConfig = {
  host: config.options.outgoing_host,
  port: config.options.outgoing_port,
  secure: config.options.outgoing_secure,
  auth: {
    user: config.options.outgoing_auth_user,
    pass: config.options.outgoing_auth_pass
  }
};

// Create transporter
const transporter = nodemailer.createTransport(smtpConfig);

// Log the configuration (without sensitive info) for debugging
console.log('Outgoing SMTP Configuration:', {
  host: smtpConfig.host,
  port: smtpConfig.port,
  secure: smtpConfig.secure,
  auth: {
    user: smtpConfig.auth.user ? '****' : 'not set',
    pass: smtpConfig.auth.pass ? '****' : 'not set'
  }
});

module.exports = {
  sender: transporter
};