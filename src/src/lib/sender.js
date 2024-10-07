"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sender = void 0;
var nodemailer_1 = __importDefault(require("nodemailer"));
var config_1 = require("./config");
exports.sender = nodemailer_1.default.createTransport(config_1.config.outgoing);
