"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.waitingPath = exports.queuePath = exports.dataPath = exports.rawmessagePath = exports.configPath = exports.packagePath = void 0;
var path_1 = require("path");
var fs_extra_1 = require("fs-extra");
exports.packagePath = (0, path_1.resolve)(__dirname, "..", "..");
exports.configPath = (0, path_1.resolve)(exports.packagePath, "config.yaml");
exports.rawmessagePath = (0, path_1.resolve)(exports.packagePath, "rawmessage");
exports.dataPath = (0, path_1.resolve)(exports.packagePath, "data");
exports.queuePath = (0, path_1.resolve)(exports.dataPath, "queue");
exports.waitingPath = (0, path_1.resolve)(exports.dataPath, "waiting");
try {
    (0, fs_extra_1.ensureDirSync)(exports.queuePath);
}
catch (err) {
    console.log("error: unable to write to disk, make sure you have the right permissions");
    process.exit(1);
}
(0, fs_extra_1.ensureDirSync)(exports.waitingPath);
