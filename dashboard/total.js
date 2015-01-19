var panel = $bundle.filter('.total');
var totalDisplay = panel.find('.totalDisplay');
var updateGroup = panel.find('.js-update');
var updateBtn = updateGroup.find('button');

var modal = $('#agdq15-layouts_editTotal');
var saveTotal = modal.find('.js-save');
var totalEdit = modal.find('input[name="total"]');

var autoUpdateOnBtn = panel.find('.js-automaticOn');
var autoUpdateOffBtn = panel.find('.js-automaticOff');

nodecg.declareSyncedVar({
    name: 'total',
    setter: function(newVal) {
        totalDisplay.html(parseFloat(newVal).formatMoney());
        totalEdit.val(newVal);
    }
});

nodecg.declareSyncedVar({
    name: 'totalAutoUpdate',
    initialVal: true,
    setter: function(newVal) {
        autoUpdateOnBtn.prop('disabled', newVal);
        autoUpdateOffBtn.prop('disabled', !newVal);
    }
});

autoUpdateOnBtn.click(function() { nodecg.variables.totalAutoUpdate = true });
autoUpdateOffBtn.click(function() { console.log('hey');nodecg.variables.totalAutoUpdate = false });

updateBtn.click(function () {
    var self = this;
    $(self).prop('disabled', true);
    nodecg.sendMessage('updateTotal', function (err, updated) {
        if (err) {
            console.error(err.message);
            showUpdateResult(updateGroup, 'danger', 'ERROR! Check console');
            return;
        }

        if (updated) {
            console.info('[agdq15-layouts] Total successfully updated');
            showUpdateResult(updateGroup, 'success', 'Got current total!');
        } else {
            console.info('[agdq15-layouts] Total unchanged, not updating');
            showUpdateResult(updateGroup, 'default', 'Total unchanged');
        }

    });
});

saveTotal.click(function () {
    nodecg.variables.total = parseFloat(totalEdit.val());
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

Number.prototype.formatMoney = function(decPlaces, thouSeparator, decSeparator, currencySymbol) {
    // check the args and supply defaults:
    decPlaces = isNaN(decPlaces = Math.abs(decPlaces)) ? 2 : decPlaces;
    decSeparator = decSeparator == undefined ? "." : decSeparator;
    thouSeparator = thouSeparator == undefined ? "," : thouSeparator;
    currencySymbol = currencySymbol == undefined ? "$" : currencySymbol;

    var n = this,
        sign = n < 0 ? "-" : "",
        i = parseInt(n = Math.abs(+n || 0).toFixed(decPlaces)) + "",
        j = (j = i.length) > 3 ? j % 3 : 0;

    var formatted = sign + currencySymbol + (j ? i.substr(0, j) + thouSeparator : "") + i.substr(j).replace(/(\d{3})(?=\d)/g, "$1" + thouSeparator) + (decPlaces ? decSeparator + Math.abs(n - i).toFixed(decPlaces).slice(2) : "");

    var parts = formatted.split('.');
    var dollars = parts[0];
    var cents = parts[1];

    return parseInt(cents) === 0
        ? dollars
        : formatted;
};