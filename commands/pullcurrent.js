exports.name = 'pullcurrent';
exports.hidden = true;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (admincheck(data.userid, data)) {
        if(currentsong.djid != null) {
            bot.remDj(currentsong.djid);
        }
    }
}
