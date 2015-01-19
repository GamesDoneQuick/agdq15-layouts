var panel = $bundle.filter('.prizes');
var prizeTable = panel.find('table');
var updateGroup = panel.find('.js-update');
var updateBtn = updateGroup.find('button');

nodecg.declareSyncedVar({
    name: 'currentPrizes',
    setter: function(newVal) {
        var html = '';
        newVal.forEach(function(prize) {
            html += '<tr><td>' + prize.name + '</td>' +
            '<td>' + prize.description + '</td>' +
            '<td>' + prize.minimumbid + '</td>' +
            '<td><a target="_blank" href="' + prize.image + '">[Link]</a></td></tr>';
        });
        prizeTable.find('tbody').html(html);
    }
});

updateBtn.click(function () {
    var self = this;
    $(self).prop('disabled', true);
    nodecg.sendMessage('updatePrizes', function (err, updated) {
        if (err) {
            console.error(err.message);
            showUpdateResult(updateGroup, 'danger', 'ERROR! Check console');
            return;
        }

        if (updated) {
            console.info('[agdq15-layouts] Prizes successfully updated');
            showUpdateResult(updateGroup, 'success', 'Got current prizes!');
        } else {
            console.info('[agdq15-layouts] Prizes unchanged, not updating');
            showUpdateResult(updateGroup, 'default', 'Prizes unchanged, not updating');
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