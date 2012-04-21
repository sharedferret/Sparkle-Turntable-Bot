//Changes the bot's username

exports.name = '.setsongstoplay';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    if (admincheck(data.userid)) {
        var newNum = new Number(data.text.substring(16));
        config.songstoplay = newNum;
        bot.speak('Songs to play changed to ' + config.songstoplay);
    }
}