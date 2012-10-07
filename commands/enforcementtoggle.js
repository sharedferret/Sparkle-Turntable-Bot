//Toggles the waitlist on/off

exports.name = '.enforcement';
exports.hidden = true;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    if (admincheck(data.userid)) {
        if (data.text.substring(13) == 'on') {
            config.enforcement.enforceroom = true;
            bot.speak('Room enforcement has been turned on.');
            for (i in djs) {
                djs[i].remaining = config.enforcement.songstoplay;
            }
        } else if (data.text.substring(13) == 'off') {
            config.enforcement.enforceroom = false;
            bot.speak('Room enforcement has been turned off.');
            for (i in djs) {
                djs[i].remaining = config.enforcement.songstoplay - djs[i].remaining;
            }
        }
    }
}