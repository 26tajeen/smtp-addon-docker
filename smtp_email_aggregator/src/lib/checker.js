"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checker = void 0;
var aggregator_1 = require("./aggregator");
var config_1 = require("./config");
var logger_1 = require("./logger");

// Add this line to get the config object
var config = config_1.default;

var Checker = /** @class */ (function () {
    function Checker() {
    }
    Checker.prototype.start = function () {
        var next = function () {
            logger_1.logger.debug("CHECKER adding check");
            aggregator_1.aggregator.addCheck(function () {
                logger_1.logger.debug("CHECKER scheduling next check");
                // Use a default value if config.aggregate.checkExpiryEverySeconds is undefined
                var checkExpiryEverySeconds = (config && config.aggregate && config.aggregate.checkExpiryEverySeconds) || 10; // Default to 10 seconds
                setTimeout(next, checkExpiryEverySeconds * 1000);
            });
        };
        next();
    };
    return Checker;
}());
exports.checker = new Checker();