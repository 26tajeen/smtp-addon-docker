"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = void 0;
var winston_1 = require("winston");
var combine = winston_1.format.combine, prettyPrint = winston_1.format.prettyPrint, timestamp = winston_1.format.timestamp;
var config_1 = require("./config");
var path_1 = require("path");
var fs_extra_1 = require("fs-extra");
var paths_1 = require("./paths");
var configTransports = [];
var debugConfigTransports = [];
if ((config_1.config.logging.combined.on) && (config_1.config.logging.combined.file)) {
    var logFilePath = (0, path_1.join)(paths_1.packagePath, config_1.config.logging.combined.file);
    (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(logFilePath));
    configTransports.push(new winston_1.transports.File({ filename: logFilePath }));
}
if ((config_1.config.logging.errors.on) && (config_1.config.logging.errors.file)) {
    var logFilePath = (0, path_1.join)(paths_1.packagePath, config_1.config.logging.errors.file);
    (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(logFilePath));
    configTransports.push(new winston_1.transports.File({ filename: logFilePath, level: "error" }));
}
if ((config_1.config.logging.debug.on) && (config_1.config.logging.debug.file)) {
    var logFilePath = (0, path_1.join)(paths_1.packagePath, config_1.config.logging.debug.file);
    (0, fs_extra_1.ensureDirSync)((0, path_1.dirname)(logFilePath));
    debugConfigTransports.push(new winston_1.transports.File({ filename: logFilePath }));
}
if (process.env.NODE_ENV !== "production") {
    debugConfigTransports.push(new winston_1.transports.Console());
}
var _logger = (0, winston_1.createLogger)({
    format: combine(timestamp(), prettyPrint()),
    transports: configTransports
});
var _debugLogger = (0, winston_1.createLogger)({
    transports: debugConfigTransports
});
exports.logger = {
    info: function (message) {
        if (configTransports.length > 0)
            _logger.info(message);
    },
    error: function (message) {
        if (configTransports.length > 0)
            _logger.error(message);
    },
    debug: function (message) {
        if (debugConfigTransports.length > 0)
            _debugLogger.info(message);
    }
};
