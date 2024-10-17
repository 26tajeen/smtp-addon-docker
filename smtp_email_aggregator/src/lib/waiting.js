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
exports.WaitingMessage = exports.Waiting = void 0;
var misc_1 = require("./misc");
var paths_1 = require("./paths");
var path_1 = require("path");
var fs_extra_1 = require("fs-extra");
var config_1 = require("./config");
var mailparser_1 = require("mailparser");
var fs_1 = require("fs");
var send_queue_1 = require("./send_queue");
var Waiting = /** @class */ (function () {
    function Waiting(from, to, name, fromAddress) {
        this.from = from;
        this.to = to;
        this.name = name;
        this.fromAddress = fromAddress;
        this.key = this.calcKey();
    }
    Object.defineProperty(Waiting.prototype, "dirPath", {
        get: function () {
            return (0, path_1.join)(paths_1.waitingPath, this.key);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(Waiting.prototype, "headerFilePath", {
        get: function () {
            return (0, path_1.join)(this.dirPath, "header");
        },
        enumerable: false,
        configurable: true
    });
    Waiting.prototype.ensureDirPath = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fs_extra_1.ensureDir)(this.dirPath)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Waiting.prototype.writeHeader = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, from, to, name, fromAddress;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this, from = _a.from, to = _a.to, name = _a.name, fromAddress = _a.fromAddress;
                        return [4 /*yield*/, this.ensureDirPath()];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, (0, fs_extra_1.writeFile)(this.headerFilePath, JSON.stringify({ from: from, to: to, name: name, fromAddress: fromAddress }))];
                    case 2:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    Waiting.prototype.readHeader = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, from, to, name, fromAddress, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _c = (_b = JSON).parse;
                        return [4 /*yield*/, (0, fs_extra_1.readFile)(this.headerFilePath, "utf8")];
                    case 1:
                        _a = _c.apply(_b, [_d.sent()]), from = _a.from, to = _a.to, name = _a.name, fromAddress = _a.fromAddress;
                        this.from = from;
                        this.to = to;
                        this.name = name;
                        this.fromAddress = fromAddress;
                        return [2 /*return*/];
                }
            });
        });
    };
    Waiting.prototype.calcKey = function () {
        var _a = this, from = _a.from, to = _a.to, name = _a.name;
        return (0, misc_1.sha1Hash)([from.toLowerCase().trim(), to.toLowerCase().trim(), name.toLowerCase().trim()].join("<-->"), 40);
    };
    Waiting.prototype.createMessage = function (type) {
        return __awaiter(this, void 0, void 0, function () {
            var ret;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ret = new WaitingMessage(this, type);
                        return [4 /*yield*/, ret.writeHeader()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, ret];
                }
            });
        });
    };
    Waiting.prototype.loadMessage = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var ret;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ret = new WaitingMessage(this, "invoice");
                        ret.key = key;
                        return [4 /*yield*/, ret.readHeader()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, ret];
                }
            });
        });
    };
    Waiting.prototype.loadAllMessages = function () {
        return __awaiter(this, void 0, void 0, function () {
            var ret, entities, i, entity, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        ret = [];
                        return [4 /*yield*/, (0, fs_extra_1.readdir)(this.dirPath)];
                    case 1:
                        entities = _c.sent();
                        i = 0;
                        _c.label = 2;
                    case 2:
                        if (!(i < entities.length)) return [3 /*break*/, 6];
                        entity = entities[i];
                        return [4 /*yield*/, (0, fs_extra_1.stat)((0, path_1.join)(this.dirPath, entity))];
                    case 3:
                        if (!(((_c.sent()).isDirectory()) && (/^[0-9a-f]{40}$/.test(entity)))) return [3 /*break*/, 5];
                        _b = (_a = ret).push;
                        return [4 /*yield*/, this.loadMessage(entity)];
                    case 4:
                        _b.apply(_a, [_c.sent()]);
                        _c.label = 5;
                    case 5:
                        i++;
                        return [3 /*break*/, 2];
                    case 6: return [2 /*return*/, ret];
                }
            });
        });
    };
    Waiting.load = function (key) {
        return __awaiter(this, void 0, void 0, function () {
            var ret;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        ret = new Waiting("", "", "", { address: "", name: "" });
                        ret.key = key;
                        return [4 /*yield*/, ret.readHeader()];
                    case 1:
                        _a.sent();
                        return [2 /*return*/, ret];
                }
            });
        });
    };
    Waiting.loadAll = function () {
        return __awaiter(this, void 0, void 0, function () {
            var ret, entities, i, entity, _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        ret = [];
                        return [4 /*yield*/, (0, fs_extra_1.readdir)(paths_1.waitingPath)];
                    case 1:
                        entities = _c.sent();
                        i = 0;
                        _c.label = 2;
                    case 2:
                        if (!(i < entities.length)) return [3 /*break*/, 6];
                        entity = entities[i];
                        return [4 /*yield*/, (0, fs_extra_1.stat)((0, path_1.join)(paths_1.waitingPath, entity))];
                    case 3:
                        if (!(((_c.sent()).isDirectory()) && (/^[0-9a-f]{40}$/.test(entity)))) return [3 /*break*/, 5];
                        _b = (_a = ret).push;
                        return [4 /*yield*/, Waiting.load(entity)];
                    case 4:
                        _b.apply(_a, [_c.sent()]);
                        _c.label = 5;
                    case 5:
                        i++;
                        return [3 /*break*/, 2];
                    case 6: return [2 /*return*/, ret];
                }
            });
        });
    };
    return Waiting;
}());
exports.Waiting = Waiting;
var WaitingMessage = /** @class */ (function () {
    function WaitingMessage(parent, type) {
        this.parent = parent;
        this.key = (0, misc_1.generateRandomKey)();
        this.timestamp = (new Date()).getTime();
        this.type = type;
    }
    Object.defineProperty(WaitingMessage.prototype, "dirPath", {
        get: function () {
            return (0, path_1.join)(this.parent.dirPath, this.key);
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WaitingMessage.prototype, "rawFilePath", {
        get: function () {
            return (0, path_1.join)(this.dirPath, "raw.mail");
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(WaitingMessage.prototype, "headerFilePath", {
        get: function () {
            return (0, path_1.join)(this.dirPath, "header");
        },
        enumerable: false,
        configurable: true
    });
    WaitingMessage.prototype.parseRaw = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, mailparser_1.simpleParser)((0, fs_1.createReadStream)(this.rawFilePath))];
                    case 1: return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
    WaitingMessage.prototype.ensureDirPath = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fs_extra_1.ensureDir)(this.dirPath)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    WaitingMessage.prototype.writeHeader = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, timestamp, type;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this, timestamp = _a.timestamp, type = _a.type;
                        return [4 /*yield*/, this.ensureDirPath()];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, (0, fs_extra_1.writeFile)(this.headerFilePath, JSON.stringify({ timestamp: timestamp, type: type }))];
                    case 2:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    WaitingMessage.prototype.readHeader = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, timestamp, type, attachments, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _c = (_b = JSON).parse;
                        return [4 /*yield*/, (0, fs_extra_1.readFile)(this.headerFilePath, "utf8")];
                    case 1:
                        _a = _c.apply(_b, [_d.sent()]), timestamp = _a.timestamp, type = _a.type, attachments = _a.attachments;
                        this.timestamp = timestamp;
                        this.type = type;
                        return [2 /*return*/];
                }
            });
        });
    };
    WaitingMessage.prototype.hasExpired = function () {
        var elapsed = (new Date()).getTime() - this.timestamp;
        var waitForUpTo = (config_1.config.aggregate.waitForUpToMinutes * 60 * 1000);
        return elapsed >= waitForUpTo;
    };
    WaitingMessage.prototype.remove = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, (0, fs_extra_1.rm)(this.dirPath, { recursive: true })];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    WaitingMessage.prototype.forwardAndRemove = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _a, from, to;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = this.parent, from = _a.from, to = _a.to;
                        return [4 /*yield*/, send_queue_1.sendQueue.add({ from: from, to: to }, (0, fs_1.createReadStream)(this.rawFilePath))];
                    case 1:
                        _b.sent();
                        return [4 /*yield*/, this.remove()];
                    case 2:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return WaitingMessage;
}());
exports.WaitingMessage = WaitingMessage;
