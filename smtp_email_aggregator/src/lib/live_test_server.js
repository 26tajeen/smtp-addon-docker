"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startLiveTestServer = void 0;
var express_1 = __importDefault(require("express"));
var config_1 = require("./config");
var startLiveTestServer = function () {
    var app = (0, express_1.default)();
    app.get("/", function (req, res) {
        res.send("OK");
    });
    app.listen(config_1.config.liveTestServer.port, config_1.config.liveTestServer.host, function () {
        console.log("live test server listening on ".concat(config_1.config.liveTestServer.host, ":").concat(config_1.config.liveTestServer.port));
    });
};
exports.startLiveTestServer = startLiveTestServer;
