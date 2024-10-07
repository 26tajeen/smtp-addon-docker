"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checker = void 0;
var aggregator_1 = require("./aggregator");
var config_1 = require("./config");
var logger_1 = require("./logger");
var Checker = /** @class */ (function () {
    function Checker() {
    }
    Checker.prototype.start = function () {
        var next = function () {
            logger_1.logger.debug("CHECKER adding check");
            aggregator_1.aggregator.addCheck(function () {
                logger_1.logger.debug("CHECKER scheduling next check");
                setTimeout(next, config_1.config.aggregate.checkExpiryEverySeconds * 1000);
            });
        };
        next();
    };
    return Checker;
}());
exports.checker = new Checker();
