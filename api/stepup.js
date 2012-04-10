exports.name = 'stepup';
exports.hidden = false;
exports.enabled = true;
exports.handler = function(queryArray, response) {
    if (checkAuth(queryArray.auth)) {
        bot.addDj();
    }
}