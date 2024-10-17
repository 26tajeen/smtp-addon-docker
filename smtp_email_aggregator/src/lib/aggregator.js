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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.aggregator = void 0;
var mail_composer_1 = __importDefault(require("nodemailer/lib/mail-composer"));
var misc_1 = require("./misc");
var mailparser_1 = require("mailparser");
var logger_1 = require("./logger");
var waiting_1 = require("./waiting");
var config_1 = require("./config");
var paths_1 = require("./paths");
var path_1 = require("path");
var send_queue_1 = require("./send_queue");
var fs_extra_1 = require("fs-extra");
var Aggregator = /** @class */ (function () {
    function Aggregator() {
        this.queue = [];
        this.jobActive = false;
    }
    Aggregator.prototype.addMessage = function (header, body) {
        var _this = this;
        this.queue.push(function () { return __awaiter(_this, void 0, void 0, function () {
            var invoiceSearch, statementSearch, rawbody, mail, err_1, extractName, type, reverseType_1, name_1, waiting, matches, match, matchMail, bodyFilePath, bodyText, attachments, composer, message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        invoiceSearch = "Please find attached your latest invoices from";
                        statementSearch = "Please find attached your latest statement from";
                        return [4 /*yield*/, (0, misc_1.streamToString)(body)];
                    case 1:
                        rawbody = _a.sent();
                        logger_1.logger.debug("AGGREGATOR parsing message");
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, (0, mailparser_1.simpleParser)(rawbody)];
                    case 3:
                        mail = _a.sent();
                        logger_1.logger.debug("AGGREGATOR parsed successfully");
                        return [3 /*break*/, 5];
                    case 4:
                        err_1 = _a.sent();
                        logger_1.logger.debug("AGGREGATOR received a corrupted message");
                        logger_1.logger.error("received a corrupted message");
                        return [2 /*return*/];
                    case 5:
                        mail.text = mail.text || "";
                        extractName = function () {
                            var firstLine = mail.text.split("\n")[0].trim();
                            var res = /^Dear\s+([\s\S]+),$/.exec(firstLine);
                            if (res) {
                                return res[1];
                            }
                            else {
                                return null;
                            }
                        };
                        if (!((mail.text.indexOf(invoiceSearch) !== -1) || (mail.text.indexOf(statementSearch) !== -1))) return [3 /*break*/, 18];
                        type = (mail.text.indexOf(invoiceSearch) !== -1) ? "invoice" : "statement";
                        reverseType_1 = (type === "invoice") ? "statement" : "invoice";
                        logger_1.logger.debug("AGGREGATOR message type is '".concat(type, "', reverse type is '").concat(reverseType_1, "'"));
                        name_1 = extractName();
                        if (!name_1) return [3 /*break*/, 16];
                        logger_1.logger.debug("AGGREGATOR message extracted name is '".concat(name_1, "'"));
                        waiting = new waiting_1.Waiting(header.from, header.to, name_1, (mail.from && (mail.from.value.length > 0)) ?
                            mail.from.value[0] :
                            { address: header.from, name: "" });
                        return [4 /*yield*/, waiting.writeHeader()];
                    case 6:
                        _a.sent();
                        logger_1.logger.debug("AGGREGATOR created/loaded waiting with key: ".concat(waiting.key));
                        return [4 /*yield*/, waiting.loadAllMessages()];
                    case 7:
                        matches = (_a.sent()).filter(function (_a) {
                            var type = _a.type;
                            return type === reverseType_1;
                        });
                        logger_1.logger.debug("AGGREGATOR loaded existing potential matches: ".concat(matches.length));
                        if (!(matches.length > 0)) return [3 /*break*/, 12];
                        logger_1.logger.debug("AGGREGATOR match found, about to aggregate");
                        match = matches[0];
                        return [4 /*yield*/, match.parseRaw()];
                    case 8:
                        matchMail = _a.sent();
                        bodyFilePath = (0, path_1.join)(paths_1.packagePath, config_1.config.aggregate.bodyFile);
                        return [4 /*yield*/, (0, misc_1.safeReadFile)(bodyFilePath, "utf8")];
                    case 9:
                        bodyText = (_a.sent()) || "";
                        if (bodyText === "")
                            logger_1.logger.error("config.aggregate.bodyFile is pointing to a non-existing file or an empty file - sending email with empty body");
                        attachments = [];
                        if (type === "invoice") {
                            attachments.push.apply(attachments, (mail.attachments.map(function (_a) {
                                var filename = _a.filename, content = _a.content;
                                return ({ filename: filename, content: content });
                            })));
                            attachments.push.apply(attachments, (matchMail.attachments.map(function (_a) {
                                var filename = _a.filename, content = _a.content;
                                return ({ filename: filename, content: content });
                            })));
                        }
                        else {
                            attachments.push.apply(attachments, (matchMail.attachments.map(function (_a) {
                                var filename = _a.filename, content = _a.content;
                                return ({ filename: filename, content: content });
                            })));
                            attachments.push.apply(attachments, (mail.attachments.map(function (_a) {
                                var filename = _a.filename, content = _a.content;
                                return ({ filename: filename, content: content });
                            })));
                        }
                        composer = new mail_composer_1.default({
                            from: waiting.fromAddress,
                            to: waiting.to,
                            subject: config_1.config.aggregate.subject.split("{name}").join(waiting.name),
                            text: bodyText.split("{name}").join(waiting.name),
                            attachments: attachments
                        });
                        logger_1.logger.debug("AGGREGATOR raw mail body composed");
                        logger_1.logger.info("email of type '".concat(type, "' addressed to '").concat(header.to, "' with name '").concat(name_1, "': corresponding match found, aggregated and added to send queue"));
                        return [4 /*yield*/, send_queue_1.sendQueue.add(header, composer.compile().createReadStream())];
                    case 10:
                        _a.sent();
                        return [4 /*yield*/, match.remove()];
                    case 11:
                        _a.sent();
                        logger_1.logger.debug("AGGREGATOR forwarded to send queue and removed match with key: ".concat(match.key));
                        return [3 /*break*/, 15];
                    case 12: return [4 /*yield*/, waiting.createMessage(type)];
                    case 13:
                        message = _a.sent();
                        return [4 /*yield*/, (0, fs_extra_1.writeFile)(message.rawFilePath, rawbody)];
                    case 14:
                        _a.sent();
                        logger_1.logger.info("email of type '".concat(type, "' addressed to '").concat(header.to, "' with name '").concat(name_1, "': no corresponding match yet, saved"));
                        logger_1.logger.debug("AGGREGATOR no matched found, stored message with key: ".concat(message.key));
                        _a.label = 15;
                    case 15: return [3 /*break*/, 17];
                    case 16:
                        logger_1.logger.debug("AGGREGATOR received an invalid message (could not extract name) addressed to ".concat(mail.to, ", with subject: ").concat(mail.subject));
                        logger_1.logger.error("received an invalid message (could not extract name) addressed to ".concat(mail.to, ", with subject: ").concat(mail.subject));
                        _a.label = 17;
                    case 17: return [3 /*break*/, 20];
                    case 18:
                        logger_1.logger.info("email with no type, addressed to '".concat(header.to, "' with subject '").concat(mail.subject, "': forwarded on to send queue"));
                        logger_1.logger.debug("AGGREGATOR message has no type, forwarding to send queue");
                        return [4 /*yield*/, send_queue_1.sendQueue.add(header, rawbody)];
                    case 19:
                        _a.sent();
                        _a.label = 20;
                    case 20: return [2 /*return*/];
                }
            });
        }); });
        this.processQueue();
    };
    Aggregator.prototype.addCheck = function (callback) {
        var _this = this;
        this.queue.push(function () { return __awaiter(_this, void 0, void 0, function () {
            var clients, i, messages, j, message;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, waiting_1.Waiting.loadAll()];
                    case 1:
                        clients = _a.sent();
                        logger_1.logger.debug("AGGREGATOR performing client check, found clients: ".concat(clients.length));
                        i = 0;
                        _a.label = 2;
                    case 2:
                        if (!(i < clients.length)) return [3 /*break*/, 8];
                        return [4 /*yield*/, clients[i].loadAllMessages()];
                    case 3:
                        messages = _a.sent();
                        logger_1.logger.debug("AGGREGATOR performing messages check, for client[".concat(i, "]: found messages: ").concat(messages.length));
                        j = 0;
                        _a.label = 4;
                    case 4:
                        if (!(j < messages.length)) return [3 /*break*/, 7];
                        message = messages[j];
                        if (!message.hasExpired()) return [3 /*break*/, 6];
                        logger_1.logger.info("email of type '".concat(message.type, "' addressed to '").concat(clients[i].to, "' with name '").concat(clients[i].name, "': no match found during wait window, adding to send queue"));
                        logger_1.logger.debug("AGGREGATOR client[".concat(i, "] message[").concat(j, "] has expired, forwarding and removing"));
                        return [4 /*yield*/, message.forwardAndRemove()];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6:
                        j++;
                        return [3 /*break*/, 4];
                    case 7:
                        i++;
                        return [3 /*break*/, 2];
                    case 8:
                        logger_1.logger.debug("AGGREGATOR check complete");
                        if (callback)
                            callback();
                        return [2 /*return*/];
                }
            });
        }); });
        this.processQueue();
    };
    Aggregator.prototype.processQueue = function () {
        return __awaiter(this, void 0, void 0, function () {
            var job;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (this.jobActive)
                            return [2 /*return*/];
                        job = this.queue.shift();
                        if (!job) return [3 /*break*/, 2];
                        this.jobActive = true;
                        return [4 /*yield*/, job()];
                    case 1:
                        _a.sent();
                        this.jobActive = false;
                        this.processQueue();
                        _a.label = 2;
                    case 2: return [2 /*return*/];
                }
            });
        });
    };
    return Aggregator;
}());
exports.aggregator = new Aggregator();
