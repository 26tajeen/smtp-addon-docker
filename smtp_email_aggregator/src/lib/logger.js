"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
const winston_1 = require("winston");
const { combine, timestamp, printf } = winston_1.format;
const config_1 = require("./config");
const path_1 = require("path");
const fs_extra_1 = require("fs-extra");
const paths_1 = require("./paths");

const myFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} ${level}: ${message}`;
});

const configTransports = [];

// Check if logging configuration exists and add appropriate transports
if (config_1.default && config_1.default.options) {
    const logLevel = config_1.default.options.log_level || 'info';
    
    configTransports.push(new winston_1.transports.Console({
        level: logLevel
    }));

    if (config_1.default.options.logging_combined_enabled) {
        const logFilePath = (0, path_1.join)(paths_1.packagePath, config_1.default.options.logging_combined_file || 'logs/combined.log');
        (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(logFilePath));
        configTransports.push(new winston_1.transports.File({ 
            filename: logFilePath,
            level: logLevel
        }));
    }
}

// If no transports were added, add a default console transport
if (configTransports.length === 0) {
    configTransports.push(new winston_1.transports.Console({
        level: 'info'
    }));
}

const _logger = (0, winston_1.createLogger)({
    format: combine(
        timestamp(),
        myFormat
    ),
    transports: configTransports
});

exports.logger = {
    info: function (message) {
        _logger.info(message);
    },
    error: function (message) {
        _logger.error(message);
    },
    debug: function (message) {
        _logger.debug(message);
    },
    warn: function (message) {
        _logger.warn(message);
    }
};