import {
        logger
} from './logger';
import {
        mqtt
} from './mqtt';

"use strict";
var __awaiter = (this && this.__awaiter) || function(thisArg, _arguments, P, generator) {
        function adopt(value) {
                return value instanceof P ? value : new P(function(resolve) {
                        resolve(value);
                });
        }
        return new(P || (P = Promise))(function(resolve, reject) {
                function fulfilled(value) {
                        try {
                                step(generator.next(value));
                        } catch (e) {
                                reject(e);
                        }
                }

                function rejected(value) {
                        try {
                                step(generator["throw"](value));
                        } catch (e) {
                                reject(e);
                        }
                }

                function step(result) {
                        result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected);
                }
                step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
};
var __generator = (this && this.__generator) || function(thisArg, body) {
        var _ = {
                        label: 0,
                        sent: function() {
                                if (t[0] & 1) throw t[1];
                                return t[1];
                        },
                        trys: [],
                        ops: []
                },
                f, y, t, g;
        return g = {
                next: verb(0),
                "throw": verb(1),
                "return": verb(2)
        }, typeof Symbol === "function" && (g[Symbol.iterator] = function() {
                return this;
        }), g;

        function verb(n) {
                return function(v) {
                        return step([n, v]);
                };
        }

        function step(op) {
                if (f) throw new TypeError("Generator is already executing.");
                while (_) try {
                        if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                        if (y = 0, t) op = [op[0] & 2, t.value];
                        switch (op[0]) {
                                case 0:
                                case 1:
                                        t = op;
                                        break;
                                case 4:
                                        _.label++;
                                        return {
                                                value: op[1], done: false
                                        };
                                case 5:
                                        _.label++;
                                        y = op[1];
                                        op = [0];
                                        continue;
                                case 7:
                                        op = _.ops.pop();
                                        _.trys.pop();
                                        continue;
                                default:
                                        if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) {
                                                _ = 0;
                                                continue;
                                        }
                                        if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) {
                                                _.label = op[1];
                                                break;
                                        }
                                        if (op[0] === 6 && _.label < t[1]) {
                                                _.label = t[1];
                                                t = op;
                                                break;
                                        }
                                        if (t && _.label < t[2]) {
                                                _.label = t[2];
                                                _.ops.push(op);
                                                break;
                                        }
                                        if (t[2]) _.ops.pop();
                                        _.trys.pop();
                                        continue;
                        }
                        op = body.call(thisArg, _);
                } catch (e) {
                        op = [6, e];
                        y = 0;
                } finally {
                        f = t = 0;
                }
                if (op[0] & 5) throw op[1];
                return {
                        value: op[0] ? op[1] : void 0,
                        done: true
                };
        }
};
var __importDefault = (this && this.__importDefault) || function(mod) {
        return (mod && mod.__esModule) ? mod : {
                "default": mod
        };
};
Object.defineProperty(exports, "__esModule", {
        value: true
});
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
import {
        mqtt
} from './mqtt';

