import { join } from 'path';
import { readFileSync } from 'fs';
import yaml from 'yaml';
import { safeReadFile } from './misc';

const configPath = join(__dirname, '../../../config.yaml');
const packagePath = join(__dirname, '../../..');


export interface Config {
  incoming: {
    host: string;
    port: number;
  };
  aggregate: {
    subject: string;
    bodyFile: string;
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
  options: {
    outgoing_host: string;
    outgoing_port: number;
    outgoing_secure: boolean;
    outgoing_auth_user: string;
    outgoing_auth_pass: string;
    incoming_host: string;
    incoming_port: number;
  };
}

export let config: Config;

try {
    const fileContent = readFileSync(configPath, "utf8");
    config = yaml.parse(fileContent);

  // Ensure structures exist and set default values
  config.incoming = config.incoming || { host: "0.0.0.0", port: 5025 };
  config.aggregate = config.aggregate || {
    subject: "Consolidated Invoice and Statement for {name}",
    bodyFile: "body.txt",
    checkExpiryEverySeconds: 10,
    waitForUpToMinutes: 5
  };
  config.sendQueue = config.sendQueue || {
    threads: 3,
    pollIntervalSeconds: 5,
    failure: {
      retries: 5,
      pauseMinutes: 1
    }
  };
  config.options = config.options || {};

  // Set default values for Home Assistant add-on options
  config.options.outgoing_host = process.env.OUTGOING_HOST || config.options.outgoing_host || "smtp.example.com";
  config.options.outgoing_port = parseInt(process.env.OUTGOING_PORT || config.options.outgoing_port?.toString() || "587", 10);
  config.options.outgoing_secure = process.env.OUTGOING_SECURE === "true" || config.options.outgoing_secure || false;
  config.options.outgoing_auth_user = process.env.OUTGOING_AUTH_USER || config.options.outgoing_auth_user || "";
  config.options.outgoing_auth_pass = process.env.OUTGOING_AUTH_PASS || config.options.outgoing_auth_pass || "";
  config.options.incoming_host = process.env.INCOMING_HOST || config.options.incoming_host || config.incoming.host;
  config.options.incoming_port = parseInt(process.env.INCOMING_PORT || config.options.incoming_port?.toString() || config.incoming.port.toString(), 10);
} catch (err) {
    console.error("Error loading configuration:", err);
    process.exit(1);
}

export const configSanityCheck = async (): Promise<boolean> => {
  if (config.aggregate.subject.indexOf("{name}") === -1) return false;
  const bodyText = await safeReadFile(join(packagePath, config.aggregate.bodyFile), "utf8") || "";
  if (bodyText.indexOf("{name}") === -1) return false;
  return true;
};

export default config;