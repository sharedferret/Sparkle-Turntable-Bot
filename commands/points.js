//Checks the number of points cast for a song, as well as
//the number needed for a bonus

exports.name = 'points';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.bonusvote == 'VOTE') {
        var response = (bonusvotepoints + ' awesomes are needed for a bonus (currently '
            + currentsong.up + ').');
        output({text: response, destination: data.source, userid: data.userid});
    } else if (config.bonusvote == 'CHAT') {
        var target = getTarget();
        var response = ('Bonus points: ' + bonuspoints.length + '. Needed: ' + target + '.');
        output({text: response, destination: data.source, userid: data.userid});
    } else if (config.bonusvote == 'DICE') {
        var response = ('The DJ must roll a 4 or higher using /roll to get a bonus.');
        output({text: response, destination: data.source, userid: data.userid});
    }
}