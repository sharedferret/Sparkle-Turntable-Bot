exports.name = 'setavatar';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    if (admincheck(data.userid)) {
        bot.setAvatar(data.text.substring(10));
    }
}