var Aggregator = /** @class */ (function() {
                function Aggregator() {
                        this.queue = [];
                        this.jobActive = false;
                }

                Aggregator.prototype.addMessage = function(header, body) {
                        const invoiceSearch = "Please find attached your latest invoices from";
                        const statementSearch = "Please find attached your latest statement from";
                        var _this = this;
                        logger_1.logger.debug(`AGGREGATOR: Adding message with header: ${JSON.stringify(header)}`);
                        this.queue.push(function() {
                                return __awaiter(_this, void 0, void 0, function() {
                                        var rawbody, mail, err_1, lowerText, normalizedInvoiceSearch, normalizedStatementSearch, containsInvoice, containsStatement, type, reverseType_1, name_1, waiting, matches, match, matchMail, bodyText, attachments, composer, message;
                                        return __generator(this, function(_a) {
                                                switch (_a.label) {
                                                        case 0:
                                                                logger_1.logger.debug("AGGREGATOR: Starting message processing");
                                                                return [4 /*yield*/ , (0, misc_1.streamToString)(body)];
                                                        case 1:
                                                                rawbody = _a.sent();
                                                                logger_1.logger.debug("AGGREGATOR: Raw body received: " + rawbody.substring(0, 200) + "...");
                                                                _a.label = 2;
                                                        case 2:
                                                                _a.trys.push([2, 4, , 5]);
                                                                logger_1.logger.debug("AGGREGATOR: About to parse mail");
                                                                return [4 /*yield*/ , (0, mailparser_1.simpleParser)(rawbody)];
                                                        case 3:
                                                                mail = _a.sent();
                                                                logger_1.logger.debug("AGGREGATOR: Parsed mail subject: " + mail.subject);
                                                                logger_1.logger.debug("AGGREGATOR: Parsed mail text: " + mail.text);
                                                                logger_1.logger.debug("AGGREGATOR: Mail object keys: " + Object.keys(mail));
                                                                return [3 /*break*/ , 5];
                                                        case 4:
                                                                err_1 = _a.sent();
                                                                logger_1.logger.error("AGGREGATOR: Error parsing message: " + err_1.message);
                                                                mqtt.reportError(err_1); // Add MQTT error reporting
                                                                return [2 /*return*/ ];
                                                        case 5:
                                                                mail.text = mail.text || "";
                                                                lowerText = mail.text.toLowerCase().replace(/\s+/g, ' ').trim();
                                                                normalizedInvoiceSearch = "invoice";
                                                                normalizedStatementSearch = "statement";
                                                                containsInvoice = lowerText.includes(normalizedInvoiceSearch);
                                                                containsStatement = lowerText.includes(normalizedStatementSearch);
                                                                if (!(containsInvoice || containsStatement)) {
                                                                    logger_1.logger.debug("AGGREGATOR: Email classified as 'no type' because neither invoice nor statement was found.");
                                                                    logger_1.logger.debug("email with no type, addressed to '".concat(header.to, "' with subject '").concat(mail.subject, "': forwarded on to send queue"));
                                                                    logger_1.logger.debug("AGGREGATOR message has no type, forwarding to send queue");
                                                                    mqtt.recordEmailSubject(mail.subject, false);  // Add this line
                                                                    mqtt.recordEmailSent(false); 
                                                                    return [4 /*yield*/ , send_queue_1.sendQueue.add(header, rawbody)];
                                                                }
                                                                type = containsInvoice ? "invoice" : "statement";
                                                                reverseType_1 = (type === "invoice") ? "statement" : "invoice";
                                                                logger_1.logger.debug("AGGREGATOR: Detected email type: " + type);
                                                                const extractName = function() {
                                                                        var firstLine = mail.text.split("\n")[0].trim();
                                                                        logger_1.logger.debug("AGGREGATOR: Extracting name from first line: " + firstLine);
                                                                        var res = /^Dear\s+([\s\S]+),$/.exec(firstLine);
                                                                        if (res) {
                                                                                logger_1.logger.debug("AGGREGATOR: Extracted name: " + res[1]);
                                                                                return res[1];
                                                                        } else {
                                                                                logger_1.logger.debug("AGGREGATOR: Failed to extract name from line: " + firstLine);
                                                                                return null;
                                                                        }
                                                                };
                                                                name_1 = extractName();
                                                                if (!name_1) {
                                                                        logger_1.logger.error("AGGREGATOR: Could not extract name from the email body");
                                                                        logger_1.logger.debug("AGGREGATOR received an invalid message (could not extract name) addressed to ".concat(mail.to, ", with subject: ").concat(mail.subject));
                                                                        return [2 /*return*/ ];
                                                                }

                                                                logger_1.logger.debug("AGGREGATOR: Creating waiting object with params: ".concat(JSON.stringify({
                                                                        from: header.from,
                                                                        to: header.to,
                                                                        name: name_1,
                                                                        fromAddress: (mail.from && (mail.from.value.length > 0)) ? mail.from.value[0] : {
                                                                                address: header.from,
                                                                                name: ""
                                                                        }
                                                                })));

                                                                waiting = new waiting_1.Waiting(header.from, header.to, name_1,
                                                                        (mail.from && (mail.from.value.length > 0)) ?
                                                                        mail.from.value[0] : {
                                                                                address: header.from,
                                                                                name: ""
                                                                        });

                                                                logger_1.logger.debug("AGGREGATOR: Waiting object created: ".concat(JSON.stringify({
                                                                        dirPath: waiting.dirPath,
                                                                        key: waiting.key,
                                                                        fromAddress: waiting.fromAddress
                                                                })));

                                                                return [4 /*yield*/ , waiting.writeHeader()];
                                                        case 6:
                                                                _a.sent();
                                                                // If we got here from the non-matching email case, return
                                                                if (!(containsInvoice || containsStatement)) {
                                                                        return [2 /*return*/ ];
                                                                }
                                                                // Otherwise continue with the rest of the processing
                                                        return [4 /*yield*/ , waiting.loadAllMessages()];
                                                        case 7:
                                                            matches = (_a.sent()).filter(function(_a) {
                                                                var type = _a.type;
                                                                return type === reverseType_1;
                                                            });
                                                                logger_1.logger.debug(`Attempting to match message type '${type}' for customer '${name_1}'. Found ${matches.length} potential matches.`);
                                                                if (!(matches.length > 0)) {
                                                                    logger_1.logger.debug(`No matching ${reverseType_1} found for ${type}. Creating waiting message.`);
                                                                    return [3 /*break*/, 12];
                                                                }
                                                                logger_1.logger.debug("AGGREGATOR match found, about to aggregate");
                                                                match = matches[0];
                                                                mqtt.recordEmailSent(true); // Record paired email
                                                                mqtt.incrementStats('messages_paired');

                                                                return [4 /*yield*/ , match.parseRaw()];
                                                        case 8:
                                                                matchMail = _a.sent();
                                                                bodyText = config_1.config.aggregate.bodyText;
                                                                if (!bodyText) {
                                                                        logger_1.logger.error("config.aggregate.bodyText is empty - sending email with empty body");
                                                                        bodyText = "";
                                                                }

                                                                bodyText = bodyText.split("{name}").join(name_1);
                                                                attachments = [];
                                                                if (type === "invoice") {
                                                                        attachments.push.apply(attachments, (mail.attachments.map(function(_a) {
                                                                                var filename = _a.filename,
                                                                                        content = _a.content;
                                                                                return ({
                                                                                        filename: filename,
                                                                                        content: content
                                                                                });
                                                                        })));
                                                                        attachments.push.apply(attachments, (matchMail.attachments.map(function(_a) {
                                                                                var filename = _a.filename,
                                                                                        content = _a.content;
                                                                                return ({
                                                                                        filename: filename,
                                                                                        content: content
                                                                                });
                                                                        })));
                                                                } else {
                                                                        attachments.push.apply(attachments, (matchMail.attachments.map(function(_a) {
                                                                                var filename = _a.filename,
                                                                                        content = _a.content;
                                                                                return ({
                                                                                        filename: filename,
                                                                                        content: content
                                                                                });
                                                                        })));
                                                                        attachments.push.apply(attachments, (mail.attachments.map(function(_a) {
                                                                                var filename = _a.filename,
                                                                                        content = _a.content;
                                                                                return ({
                                                                                        filename: filename,
                                                                                        content: content
                                                                                });
                                                                        })));
                                                                }

                                                                composer = new mail_composer_1.default({
                                                                        from: waiting.fromAddress,
                                                                        to: waiting.to,
                                                                        subject: config_1.config.aggregate.subject.split("{name}").join(name_1),
                                                                        text: bodyText,
                                                                        attachments: attachments
                                                                });

                                                                logger_1.logger.debug("AGGREGATOR raw mail body composed");
                                                                logger_1.logger.info("email of type '".concat(type, "' addressed to '").concat(header.to, "' with name '").concat(name_1, "': corresponding match found, aggregated and added to send queue"));

                                                                mqtt.recordEmailSubject(config_1.config.aggregate.subject.split("{name}").join(name_1), true);  // Add this line

                                                                return [4 /*yield*/ , send_queue_1.sendQueue.add({
                                                                    from: waiting.fromAddress.address,
                                                                    to: waiting.to
                                                                }, composer.compile().createReadStream())];
                                                        case 9:
                                                                _a.sent();
                                                                return [4 /*yield*/ , match.remove()];
                                                        case 10:
                                                                _a.sent();
                                                                return [4 /*yield*/ , waiting.cleanup()];
                                                        case 11:
                                                                _a.sent();
                                                                logger_1.logger.debug("AGGREGATOR forwarded to send queue and removed match with key: ".concat(match.key));
                                                                return [3 /*break*/ , 15];
                                                        case 12:
                                                                return [4 /*yield*/ , waiting.createMessage(type)];
                                                        case 13:
                                                                message = _a.sent();
                                                                return [4 /*yield*/ , (0, fs_extra_1.writeFile)(message.rawFilePath, rawbody)];
                                                        case 14:
                                                                _a.sent();
                                                                logger_1.logger.info("email of type '" + type + "' addressed to '" + header.to + "' with name '" + name_1 + "': no corresponding match yet, saved");
                                                                logger_1.logger.debug("AGGREGATOR no matched found, stored message with key: ".concat(message.key));
                                                        case 15:
                                                                return [2 /*return*/ ];
                                                }
                                        });
                                });
                        });
                        this.processQueue();
                };

                Aggregator.prototype.addCheck = function(callback) {
                    var _this = this;
                    this.queue.push(function() {
                        return __awaiter(_this, void 0, void 0, function() {
                            var clients, processedTotal, expiredByClient, i, messages, hasUnexpiredMessages, j, message, originalMail, error_1;
                            return __generator(this, function(_a) {
                                switch (_a.label) {
                                    case 0:
                                        _a.trys.push([0, 10, , 11]);
                                        return [4 /*yield*/ , waiting_1.Waiting.loadAll()];
                                    case 1:
                                        clients = _a.sent();
                                        processedTotal = 0;
                                        expiredByClient = new Map();
                                        logger_1.logger.debug("AGGREGATOR performing client check, found clients: ".concat(clients.length));
                                        i = 0;
                                        _a.label = 2;
                                    case 2:
                                        if (!(i < clients.length)) return [3 /*break*/ , 9];
                                        return [4 /*yield*/ , clients[i].loadAllMessages()];
                                    case 3:
                                        messages = _a.sent();
                                        hasUnexpiredMessages = false;
                                        j = 0;
                                        _a.label = 4;
                                    case 4:
                                        if (!(j < messages.length)) return [3 /*break*/ , 7];
                                        message = messages[j];
                                        if (!message.hasExpired()) {
                                            hasUnexpiredMessages = true;
                                            return [3 /*break*/ , 6];
                                        }
                                        // First parse the original message to get its subject
                                        return [4 /*yield*/ , message.parseRaw()];
                                    case 5:
                                        originalMail = _a.sent();
                                        if (originalMail) {
                                            // Increment our counter before logging anything
                                            processedTotal++;
                                            
                                            // Log once per actual expired message
                                            logger_1.logger.info(`Forwarded expired message (${processedTotal}) for Customer with subject: ${originalMail.subject}`);
                                            
                                            // Record the expired message in MQTT
                                            mqtt.recordEmailSent(false);
                                            mqtt.recordEmailSubject(originalMail.subject, false);
                                            
                                            // Then forward and remove the message
                                            return [4 /*yield*/ , message.forwardAndRemove().catch(function(err) {
                                                logger_1.logger.error(`Error forwarding expired ${message.type} for client ${clients[i].name}: ${err.message}`);
                                                mqtt.reportError(err);
                                            })];
                                        }
                                    case 6:
                                        _a.sent();
                                        if (originalMail) {
                                            logger_1.logger.debug(`Cleaned up waiting object for: ${clients[i].name}`);
                                        }
                                        j++;
                                        return [3 /*break*/ , 4];
                                    case 7:
                                        if (!hasUnexpiredMessages) {
                                            logger_1.logger.debug(`No unexpired messages for client ${clients[i].name}, cleaning up`);
                                            return [4 /*yield*/ , clients[i].cleanup().catch(function(err) {
                                                logger_1.logger.error(`Error cleaning up client ${clients[i].name}: ${err.message}`);
                                                mqtt.reportError(err);
                                            })];
                                        } else {
                                            logger_1.logger.debug(`Client ${clients[i].name} still has unexpired messages`);
                                        }
                                        _a.label = 8;
                                    case 8:
                                        i++;
                                        return [3 /*break*/ , 2];
                                    case 9:
                                        if (processedTotal > 0) {
                                            logger_1.logger.info(`AGGREGATOR check complete - processed ${processedTotal} expired messages`);
                                        }
                                        if (callback) callback();
                                        return [3 /*break*/ , 11];
                                    case 10:
                                        error_1 = _a.sent();
                                        logger_1.logger.error(`Error in aggregator check: ${error_1.message}`);
                                        mqtt.reportError(error_1);
                                        return [3 /*break*/ , 11];
                                    case 11:
                                        return [2 /*return*/ ];
                                }
                            });
                        });
                    });
                    this.processQueue();
                };
                                Aggregator.prototype.processQueue = function() {
                                    return __awaiter(this, void 0, void 0, function() {
                                        var job;
                                        const startTime = Date.now(); // Add this line
                                        return __generator(this, function(_a) {
                                            switch (_a.label) {
                                                case 0:
                                                    if (this.jobActive) return [2 /*return*/];
                                                    job = this.queue.shift();
                                                        if (!job) return [3 /*break*/ , 2];
                                                        this.jobActive = true;
                                                        return [4 /*yield*/ , job().catch(err => {
                                                            logger_1.logger.error("Job error:", {
                                                                message: err.message,
                                                                stack: err.stack,
                                                                code: err.code,
                                                                type: err.type,
                                                                details: err,
                                                                // Add these new properties
                                                                fullError: JSON.stringify(err, Object.getOwnPropertyNames(err)),
                                                                processingTime: Date.now() - startTime // Add this if you want timing info
                                                            });
                                                            // Also report to MQTT if available
                                                            if (typeof mqtt !== 'undefined') {
                                                                mqtt.reportError(`Aggregator job error: ${err.message}`);
                                                            }
                                                        })];
                                                case 1:
                                                        _a.sent();
                                                        this.jobActive = false;
                                                        this.processQueue();
                                                        _a.label = 2;
                                                case 2:
                                                        return [2 /*return*/ ];
                                        }
                                });
                        });
                };

                return Aggregator;
        }
        ());

exports.aggregator = new Aggregator();