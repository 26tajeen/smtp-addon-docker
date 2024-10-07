"use strict";
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
var SendQueue = /** @class */ (function () {
    function SendQueue() {
        this.currentQueue = new jobs_1.Jobs();
        this.isPolling = false;
        this.pollingQueue = [];
        this.failedCount = 0;
        this.isPaused = false;
        this.pauseQueue = [];
    }
    SendQueue.prototype.add = function (header, body) {
        return __awaiter(this, void 0, void 0, function () {
            var key, prePath, finalPath, headerPath, bodyPath, wstream_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
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
                        return [2 /*return*/];
                }
            });
        });
    };
    SendQueue.prototype.getJob = function (index) {
        return __awaiter(this, void 0, void 0, function () {
            var job;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.isPaused) {
                            return [2 /*return*/, new Promise(function (resolve) {
                                    logger_1.logger.debug("SEND-QUEUE ".concat(index, ": is paused, adding resolve to pause queue"));
                                    _this.pauseQueue.push({ resolve: resolve, index: index });
                                })];
                        }
                        if (this.isPolling) {
                            return [2 /*return*/, new Promise(function (resolve) {
                                    logger_1.logger.debug("SEND-QUEUE ".concat(index, ": is polling, adding resolve to polling queue"));
                                    _this.pollingQueue.push({ resolve: resolve, index: index });
                                })];
                        }
                        job = this.currentQueue.items.shift();
                        if (!job) return [3 /*break*/, 1];
                        logger_1.logger.debug("SEND-QUEUE ".concat(index, ": job found directly"));
                        return [2 /*return*/, job];
                    case 1:
                        logger_1.logger.debug("SEND-QUEUE ".concat(index, ": entering polling state"));
                        this.isPolling = true;
                        return [4 /*yield*/, new Promise(function (resolve) {
                                logger_1.logger.debug("SEND-QUEUE ".concat(index, ": adding main resolve to polling queue"));
                                _this.pollingQueue.push({ resolve: resolve, index: index });
                                var next = function () { return __awaiter(_this, void 0, void 0, function () {
                                    var _a, i, rawmessage;
                                    return __generator(this, function (_b) {
                                        switch (_b.label) {
                                            case 0:
                                                _a = this;
                                                return [4 /*yield*/, jobs_1.Jobs.load()];
                                            case 1:
                                                _a.currentQueue = _b.sent();
                                                if (!(this.currentQueue.items.length > 0)) return [3 /*break*/, 6];
                                                logger_1.logger.debug("SEND-QUEUE ".concat(index, ": polling found ").concat(this.currentQueue.items.length, " jobs, blocking all"));
                                                i = 0;
                                                _b.label = 2;
                                            case 2:
                                                if (!(i < this.currentQueue.items.length)) return [3 /*break*/, 5];
                                                rawmessage = this.currentQueue.items[i];
                                                return [4 /*yield*/, rawmessage.loadSimulatedErrorCount()];
                                            case 3:
                                                _b.sent();
                                                rawmessage.block();
                                                _b.label = 4;
                                            case 4:
                                                i++;
                                                return [3 /*break*/, 2];
                                            case 5:
                                                // this.currentQueue.items.forEach((rawmessage) => rawmessage.block());
                                                this.clearPollingState(index);
                                                return [3 /*break*/, 7];
                                            case 6:
                                                logger_1.logger.debug("SEND-QUEUE ".concat(index, ": job not found, polling, waiting ").concat(config_1.config.sendQueue.pollIntervalSeconds, " seconds"));
                                                setTimeout(next, config_1.config.sendQueue.pollIntervalSeconds * 1000);
                                                _b.label = 7;
                                            case 7: return [2 /*return*/];
                                        }
                                    });
                                }); };
                                logger_1.logger.debug("SEND-QUEUE ".concat(index, ": job not found, polling"));
                                next();
                            })];
                    case 2: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    SendQueue.prototype.clearPauseState = function (index) {
        var _this = this;
        this.failedCount = 0;
        logger_1.logger.debug("SEND-QUEUE ".concat(index, ": clearing pause state"));
        if (this.isPaused) {
            logger_1.logger.debug("SEND-QUEUE ".concat(index, ": clearing pause state: is actually paused"));
            if (this.pausedTimeout) {
                clearTimeout(this.pausedTimeout);
                this.pausedTimeout = undefined;
            }
            this.isPaused = false;
            var pauseQueue = __spreadArray([], this.pauseQueue, true);
            this.pauseQueue.length = 0;
            logger_1.logger.debug("SEND-QUEUE ".concat(index, ": clearing pause state: pause queue length: ").concat(pauseQueue.length, ", restoring}"));
            pauseQueue.forEach(function (_a) {
                var resolve = _a.resolve, index = _a.index;
                _this.getJob(index).then(resolve);
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
        logger_1.logger.debug("SEND-QUEUE ".concat(index, ": email sent to: ").concat(to));
        logger_1.logger.info("email sent to: ".concat(to));
        this.clearPauseState(index);
    };
    SendQueue.prototype.reportError = function (index, rawmessage, message, id) {
        var _this = this;
        logger_1.logger.debug("SEND-QUEUE ".concat(index, ": unable to send message with id: ").concat(id, "; failed with message: ").concat(message));
        logger_1.logger.error("unable to send message with id: ".concat(id, "; failed with message: ").concat(message));
        this.currentQueue.items.push(rawmessage);
        this.failedCount++;
        if (this.failedCount === config_1.config.sendQueue.failure.retries) {
            logger_1.logger.debug("SEND-QUEUE ".concat(index, ": initiating failure pause, failedCount: ").concat(this.failedCount, ", for: ").concat(config_1.config.sendQueue.failure.pauseMinutes, " minute(s)"));
            this.isPaused = true;
            this.pausedTimeout = setTimeout(function () { return _this.clearPauseState(index); }, config_1.config.sendQueue.failure.pauseMinutes * 60 * 1000);
        }
    };
    SendQueue.prototype.thread = function (index) {
        return __awaiter(this, void 0, void 0, function () {
            var rawmessage, envelope, mailOptions, err_1;
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
                        logger_1.logger.debug("SEND-QUEUE unblocking any previously blocked raw messages");
                        return [4 /*yield*/, jobs_1.Jobs.unblockAll()];
                    case 1:
                        _a.sent();
                        logger_1.logger.debug("SEND-QUEUE starting queue with ".concat(config_1.config.sendQueue.threads, " threads"));
                        for (i = 0; i < config_1.config.sendQueue.threads; i++)
                            this.thread(i);
                        return [2 /*return*/];
                }
            });
        });
    };
    return SendQueue;
}());
exports.sendQueue = new SendQueue();
