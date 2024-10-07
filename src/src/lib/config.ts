import * as fs from 'fs';
import * as path from 'path';

interface Config {
  smtp: {
    incoming: {
      host: string;
      port: number;
    };
    outgoing: {
      host: string;
      port: number;
      secure: boolean;
      auth: {
        user: string;
        pass: string;
      };
    };
  };
  logging: {
    level: string;
  };
}

let config: Config;

try {
  const configPath = path.join(__dirname, '../../config/default.json');
  const rawConfig = fs.readFileSync(configPath, 'utf8');
  config = JSON.parse(rawConfig);
} catch (error) {
  console.warn('Failed to read config file, using environment variables');
  config = {
    smtp: {
      incoming: {
        host: process.env.SMTP_INCOMING_HOST || 'localhost',
        port: parseInt(process.env.SMTP_INCOMING_PORT || '25', 10),
      },
      outgoing: {
        host: process.env.SMTP_OUTGOING_HOST || 'localhost',
        port: parseInt(process.env.SMTP_OUTGOING_PORT || '587', 10),
        secure: process.env.SMTP_OUTGOING_SECURE === 'true',
        auth: {
          user: process.env.SMTP_OUTGOING_AUTH_USER || '',
          pass: process.env.SMTP_OUTGOING_AUTH_PASS || '',
        },
      },
    },
    logging: {
      level: process.env.LOG_LEVEL || 'info',
    },
  };
}

export { config };

export function configSanityCheck(): boolean {
  // Implement your sanity check logic here
  return true;
}