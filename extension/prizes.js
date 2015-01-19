'use strict';

// The list of currently active prizes can be retrieved from this url
var PRIZES_URL = 'https://gamesdonequick.com/tracker/search/?type=prize&feed=current';
var POLL_INTERVAL = 3 * 60 * 1000;

var util = require('util');
var Q = require('q');
var request = require('request');

var nodecg = null;

module.exports = function (extensionApi) {
    nodecg = extensionApi;
    nodecg.declareSyncedVar({
        name: 'currentPrizes',
        initialVal: []
    });

    // Get initial data
    update();

    // Get latest prize data every POLL_INTERVAL milliseconds
    nodecg.log.info("Polling prizes every %d seconds...", POLL_INTERVAL / 1000);
    var updateInterval = setInterval(update.bind(this), POLL_INTERVAL);

    // Dashboard can invoke manual updates
    nodecg.listenFor('updatePrizes', function(data, cb) {
        nodecg.log.info("Manual prize update button pressed, invoking update...");
        clearInterval(updateInterval);
        updateInterval = setInterval(update.bind(this), POLL_INTERVAL);
        update()
            .then(function (updated) {
                cb(null, updated);
            }, function (error) {
                cb(error);
            });
    });
};

function update() {
    var deferred = Q.defer();
    request(PRIZES_URL, function (error, response, body) {
        if (!error && response.statusCode == 200) {
            var prizes = JSON.parse(body);

            var relevantData = [];
            var len = prizes.length;
            for (var i = 0; i < len; i++) { // "for" loop is faster than "forEach"
                relevantData.push({
                    name: prizes[i].fields.name,
                    description: prizes[i].fields.description,
                    image: prizes[i].fields.image,
                    minimumbid: prizes[i].fields.minimumbid
                });
            }

            if (JSON.stringify(relevantData) != JSON.stringify(nodecg.variables.currentPrizes)) {
                nodecg.variables.currentPrizes = relevantData;
                nodecg.log.info("Updated prizes, %d active", relevantData.length);
                deferred.resolve(true);
            } else {
                nodecg.log.info("Prizes unchanged, %d active", relevantData.length);
                deferred.resolve(false);
            }
        } else {
            var msg = '';
            if (error) msg = util.format("Could not get prizes:", error.message);
            else if (response) msg = util.format("Could not get prizes, response code %d", response.statusCode);
            else msg = util.format("Could not get prizes, unknown error");
            nodecg.log.error(msg);
            deferred.reject(msg);
        }
    });
    return deferred.promise;
}
