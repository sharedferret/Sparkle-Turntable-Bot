//Changes the bot's username

exports.name = '.setlimit';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    if (admincheck(data.userid, data)) {
        var val = data.text.split(" ")[1];
        if (val) {
            config.enforcement.songslimit.maxsongs = parseInt(val);
            if (isNaN(config.enforcement.songslimit.maxsongs)) {
                config.enforcement.songslimit.maxsongs = 1;
            }
            config.enforcement.songslimit.maxsongs = Math.max(1, config.enforcement.songslimit.maxsongs);
        }
        bot.speak('Songs to play set to ' + config.enforcement.songslimit.maxsongs);
    }
}
