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
var nodemailer_1 = __importDefault(require("nodemailer"));
var mailparser_1 = require("mailparser");
var winston_1 = __importDefault(require("winston"));
var _a = winston_1.default.format, combine = _a.combine, timestamp = _a.timestamp, label = _a.label, prettyPrint = _a.prettyPrint;
var send_queue_1 = require("./lib/send_queue");
var fs_1 = require("fs");
var paths_1 = require("./lib/paths");
var fs_extra_1 = require("fs-extra");
var sender_1 = require("./lib/sender");
var aggregator_1 = require("./lib/aggregator");
var waiting_1 = require("./lib/waiting");
var mail_composer_1 = __importDefault(require("nodemailer/lib/mail-composer"));
var smtpConfig = {
    host: "smtp.mail.yahoo.com",
    port: 465,
    secure: true,
    auth: {
        user: "domado16@yahoo.com",
        pass: "beyzbcxqyyunhzlp"
    }
};
var transporter = nodemailer_1.default.createTransport(smtpConfig);
// const mailOptions = {
//     envelope: {
//         from: "domado16@yahoo.com",
//         to: "dominique.adolphe@gmail.com"
//     },
//     raw: {
//         path: "/home/mecrogenesis/Organizations/co.prethora/@typescript/smtp_email_aggregator_relay/rawmessage"
//     }
// };
// transporter.sendMail(mailOptions,(error,info) =>
// {
//     if (error)
//     {
//         return console.log("error",error);
//     }
//     console.log("Message sent: "+info.response);
// });
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var message1, message2, mail1, mail2, mailOptions;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                message1 = (0, fs_extra_1.readFileSync)(paths_1.packagePath + "/messages/2021-11-25T15:56:07.586Z", "utf8");
                message2 = (0, fs_extra_1.readFileSync)(paths_1.packagePath + "/messages/2021-11-25T15:56:14.992Z", "utf8");
                return [4 /*yield*/, (0, mailparser_1.simpleParser)(message1)];
            case 1:
                mail1 = _a.sent();
                return [4 /*yield*/, (0, mailparser_1.simpleParser)(message2)];
            case 2:
                mail2 = _a.sent();
                mailOptions = {
                    from: "Dominiqe Adolphe <domado16@yahoo.com>",
                    // to: "shop@pextons.co.uk",
                    to: "dominique.adolphe@gmail.com",
                    subject: "Consolidated Invoice and Statement for The Good Food Shop",
                    text: "Dear The Good Food Shop,\n\nPlease find attached your latest invoices and statement from Pextons Hardware.\n        \nThank you for shopping with us.",
                    attachments: [
                        { filename: mail1.attachments[0].filename, content: mail1.attachments[0].content },
                        { filename: mail2.attachments[0].filename, content: mail2.attachments[0].content }
                    ]
                };
                sender_1.sender.sendMail(mailOptions, function (error, info) {
                    if (error) {
                        return console.log("error", error);
                    }
                    console.log("Message sent: " + info.response);
                });
                return [2 /*return*/];
        }
    });
}); }); // ();
(function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        send_queue_1.sendQueue.start();
        return [2 /*return*/];
    });
}); }); //();
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var rstream, header;
    return __generator(this, function (_a) {
        rstream = (0, fs_1.createReadStream)(__dirname + "/../messages/invoice.mail");
        header = {
            from: "domado16@yahoo.com",
            to: "dominique.adolphe@gmail.com"
        };
        aggregator_1.aggregator.addMessage(header, rstream);
        return [2 /*return*/];
    });
}); }); //();
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var w;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, waiting_1.Waiting.load("d70761bff6587b7255e0cea6c362d88685baaa6d")];
            case 1:
                w = _a.sent();
                return [2 /*return*/];
        }
    });
}); }); //();
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var composer, tmpMessagePath, _a, _b, mailOptions;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                composer = new mail_composer_1.default({
                    from: "Dominique Adolphe <domado16@yahoo.com>",
                    to: "dominique.adolphe@gmail.com",
                    subject: "this is the subject 2",
                    text: "this is the email body",
                    attachments: [
                        {
                            filename: "tsconfig.json",
                            path: "/home/mecrogenesis/Organizations/co.prethora/@typescript/smtp_email_aggregator_relay/tsconfig.json"
                        }
                    ]
                });
                tmpMessagePath = __dirname + "/../tmpmessage";
                _a = fs_extra_1.writeFile;
                _b = [tmpMessagePath];
                return [4 /*yield*/, composer.compile().build()];
            case 1: return [4 /*yield*/, _a.apply(void 0, _b.concat([_c.sent()]))];
            case 2:
                _c.sent();
                mailOptions = {
                    envelope: {
                        from: "domado16@yahoo.com",
                        to: "dominique.adolphe@gmail.com"
                    },
                    raw: {
                        path: tmpMessagePath
                    }
                };
                return [4 /*yield*/, sender_1.sender.sendMail(mailOptions)];
            case 3:
                _c.sent();
                console.log("done");
                return [2 /*return*/];
        }
    });
}); }); //();
(function () { return __awaiter(void 0, void 0, void 0, function () {
    var waiting, _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                waiting = new waiting_1.Waiting("domado16@yahoo.com", "bob.dilan@gmail.com", "Dom Dom", { address: "domado16@yahoo.com", name: "Dominique Adolphe" });
                return [4 /*yield*/, waiting.writeHeader()];
            case 1:
                _c.sent();
                waiting = new waiting_1.Waiting("domado16@yahoo.com", "johnjohn@gmail.com", "Bing Bing", { address: "domado16@yahoo.com", name: "Dominique Adolphe" });
                return [4 /*yield*/, waiting.writeHeader()];
            case 2:
                _c.sent();
                _b = (_a = console).log;
                return [4 /*yield*/, waiting_1.Waiting.loadAll()];
            case 3:
                _b.apply(_a, [_c.sent()]);
                return [2 /*return*/];
        }
    });
}); })();
