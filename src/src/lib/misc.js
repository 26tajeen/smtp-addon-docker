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
exports.safeReadFile = exports.sha1Hash = exports.streamToFile = exports.streamToString = exports.generateRandomKey = void 0;
var crypto_1 = __importDefault(require("crypto"));
var fs_extra_1 = require("fs-extra");
var generateRandomKey = function () {
    return crypto_1.default.randomBytes(20).toString("hex");
};
exports.generateRandomKey = generateRandomKey;
var streamToString = function (stream) { return __awaiter(void 0, void 0, void 0, function () {
    var chunks;
    return __generator(this, function (_a) {
        chunks = [];
        return [2 /*return*/, new Promise(function (resolve, reject) {
                stream.on("data", function (chunk) { return chunks.push(Buffer.from(chunk)); });
                stream.on("error", function (err) { return reject(err); });
                stream.on("end", function () { return resolve(Buffer.concat(chunks).toString("utf8")); });
            })];
    });
}); };
exports.streamToString = streamToString;
var streamToFile = function (stream, outputFilePath) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, new Promise(function (resolve, reject) {
                var fstream = (0, fs_extra_1.createWriteStream)(outputFilePath);
                stream.pipe(fstream);
                stream.on("error", reject);
                fstream.on("close", resolve);
            })];
    });
}); };
exports.streamToFile = streamToFile;
var sha1Hash = function (value, limitLength) {
    if (limitLength === void 0) { limitLength = -1; }
    var shasum = crypto_1.default.createHash("sha1");
    shasum.update(value);
    var ret = shasum.digest("hex");
    if (limitLength >= 0)
        ret = ret.substr(0, limitLength);
    return ret;
};
exports.sha1Hash = sha1Hash;
function safeReadFile(filePath, encoding) {
    return __awaiter(this, void 0, void 0, function () {
        var err_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 5, , 6]);
                    if (!encoding) return [3 /*break*/, 2];
                    return [4 /*yield*/, (0, fs_extra_1.readFile)(filePath, encoding)];
                case 1: return [2 /*return*/, _a.sent()];
                case 2: return [4 /*yield*/, (0, fs_extra_1.readFile)(filePath)];
                case 3: return [2 /*return*/, _a.sent()];
                case 4: return [3 /*break*/, 6];
                case 5:
                    err_1 = _a.sent();
                    return [2 /*return*/, null];
                case 6: return [2 /*return*/];
            }
        });
    });
}
exports.safeReadFile = safeReadFile;
;
