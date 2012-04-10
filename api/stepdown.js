exports.name = 'stepdown';
exports.hidden = false;
exports.enabled = true;
exports.handler = function(queryArray, response) {
    if (checkAuth(queryArray.auth)) {
        bot.remDj(config.botinfo.userid);
    }
}