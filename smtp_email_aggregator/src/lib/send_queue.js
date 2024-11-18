"use strict";
var config_1 = require("./config");
var config = config_1.default;
var mailparser_1 = require("mailparser");  // Added this import
const { logger } = require('./logger');
var fs_extra_1 = require("fs-extra");
var stream_1 = require("stream");
var paths_1 = require("./paths");
var path_1 = require("path");
var misc_1 = require("./misc");
var jobs_1 = require("./jobs");
var sender_1 = require("./sender");
import { mqtt } from './mqtt';



var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendQueue = void 0;
var stream_1 = require("stream");
var paths_1 = require("./paths");
var path_1 = require("path");
var misc_1 = require("./misc");
var fs_extra_1 = require("fs-extra");
var config_1 = require("./config");
var jobs_1 = require("./jobs");
var sender_1 = require("./sender");
var logger_1 = require("./logger");

var config = config_1.default || {};
config.sendQueue = config.sendQueue || {};
config.sendQueue.threads = config.sendQueue.threads || 3;
config.sendQueue.pollIntervalSeconds = config.sendQueue.pollIntervalSeconds || 5;
config.sendQueue.failure = config.sendQueue.failure || {};
config.sendQueue.failure.retries = config.sendQueue.failure.retries || 5;
config.sendQueue.failure.pauseMinutes = config.sendQueue.failure.pauseMinutes || 1;

var SendQueue = /** @class */ (function () {
    function SendQueue() {
        this.currentQueue = new jobs_1.Jobs();
        this.isPolling = false;
        this.pollingQueue = [];
        this.isPaused = false;
        this.failedCount = 0;
        this.pauseQueue = [];
        this.threads = config.sendQueue.threads;
        this.pollIntervalSeconds = config.sendQueue.pollIntervalSeconds;
        this.failureRetries = config.sendQueue.failure.retries;
        this.failurePauseMinutes = config.sendQueue.failure.pauseMinutes;
    }
SendQueue.prototype.add = function (header, body) {
    return __awaiter(this, void 0, void 0, function () {
        var key, prePath, finalPath, headerPath, bodyPath, wstream_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logger.debug(`SendQueue.add received body of type: ${typeof body}`);
                    key = (0, misc_1.generateRandomKey)();
                    prePath = (0, path_1.join)(paths_1.queuePath, "__".concat(key, "__"));
                    finalPath = (0, path_1.join)(paths_1.queuePath, key);
                    headerPath = (0, path_1.join)(prePath, "header");
                    bodyPath = (0, path_1.join)(prePath, "body");
                    return [4 /*yield*/, (0, fs_extra_1.ensureDir)(prePath)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, (0, fs_extra_1.writeFile)(headerPath, JSON.stringify(header, null, 2))];
                case 2:
                    _a.sent();
                    if (!(body instanceof stream_1.Stream)) return [3 /*break*/, 4];
                    wstream_1 = (0, fs_extra_1.createWriteStream)(bodyPath);
                    return [4 /*yield*/, new Promise(function (resolve, reject) {
                        body.pipe(wstream_1);
                        wstream_1.on("error", reject);
                        wstream_1.on("close", resolve);
                    })];
                case 3:
                    _a.sent();
                    return [3 /*break*/, 6];
                case 4: return [4 /*yield*/, (0, fs_extra_1.writeFile)(bodyPath, body)];
                case 5:
                    _a.sent();
                    _a.label = 6;
                case 6: return [4 /*yield*/, (0, fs_extra_1.move)(prePath, finalPath)];
                case 7:
                    _a.sent();
                    logger.debug(`SendQueue.add: Email queued with key ${key}`);
                    mqtt.recordEmailSent(false); // Record standalone email
                    mqtt.incrementStats('messages_queued');
                    return [2 /*return*/];
            }
        });
    });
};
SendQueue.prototype.getJob = function (index) {
    return __awaiter(this, void 0, void 0, function () {
        var _this = this;
        var job;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (this.isPaused) {
                        logger.debug(`SEND-QUEUE ${index}: paused, adding to pause queue`);
                        return [2 /*return*/, new Promise(function (resolve) {
                            _this.pauseQueue.push({ resolve: resolve, index: index });
                        })];
                    }
                    if (this.isPolling) {
                        logger.debug(`SEND-QUEUE ${index}: polling, adding to polling queue`);
                        return [2 /*return*/, new Promise(function (resolve) {
                            _this.pollingQueue.push({ resolve: resolve, index: index });
                        })];
                    }
                    job = this.currentQueue.items.shift();
                    if (job) {
                        logger.debug(`SEND-QUEUE ${index}: job found`);
                        return [2 /*return*/, job];
                    }
                    logger.debug(`SEND-QUEUE ${index}: no jobs, starting poll`);
                    this.isPolling = true;
                    return [4 /*yield*/, new Promise(function (resolve) {
                        logger_1.logger.debug("SEND-QUEUE ".concat(index, ": adding main resolve to polling queue"));
                        _this.pollingQueue.push({ resolve: resolve, index: index });
                        
                        const next = async function () {
                            try {
                                _this.currentQueue = await jobs_1.Jobs.load();
                                if (_this.currentQueue.items.length > 0) {
                                    for (let i = 0; i < _this.currentQueue.items.length; i++) {
                                        const rawmessage = _this.currentQueue.items[i];
                                        rawmessage.block();
                                    }
                                    _this.clearPollingState(index);
                                } else {
                                    logger_1.logger.debug("SEND-QUEUE ".concat(index, ": job not found, polling, waiting ").concat(config_1.config.sendQueue.pollIntervalSeconds, " seconds"));
                                    setTimeout(next, config_1.config.sendQueue.pollIntervalSeconds * 1000);
                                }
                            } catch (error) {
                                logger_1.logger.error("Error in next function: " + error.message);
                                // Continue polling even if an error occurs
                                setTimeout(next, config_1.config.sendQueue.pollIntervalSeconds * 1000);
                            }
                        };
                        
                        logger_1.logger.debug("SEND-QUEUE ".concat(index, ": job not found, polling"));
                        next();  // Start the polling loop
                    })];
                case 1:
                    return [2 /*return*/, _a.sent()];
            }
        });
    });
};

