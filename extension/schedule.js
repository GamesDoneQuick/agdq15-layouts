'use strict';

// Schedule is kept in a google document
var SCHEDULE_KEY = '1eB4mJA3DV5D_gYAEp2lLMXQqqTZLlQRJDsTQOOoVvR8';
var POLL_INTERVAL = 3 * 60 * 1000;

var GoogleSpreadsheet = require('google-spreadsheet');
var Q = require('q');

var nodecg = null;
var scheduleDoc = null;
var lastUpdated = '';

module.exports = function (extensionApi) {
    nodecg = extensionApi;
    nodecg.declareSyncedVar({
        name: 'schedule',
        initialVal: []
    });

    nodecg.declareSyncedVar({
        name: 'currentRun',
        initialVal: {}
    });

    scheduleDoc = new GoogleSpreadsheet(SCHEDULE_KEY);

    // Get initial data
    update();

    // Get latest schedule data every POLL_INTERVAL milliseconds
    nodecg.log.info("Polling schedule every %d seconds...", POLL_INTERVAL / 1000);
    var updateInterval = setInterval(update.bind(this), POLL_INTERVAL);

    // Dashboard can invoke manual updates
    nodecg.listenFor('updateSchedule', function(data, cb) {
        nodecg.log.info("Manual schedule update button pressed, invoking update...");
        clearInterval(updateInterval);
        updateInterval = setInterval(update.bind(this), POLL_INTERVAL);
        update()
            .then(function (wasUpdated) {
                cb(null, wasUpdated);
            }, function (error) {
                cb(error);
            });
    });
};

function update() {
    var deferred = Q.defer();
    scheduleDoc.getInfo(function gotInfo(err, sheet) {
        if (err) {
            var msg = "Could not get schedule data:" + err.message;
            nodecg.log.error(msg);
            deferred.reject(msg);
            return;
        }

        if (sheet.updated === lastUpdated) {
            nodecg.log.info("Schedule has not changed, not updating");
            deferred.resolve(false);
            return;
        }

        lastUpdated = sheet.updated;
        sheet.worksheets[0].getRows(function gotRows(err, rows) {
            if (err) {
                var msg = "Could not get schedule data:" + err.message;
                nodecg.log.error(msg);
                deferred.reject(msg);
                return;
            }

            // Google returns a large amount of data that we don't need. Let's only sync what we DO need.
            var relevantData = [];
            var len = rows.length;
            for (var i = 0; i < len; i++) { // use "for" loop, faster than "forEach"
                // Split up runners string into array of runners
                var runners = rows[i].runners.split(',');
                runners.forEach(function(runner, index) {
                    // Remove excess whitespace at start and end
                    runners[index] = runner.trim();
                });

                // Split up streamlinks string into array of streamlinks
                var streamlinks = rows[i].streamlinks.split(',');
                streamlinks.forEach(function(streamlink, index) {
                    // Remove excess whitespace at start and end
                    streamlinks[index] = streamlink.trim();
                });

                relevantData.push({
                    game: rows[i].game || "Unknown",
                    runners: runners || ["Unknown"],
                    console: rows[i].console || "Unknown",
                    estimate: rows[i].estimate || "Unknown",
                    comments: rows[i].comments || "None",
                    category: rows[i].category || "Any%",
                    startTime: Date.parse(rows[i]['dateandtimeestgmt-5']) || null,
                    streamlinks: streamlinks || ["Unknown"],
                    index: i
                });
            }

            // If no currentRun is set, set one
            if (typeof(nodecg.variables.currentRun.game) === 'undefined') {
                nodecg.variables.currentRun = relevantData[0];
            }

            nodecg.variables.schedule = relevantData;
            nodecg.log.info("Updated schedule, timestamp", lastUpdated);
            deferred.resolve(true);
        });
    });
    return deferred.promise;
}
