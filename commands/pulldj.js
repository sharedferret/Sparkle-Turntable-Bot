exports.name = 'pulldj';
exports.hidden = true;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (admincheck(data.userid)) {
        if (!userstepped) {
            bot.remDj(usertostep);
        }
    }
}