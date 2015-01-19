var panel = $bundle.filter('.schedule');
var nextBtn = panel.find('.js-next');
var prevBtn = panel.find('.js-prev');
var updateGroup = panel.find('.js-update');
var updateBtn = updateGroup.find('button');
var manualTypeahead = panel.find('.typeahead');
var manualBtn = panel.find('.js-manualBtn');
var editModal = $('#agdq15-layouts_editRun');

var runInfo = panel.find('.runInfo');
var runInfoGame = runInfo.find('.runInfo-game');
var runInfoConsole = runInfo.find('.runInfo-console');
var runInfoRunners = runInfo.find('.runInfo-runners');
var runInfoStreamlinks = runInfo.find('.runInfo-streamlinks');
var runInfoEstimate = runInfo.find('.runInfo-estimate');
var runInfoCategory = runInfo.find('.runInfo-category');
var runInfoComments = runInfo.find('.runInfo-comments');
var runInfoIndex = runInfo.find('.runInfo-index');
var nextRun = panel.find('.js-nextRun');

// Init tooltip(s)
panel.find('[data-toggle="tooltip"]').tooltip();

nodecg.declareSyncedVar({
    name: 'schedule',
    setter: function (newVal) {
        var currentRun = nodecg.variables.currentRun;
        if (currentRun && (currentRun.index+1 < newVal.length)) {
            nextRun.html(newVal[currentRun.index+1].game);
        } else {
            nextRun.html("None");
        }

        // TODO: I'm, unsure if re-making the typeahead each time is necessary
        if (manualTypeahead.typeahead) manualTypeahead.typeahead('destroy');
        manualTypeahead.typeahead({
                hint: true,
                highlight: true,
                minLength: 1
            },
            {
                name: 'schedule',
                displayKey: 'game',
                source: substringMatcher(nodecg.variables.schedule),
                templates: {
                    suggestion: function (result) {
                        return '<p class="run-console">' + (result.console || "") + '</p>' +
                            '<p class="run-game">' + result.game + '</p>' +
                            '<p class="run-runners">' + result.runners.join(', ') + '</p>';
                    }
                }
            });
    }
});

nodecg.declareSyncedVar({
    name: 'currentRun',
    setter: function (newVal) {
        updateRunInfo(newVal);

        // Disable "prev" button if at start of schedule
        prevBtn.prop('disabled', newVal.index <= 0);

        // Disable "next" button if at end of schedule
        nextBtn.prop('disabled', newVal.index >= nodecg.variables.schedule.length-1);
    }
});

function updateRunInfo(currentRun) {
    if (Object.keys(currentRun).length) {
        runInfoGame.find('.form-control-static').text(currentRun.game);
        runInfoConsole.find('.form-control-static').text(currentRun.console);
        runInfoRunners.find('.form-control-static').text(currentRun.runners.join(', '));
        runInfoStreamlinks.find('.form-control-static').text(currentRun.streamlinks.join(', '));
        runInfoEstimate.find('.form-control-static').text(currentRun.estimate);
        runInfoCategory.find('.form-control-static').text(currentRun.category);
        runInfoComments.find('.form-control-static').text(currentRun.comments);
        runInfoIndex.find('.form-control-static').text(currentRun.index);

        var schedule = nodecg.variables.schedule;
        if (schedule && (currentRun.index+1 < schedule.length)) {
            nextRun.html(schedule[currentRun.index+1].game);
        } else {
            nextRun.html("None");
        }
    }
}

