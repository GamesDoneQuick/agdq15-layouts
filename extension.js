'use strict';

var log = require('../../lib/logger')('agdq15-layouts');

module.exports = function(nodecg) {
    try {
        var schedule = require('./extension/schedule')(nodecg);
    } catch (e) {
        log.error("Failed to load schedule lib:", e.stack);
        process.exit(1);
    }

    try {
        var prizes = require('./extension/prizes')(nodecg);
    } catch (e) {
        log.error(" Failed to load schedule lib:", e.stack);
        process.exit(1);
    }

    try {
        var total = require('./extension/total')(nodecg);
    } catch (e) {
        log.error("Failed to load schedule lib:", e.stack);
        process.exit(1);
    }
};