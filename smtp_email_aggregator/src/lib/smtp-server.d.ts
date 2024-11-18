declare module 'smtp-server' {
    import { Socket } from 'net';
    import { Transform } from 'stream';

    interface SMTPServerAddress {
        address: string;
        args?: string[];
    }

    interface SMTPServerSession {
        id: string;
        remoteAddress: string;
        clientHostname?: string;
        envelope: {
            mailFrom?: SMTPServerAddress;
            rcptTo: SMTPServerAddress[];
        };
        [key: string]: any;
    }

    interface SMTPServerOptions {
        secure?: boolean;
        name?: string;
        banner?: string;
        size?: number;
        authOptional?: boolean;
        disableReverseLookup?: boolean;
        disabledCommands?: string[];
        hideSTARTTLS?: boolean;
        onConnect?: (session: SMTPServerSession, callback: (err?: Error) => void) => void;
        onAuth?: (auth: any, session: SMTPServerSession, callback: (err: Error | null | undefined, response?: { user: string }) => void) => void;
        onMailFrom?: (address: SMTPServerAddress, session: SMTPServerSession, callback: (err?: Error) => void) => void;
        onRcptTo?: (address: SMTPServerAddress, session: SMTPServerSession, callback: (err?: Error) => void) => void;
        onData?: (stream: Transform, session: SMTPServerSession, callback: (err?: Error) => void) => void;
        onClose?: (session: SMTPServerSession) => void;
        logger?: boolean;
    }

    export class SMTPServer {
        constructor(options: SMTPServerOptions);
        
        public listen(port: number, host?: string, callback?: () => void): void;
        public close(callback?: () => void): void;
        public on(event: 'error', listener: (error: Error) => void): this;
        public on(event: string, listener: Function): this;
        public emit(event: string, ...args: any[]): boolean;
        
        options: SMTPServerOptions;
    }

    export { SMTPServerOptions };
}