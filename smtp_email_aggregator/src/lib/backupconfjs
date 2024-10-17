"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configSanityCheck = void 0;
var path_1 = require("path");
var fs_1 = require("fs");
var paths_1 = require("./paths");
var yaml_1 = __importDefault(require("yaml"));
var misc_1 = require("./misc");

let config;

try {
    config = yaml_1.default.parse((0, fs_1.readFileSync)(paths_1.configPath, "utf8"));
    
    // Ensure the sendQueue property exists and has default values
    config.sendQueue = config.sendQueue || {};
    config.sendQueue.threads = config.sendQueue.threads || 3;
    config.sendQueue.pollIntervalSeconds = config.sendQueue.pollIntervalSeconds || 5;
    config.sendQueue.failure = config.sendQueue.failure || {};
    config.sendQueue.failure.retries = config.sendQueue.failure.retries || 5;
    config.sendQueue.failure.pauseMinutes = config.sendQueue.failure.pauseMinutes || 1;

    // Ensure the aggregate property exists and has default values
    config.aggregate = config.aggregate || {};
    config.aggregate.checkExpiryEverySeconds = config.aggregate.checkExpiryEverySeconds || 10;
    config.aggregate.waitForUpToMinutes = config.aggregate.waitForUpToMinutes || 5;
    config.aggregate.subject = config.aggregate.subject || "Consolidated Invoice and Statement for {name}";
    config.aggregate.bodyFile = config.aggregate.bodyFile || "body.txt";
} catch (err) {
    console.error("Error reading config file:", err);
    process.exit(1);
}

exports.default = config;
module.exports = config; // For CommonJS compatibility

const configSanityCheck = () => __awaiter(void 0, void 0, void 0, function* () {
    if (config.aggregate.subject.indexOf("{name}") === -1)
        return false;
    const bodyText = yield (0, misc_1.safeReadFile)((0, path_1.join)(paths_1.packagePath, config.aggregate.bodyFile), "utf8") || "";
    if (bodyText.indexOf("{name}") === -1)
        return false;
    return true;
});
exports.configSanityCheck = configSanityCheck;

var configSanityCheck = function () { return __awaiter(void 0, void 0, void 0, function () {
    var bodyText;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                if (config.aggregate.subject.indexOf("{name}") === -1)
                    return [2 /*return*/, false];
                return [4 /*yield*/, (0, misc_1.safeReadFile)((0, path_1.join)(paths_1.packagePath, config.aggregate.bodyFile), "utf8")];
            case 1:
                bodyText = (_a.sent()) || "";
                if (bodyText.indexOf("{name}") === -1)
                    return [2 /*return*/, false];
                return [2 /*return*/, true];
        }
    });
}); };
exports.configSanityCheck = configSanityCheck;