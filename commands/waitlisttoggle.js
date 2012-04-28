//Toggles the waitlist on/off

exports.name = 'waitlist';
exports.hidden = true;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    if (admincheck(data.userid)) {
        if (data.text.substring(9) == 'on') {
            config.enforcement.waitlist = true;
            waitlist = new Array();
            bot.speak('The waitlist has been turned on.');
        } else if (data.text.substring(9) == 'off') {
            config.enforcement.waitlist = false;
            bot.speak('The waitlist has been turned off.');
        }
    }
}