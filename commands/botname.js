//Changes the bot's username

exports.name = '.botname';
exports.hidden = true;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    if (admincheck(data.userid)) {
        bot.modifyName(data.text.substring(9));
    }
}