nextBtn.click(function () {
    var nextIndex = nodecg.variables.currentRun.index + 1;
    nodecg.variables.currentRun = nodecg.variables.schedule[nextIndex];
});
prevBtn.click(function () {
    var prevIndex = nodecg.variables.currentRun.index - 1;
    nodecg.variables.currentRun = nodecg.variables.schedule[prevIndex];
});
updateBtn.click(function () {
    var self = this;
    $(self).prop('disabled', true);
    nodecg.sendMessage('updateSchedule', function (err, updated) {
        if (err) {
            console.error(err.message);
            showUpdateResult(updateGroup, 'danger', 'ERROR! Check console');
            return;
        }

        if (updated) {
            console.info('[agdq15-layouts] Schedule successfully updated');
            showUpdateResult(updateGroup, 'success', 'Got updated schedule!');
        } else {
            console.info('[agdq15-layouts] Schedule unchanged, not updated');
            showUpdateResult(updateGroup, 'default', 'Schedule unchanged, not updating');
        }
    });
});

function showUpdateResult(el, type, msg) {
    var resultEl = el.find('.updateResult-' + type);

    if (resultEl.hasClass('updateResult-show')) {
        console.warn('[agdq15-layouts] Tried to show multiple update results at once for element:', el);
        return;
    }

    var btn = el.find('button');
    resultEl.html(msg).addClass('updateResult-show');
    setTimeout(function () {
        btn.prop('disabled', false);
        resultEl.removeClass('updateResult-show');
    }, 4000)
}

/* Typeahead */
var substringMatcher = function (schedule) {
    return function findMatches(q, cb) {
        var matches, substrRegex;

        // an array that will be populated with substring matches
        matches = [];

        // regex used to determine if a string contains the substring `q`
        substrRegex = new RegExp(q, 'i');

        // iterate through the pool of strings and for any string that
        // contains the substring `q`, add it to the `matches` array
        $.each(schedule, function (i, run) {
            if (substrRegex.test(run.game) || substrRegex.test(run.runners)) {
                // the typeahead jQuery plugin expects suggestions to a
                // JavaScript object, refer to typeahead docs for more info
                matches.push({game: run.game, runners: run.runners, console: run.console, index: run.index});
            }
        });

        cb(matches);
    };
};

manualBtn.click(function () {
    var runIndex = manualTypeahead.data('runIndex');
    if (typeof(runIndex) !== 'number') return;
    nodecg.variables.currentRun = nodecg.variables.schedule[runIndex];
    manualTypeahead.data('runIndex', null);
});

manualTypeahead.bind('typeahead:selected', onTypeaheadSelected);
manualTypeahead.bind('typeahead:autocompleted', onTypeaheadSelected);

function onTypeaheadSelected(obj, datum, name) {
    // Add the currently selected run's index as a data prop
    manualTypeahead.data('runIndex', datum.index);
}

//triggered when modal is about to be shown
editModal.on('show.bs.modal', function(e) {
    // Populate inputs with current values
    editModal.find('input[name="game"]').val(nodecg.variables.currentRun.game);
    editModal.find('input[name="console"]').val(nodecg.variables.currentRun.console);
    editModal.find('input[name="runners"]').val(nodecg.variables.currentRun.runners);
    editModal.find('input[name="streamlinks"]').val(nodecg.variables.currentRun.streamlinks);
    editModal.find('input[name="category"]').val(nodecg.variables.currentRun.category);
    editModal.find('input[name="estimate"]').val(nodecg.variables.currentRun.estimate);
});

editModal.find('.js-save').click(function() {
    var currentRun = nodecg.variables.currentRun;
    currentRun.game = editModal.find('input[name="game"]').val();
    currentRun.console = editModal.find('input[name="console"]').val();
    currentRun.category = editModal.find('input[name="category"]').val();

    var runners = editModal.find('input[name="runners"]').val().split(',');
    runners.forEach(function(runner, index) {
       runners[index] = runner.trim();
    });
    currentRun.runners = runners;

    var streamlinks = editModal.find('input[name="streamlinks"]').val().split(',');
    streamlinks.forEach(function(runner, index) {
        streamlinks[index] = runner.trim();
    });
    currentRun.streamlinks = streamlinks;

    currentRun.estimate = editModal.find('input[name="estimate"]').val();
    nodecg.variables.currentRun = currentRun;
});