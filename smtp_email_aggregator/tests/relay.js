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
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = void 0;
var smtp_server_1 = require("smtp-server");
var config_1 = require("../src/lib/config");
var logger_1 = require("../src/lib/logger");
var mailparser_1 = require("mailparser");
var sender_1 = require("../src/lib/sender");
var misc_1 = require("../src/lib/misc");
var run = function () { return __awaiter(void 0, void 0, void 0, function () {
    var errorMessage, incomingServer;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, (0, config_1.configSanityCheck)()];
            case 1:
                if (!(_a.sent())) {
                    errorMessage = "config.aggregate.subject and/or config.aggregate.bodyFile do not contain the {name} tag, refusing to start test";
                    logger_1.logger.error(errorMessage);
                    console.log("error: ".concat(errorMessage));
                    return [2 /*return*/];
                }
                incomingServer = new smtp_server_1.SMTPServer({
                    onData: function (stream, session, callback) {
                        return __awaiter(this, void 0, void 0, function () {
                            var rawbody, mail, sep, short_sep, from, to, mailOptions, err_1;
                            return __generator(this, function (_a) {
                                switch (_a.label) {
                                    case 0: return [4 /*yield*/, (0, misc_1.streamToString)(stream)];
                                    case 1:
                                        rawbody = _a.sent();
                                        return [4 /*yield*/, (0, mailparser_1.simpleParser)(rawbody)];
                                    case 2:
                                        mail = _a.sent();
                                        sep = "-------------------------------------------";
                                        short_sep = "------------------------";
                                        from = session.envelope.mailFrom ? session.envelope.mailFrom.address : "";
                                        to = session.envelope.rcptTo.map(function (_a) {
                                            var address = _a.address;
                                            return address;
                                        });
                                        console.log(sep);
                                        console.log("INCOMING MESSAGE");
                                        console.log(sep);
                                        console.log("from: ".concat(from));
                                        console.log("to: ".concat(to.join(",")));
                                        console.log("subject: ".concat(mail.subject));
                                        console.log("body:");
                                        console.log(short_sep);
                                        console.log(mail.text ? mail.text.trim() : "");
                                        if (mail.attachments.length > 0) {
                                            console.log(short_sep);
                                            console.log("attachments:");
                                            console.log(short_sep);
                                            console.log(mail.attachments.map(function (_a) {
                                                var filename = _a.filename;
                                                return "-" + filename;
                                            }).join("\n"));
                                            console.log(short_sep);
                                        }
                                        console.log(sep);
                                        console.log();
                                        mailOptions = {
                                            envelope: { from: from, to: to },
                                            raw: rawbody
                                        };
                                        console.log(sep);
                                        callback();
                                        _a.label = 3;
                                    case 3:
                                        _a.trys.push([3, 5, , 6]);
                                        return [4 /*yield*/, sender_1.sender.sendMail(mailOptions)];
                                    case 4:
                                        _a.sent();
                                        console.log("SUCCESS: email forwarded to smtp server");
                                        return [3 /*break*/, 6];
                                    case 5:
                                        err_1 = _a.sent();
                                        console.log("ERROR: forwarding to smtp server failed: ".concat(err_1.message));
                                        return [3 /*break*/, 6];
                                    case 6:
                                        console.log(sep);
                                        console.log();
                                        return [2 /*return*/];
                                }
                            });
                        });
                    },
                    authOptional: true,
                    hideSTARTTLS: true
                });
                incomingServer.listen(config_1.config.incoming.port, config_1.config.incoming.host, function () {
                    console.log("incoming smtp server listening on port ".concat(config_1.config.incoming.host, ":").concat(config_1.config.incoming.port));
                    console.log();
                });
                return [2 /*return*/];
        }
    });
}); };
exports.run = run;
(0, exports.run)();
