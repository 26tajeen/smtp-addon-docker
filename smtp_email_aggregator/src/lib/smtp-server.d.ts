declare module 'smtp-server' {
  export interface SMTPServerOptions {
    authOptional?: boolean;
    hideSTARTTLS?: boolean;
    onData?: (stream: any, session: any, callback: any) => void;
  }
  export class SMTPServer {
    constructor(options: SMTPServerOptions);
    listen(port: number, host: string, callback?: () => void): void;
  }
}