SendQueue.prototype.parseRawEmail = function(rawContent) {
    logger_1.logger.debug('Raw email content:', rawContent);
    
    const headerEndIndex = rawContent.indexOf('\n\n');
    const headers = {};
    let body = '';

    if (headerEndIndex !== -1) {
        const headerPart = rawContent.slice(0, headerEndIndex);
        body = rawContent.slice(headerEndIndex + 2);

        // Parse headers
        const headerLines = headerPart.split('\n');
        for (const line of headerLines) {
            const [key, value] = line.split(':').map(s => s.trim());
            if (key && value) {
                headers[key.toLowerCase()] = value;
            }
        }
    } else {
        body = rawContent;
    }

    logger_1.logger.debug('Parsed headers:', headers);
    logger_1.logger.debug('Parsed body:', body);

    return {
        subject: headers['subject'] || '',
        body: body,
        headers: headers
    };
};

SendQueue.prototype.clearPauseState = function (index) {
    this.failedCount = 0;
    if (this.isPaused) {
        logger.debug(`SEND-QUEUE ${index}: resuming from pause`);
        if (this.pausedTimeout) {
            clearTimeout(this.pausedTimeout);
            this.pausedTimeout = undefined;
        }
        this.isPaused = false;
        const pauseQueue = [...this.pauseQueue];
        this.pauseQueue.length = 0;
        pauseQueue.forEach(({ resolve, index }) => {
            this.getJob(index).then(resolve);
        });
    }
};
    SendQueue.prototype.clearPollingState = function (index) {
        var _this = this;
        logger_1.logger.debug("SEND-QUEUE ".concat(index, ": clearing polling state"));
        if (this.isPolling) {
            logger_1.logger.debug("SEND-QUEUE ".concat(index, ": clearing polling state: is actually polling"));
            this.isPolling = false;
            var pollingQueue = __spreadArray([], this.pollingQueue, true);
            this.pollingQueue.length = 0;
            logger_1.logger.debug("SEND-QUEUE ".concat(index, ": clearing polling state: polling queue length: ").concat(pollingQueue.length, ", restoring}"));
            pollingQueue.forEach(function (_a) {
                var resolve = _a.resolve, index = _a.index;
                _this.getJob(index).then(resolve);
            });
        }
    };
  
