$(document).on('ncgReady', function() {
    // Selectors for schedule
    var $gameTitle = $('.game-title');
    var $gameCategory = $('.game-srDetails-category');
    var $gameEstimate = $('.game-srDetails-estimate');
    var $runner1 = $('#runner1');
    var $runner2 = $('#runner2');
    var $runner3 = $('#runner3');
    var $runner4 = $('#runner4');
    var runnerEls = [
        $runner1,
        $runner2,
        $runner3,
        $runner4
    ];
    var runnerTls = [
        new TimelineMax({ repeat: -1 }),
        new TimelineMax({ repeat: -1 }),
        new TimelineMax({ repeat: -1 }),
        new TimelineMax({ repeat: -1 })
    ];
    var $totalAmt = $('.footer-total-amount');
    var $upcoming = $('.rotation-upcoming');

    if (window.layoutName !== 'finale') {
        nodecg.declareSyncedVar({
            name: 'schedule',
            setter: function(newVal) {
                var currentRun = nodecg.variables.currentRun;
                if (currentRun) {
                    var len = newVal.length;
                    for (var i = 0; i < len; i++) {
                        if (currentRun.name === newVal[i].name) {
                            var newIndexOfCurrentRun = newVal[i].index;
                        }
                    }

                    var nextRun = newVal[newIndexOfCurrentRun + 1];
                    setOnDeck(nextRun);
                } else {
                    // default to second run
                    setOnDeck(newVal[1]);
                }
                
                generateUpcoming();
            }
        });

        nodecg.declareSyncedVar({
            name: 'currentPrizes',
            setter: function(newVal) {
                makeRotationTimeline(newVal);
            }
        });

        nodecg.declareSyncedVar({
            name: 'currentRun',
            initialVal: 0,
            setter: function(newVal) {
                setCurrentRun(newVal);

                var nextRun = nodecg.variables.schedule[newVal.index + 1];
                setOnDeck(nextRun);
                generateUpcoming();
            }
        });
    }

    nodecg.declareSyncedVar({
        name: 'total',
        initialVal: 0,
        setter: function(newVal) {
            var mony = parseFloat(newVal).formatMoney(); //#verifyvenuz
            if ($totalAmt.text() == mony) return;
            var tl = new TimelineLite();
            tl.to($totalAmt, 0.4, {
                opacity: 0,
                onComplete: function() {
                    $totalAmt.html(mony);
                }
            });
            tl.to($totalAmt, 0.4, {
                opacity: 1
            });
        }
    });

    function setCurrentRun(run) {
        if (window.noCurrentRun) return;

        TweenLite.set($gameTitle, {perspective:400});
        TweenLite.set($gameEstimate, {perspective:400});

        var tl = new TimelineLite({ paused: true }),
            splits = {};

        if ($gameTitle.text().trim() !== run.game) {
            $gameTitle.html(run.game);
            textFit($gameTitle, { multiLine: false, maxFontSize: parseInt($gameTitle.css('font-size')) });
            splits.$gameTitle = new SplitText($gameTitle.children('.textFitted'), {type:"chars"});
            tl.staggerFrom(splits.$gameTitle.chars, 0.8, {opacity:0, scale:0, y:80, rotationX:180, transformOrigin:"0% 50% -50",  ease:Back.easeOut}, 0.01, "0");
        }

        // Estimate does not need to be textFit
        if ($gameEstimate.text().trim() !== run.estimate) {
            $gameEstimate.html(run.estimate);
            splits.$gameEstimate = new SplitText($gameEstimate, {type:"chars"});
            tl.staggerFrom(splits.$gameEstimate.chars, 0.8, {opacity:0, y:-10, ease:Back.easeOut}, 0.01, "0");
        }

        if ($gameCategory.text().replace(' - EST:', '').trim() !== run.category) {
            $gameCategory.html(run.category + ' - EST:');
            textFit($gameCategory, { multiLine: false, maxFontSize: parseInt($gameCategory.css('font-size')) });
            splits.$gameCategory = new SplitText($gameCategory.children('.textFitted'), {type:"chars"});
            tl.staggerFrom(splits.$gameCategory.chars, 0.8, {opacity:0, y:-10, ease:Back.easeOut}, 0.01, "0");
        }
        
        runnerEls.forEach(function($el, i) {
            // check if the selector has any elements, most views don't actually have 4 runners
            if (!$el[0]) return;

            // check if there is a runner for this el first
            if (!run.runners[i]) {
                $el.html('Running Person');
                $el.data('runners', '');
                $el.data('streamlinks', '');
                return;
            }

            // if no change, return
            if ($el.data('runners') === run.runners[i] && $el.data('streamlinks') === run.streamlinks[i]) return;
            $el.data('runners', run.runners[i]);
            $el.data('streamlinks', run.streamlinks[i]);

            runnerTls[i].pause();
            runnerTls[i].seek(0);
            runnerTls[i].clear();

            // if runner's name and twitch channel are identical, just use twitch channel
            var isNameEqualToTwitch = run.runners[i].toLowerCase() === (run.streamlinks[i] || '').toLowerCase();
            var twitchName = '<i class="fa fa-twitch"></i>&nbsp' + run.streamlinks[i];
            var initialName = '';
            if (isNameEqualToTwitch) {
                initialName = twitchName;
            } else {
                initialName = run.runners[i];
            }

            // initial swap anim from old name to new name
            tl.to($el.children('.textFitted'), 0.3, {
                left: '30px',
                opacity: '0',
                ease: Power1.easeIn,
                onComplete: function() {
                    $el.html(initialName);
                    textFit($el, { multiLine: false, alignVert: true, maxFontSize: parseInt($el.css('font-size')) });
                    tl.from($el.children('.textFitted'), 0.3, {
                        left: '-30px',
                        opacity: '0',
                        ease: Power1.easeOut
                    }, '0.3');
                }
            }, '0');

            // if runner doesn't have a twitch channel, return
            if (!run.streamlinks[i]) return;

            // if name and twitch channel are identical, return
            if (isNameEqualToTwitch) return;

            // else, name and twitch channel aren't identical and we must alternate between them
            [twitchName, run.runners[i]].forEach(function(name) {
                runnerTls[i].set($el, {
                    onStart: function() {
                        TweenLite.to($el.children('.textFitted'), 0.3, {
                            left: '30px',
                            opacity: '0',
                            ease: Power1.easeIn,
                            onComplete: function() {
                                $el.html(name);
                                textFit($el, { multiLine: false, alignVert: true, maxFontSize: parseInt($el.css('font-size')) });
                                TweenLite.from($el.children('.textFitted'), 0.3, {
                                    left: '-30px',
                                    opacity: '0',
                                    ease: Power1.easeOut
                                }, '0.3');
                            }
                        });
                    }
                }, '+=30');
            });
            
            runnerTls[i].play();
        });
        
        tl.play();
    }

    /**************/
    /*  ROTATION  */
    /**************/
    var $sponsors = $('.rotation-sponsors');
    var $prizes = $('.rotation-prize');
    var $prizeImg = $('.rotation-prize-img');
    var $prizeName = $('.rotation-prize-name');
    var $prizeMin = $('.rotation-prize-min');
    var $deck = $('.rotation-deck');
    var $deckGame = $('.rotation-deck-game');
    var $deckTimer = $('.rotation-deck-timer');

    // set up rotation area... rotation
    var rotationTl = new TimelineMax({ repeat: -1 });
    function makeRotationTimeline(prizes) {
        prizes = prizes || nodecg.variables.currentPrizes;

        rotationTl.pause();
        rotationTl.seek(0);
        rotationTl.clear();
        rotationTl.to($sponsors, 0.5, { opacity: 0 }, window.layoutName === 'curtain' ? '+=10' : '+=90');

        if (prizes) {
            prizes.forEach(function(prize) {
                rotationTl.to($prizes, 0.5, {
                    onStart: function() {
                        $prizeImg.css('background-image', 'url("'+ prize.image +'")');
                        $prizeName.html(prize.name);
                        $prizeMin.html('Min. Donation: ' + parseFloat(prize.minimumbid).formatMoney());
                    },
                    /*onComplete: function() {
                        rotationTl.pause();
                    },*/
                    opacity: 1
                });
                rotationTl.to($prizes, 0.5, { opacity: 0 }, '+=6');
            });
        }

        if (!window.noDeck) {
            rotationTl.to($deck, 0.5, { opacity: 1 });
            rotationTl.to($deck, 0.5, { opacity: 0 }, '+=6');
        }

        if (window.layoutName === 'curtain') {
            rotationTl.to($upcoming, 0.5, { opacity: 1 });
            rotationTl.to($upcoming, 0.5, { opacity: 0 }, '+=60');
        }

        rotationTl.to($sponsors, 0.5, { opacity: 1 });
        rotationTl.play();
    }

    var deckTimerTicker = null;
    function setOnDeck(run) {
        if (!run) return;

        $deckGame.html(run.game);
        textFit($deckGame, { multiLine: false, maxFontSize: parseInt($deckGame.css('font-size')) });

        clearInterval(deckTimerTicker);
        if(run.startTime === null) {
            $deckTimer.html('');
        } else {
            deckTimerTicker = setInterval(function() {
                var timeLeft = run.startTime - Date.now(); // milliseconds
                if (timeLeft < 0) {
                    clearInterval(deckTimerTicker);
                    $deckTimer.html('');
                } else {
                    $deckTimer.html('ETA ' + msToTime(timeLeft));
                }
            }, 1000)
        }
    }

    /***************/
    /*   CURTAIN   */
    /***************/
    function generateUpcoming() {
        if (window.layoutName !== 'curtain') return;

        var schedule = nodecg.variables.schedule;
        var currentRun = nodecg.variables.currentRun;

        if (!schedule || !currentRun) return;

        // fill the upcomingRuns array with the next 3 runs (if there are that many left)
        var runIdx = null;
        $upcoming.html('<div class="rotation-upcoming-label">Coming up...</div>');
        for (var i = 0; i < 3; i++) {
            runIdx = parseInt(currentRun.index) + i;
            if (!schedule[runIdx]) continue;
            $upcoming.append(
                '<div class="rotation-upcoming-run">' +
                    '<div class="rotation-upcoming-run-title font-gameGirl">'+ schedule[runIdx].game +'</div>' +
                    '<div class="rotation-upcoming-run-runners">'+ schedule[runIdx].runners.join(', ') +'</div>' +
                '</div>'
            );

        }

    }
});

function msToTime(duration) {
    var milliseconds = parseInt((duration%1000)/100)
        , seconds = parseInt((duration/1000)%60)
        , minutes = parseInt((duration/(1000*60))%60)
        , hours = parseInt((duration/(1000*60*60))%24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds;
}