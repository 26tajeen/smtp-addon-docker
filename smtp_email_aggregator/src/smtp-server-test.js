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
var smtp_server_1 = require("smtp-server");
var misc_1 = require("./lib/misc");
var mailparser_1 = require("mailparser");
var fs_extra_1 = require("fs-extra");
var port = 5025;
var server = new smtp_server_1.SMTPServer({
    onData: function (stream, session, callback) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, filePath, mail, _a, from, to, subject, text;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        console.log(JSON.stringify(session, null, 4));
                        timestamp = (new Date()).toISOString();
                        filePath = __dirname + "/../messages/" + timestamp;
                        return [4 /*yield*/, (0, misc_1.streamToFile)(stream, filePath)];
                    case 1:
                        _b.sent();
                        console.log("Message saved: messages/".concat(timestamp));
                        _a = mailparser_1.simpleParser;
                        return [4 /*yield*/, (0, fs_extra_1.readFile)(filePath)];
                    case 2: return [4 /*yield*/, _a.apply(void 0, [_b.sent()])];
                    case 3:
                        mail = _b.sent();
                        from = mail.from, to = mail.to, subject = mail.subject, text = mail.text;
                        console.log(JSON.stringify({ from: from, to: to, subject: subject, text: text }, null, 4));
                        callback();
                        return [2 /*return*/];
                }
            });
        });
    },
    authOptional: true,
    hideSTARTTLS: true
    // onAuth(auth,session,callback) 
    // {
    //     console.log(`auth: username: ${auth.username}; password: ${auth.password}`);
    //     // if (auth.username !== "abc" || auth.password !== "def") {
    //     //   return callback(new Error("Invalid username or password"));
    //     // }
    //     callback(null, { user: 123 }); // where 123 is the user id or similar property
    // }
});
server.listen(port, "0.0.0.0", function () {
    console.log("listening on port ".concat(port));
});