SendQueue.prototype.reportSuccess = function (index, to) {
    const startTime = Date.now(); // Add at beginning of email processing
    const processingTime = Date.now() - startTime;
    logger.info(`Email successfully sent to: ${to}`);
    mqtt.incrementStats('messages_sent');
    mqtt.recordMessageProcessingTime(processingTime);
    this.clearPauseState(index);
};

SendQueue.prototype.reportError = function (index, rawmessage, message, id) {
    logger.error(`Failed to send message ${id}: ${message}`);
    mqtt.reportError(`Send queue error: ${message}`);
    mqtt.incrementStats('messages_failed');
    mqtt.reportError(message); // Changed from error to message
    this.currentQueue.items.push(rawmessage);
    this.failedCount++;
    
    if (this.failedCount === config.sendQueue.failure.retries) {
        logger.warn(`Send queue pausing for ${config.sendQueue.failure.pauseMinutes} minute(s) after ${this.failedCount} failures`);
        this.isPaused = true;
        this.pausedTimeout = setTimeout(() => this.clearPauseState(index), 
            config.sendQueue.failure.pauseMinutes * 60 * 1000);
    }
};

SendQueue.prototype.thread = function (index) {
    return __awaiter(this, void 0, void 0, function () {
        var rawmessage, envelope, mailOptions, err_1;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!true) return [3 /*break*/, 10];
                    return [4 /*yield*/, this.getJob(index)];
                case 1:
                    rawmessage = _a.sent();
                    logger_1.logger.debug("SEND-QUEUE ".concat(index, ": thread got a job with id: ").concat(rawmessage.id));
                    return [4 /*yield*/, rawmessage.getHeader()];
                case 2:
                    envelope = _a.sent();
                    if (!(envelope !== null)) return [3 /*break*/, 8];
                    logger_1.logger.debug("SEND-QUEUE ".concat(index, ": thread job with id: ").concat(rawmessage.id, ", parsed successfully"));
                    mailOptions = {
                        envelope: envelope,
                        raw: {
                            path: rawmessage.bodyFilePath
                        }
                    };
                    _a.label = 3;
                case 3:
                    _a.trys.push([3, 6, , 7]);
                    if (rawmessage.simulatedErrorCount > 0) {
                        rawmessage.simulatedErrorCount--;
                        throw new Error("simulated error thrown");
                    }
                    return [4 /*yield*/, sender_1.sender.sendMail(mailOptions)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, rawmessage.remove()];
                case 5:
                    _a.sent();
                    mqtt.recordEmailSent(false); // Add only this line to track successful sends
                    logger_1.logger.debug("SEND-QUEUE ".concat(index, ": thread job with id: ").concat(rawmessage.id, ", removed"));
                    this.reportSuccess(index, envelope.to);
                    return [3 /*break*/, 7];
                case 6:
                    err_1 = _a.sent();
                    this.reportError(index, rawmessage, err_1.message, rawmessage.id);
                    return [3 /*break*/, 7];
                case 7: return [3 /*break*/, 9];
                case 8:
                    this.reportError(index, rawmessage, "unexpected error: unable to parse rawmessage header", rawmessage.id);
                    _a.label = 9;
                case 9: return [3 /*break*/, 0];
                case 10: return [2 /*return*/];
            }
        });
    });
};

SendQueue.prototype.start = function () {
    return __awaiter(this, void 0, void 0, function () {
        var i;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    logger.debug("Unblocking any previously blocked messages");
                    return [4 /*yield*/, jobs_1.Jobs.unblockAll()];
                case 1:
                    _a.sent();
                    logger.info(`Starting send queue with ${config.sendQueue.threads} threads`);
                    for (i = 0; i < config.sendQueue.threads; i++) {
                        this.thread(i);
                    }
                    return [2 /*return*/];
            }
        });
    });
};
    return SendQueue;
}());

exports.sendQueue = new SendQueue();