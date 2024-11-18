const winston_1 = require("winston");
const { combine, timestamp, printf } = winston_1.format;

// Add interface for logger
interface Logger {
    info: (message: string, ...args: any[]) => void;
    error: (message: string, ...args: any[]) => void;
    debug: (message: string, ...args: any[]) => void;
    warn: (message: string, ...args: any[]) => void;
    configure: (logLevel: string) => void;
}

const myFormat = printf(({ level, message, timestamp }) => {
    return `${timestamp} ${level}: ${message}`;
});

let _logger = winston_1.createLogger({
    format: combine(
        timestamp(),
        myFormat
    ),
    transports: [
        new winston_1.transports.Console({
            level: 'info'
        })
    ]
});

export const logger: Logger = {
    info: (message: string, ...args: any[]) => _logger.info(message, ...args),
    error: (message: string, ...args: any[]) => _logger.error(message, ...args),
    debug: (message: string, ...args: any[]) => _logger.debug(message, ...args),
    warn: (message: string, ...args: any[]) => _logger.warn(message, ...args),
    configure: (logLevel: string) => {
        _logger.configure({
            format: combine(timestamp(), myFormat),
            transports: [
                new winston_1.transports.Console({ level: logLevel })
            ]
        });
    }
};