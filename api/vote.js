exports.name = 'vote';
exports.hidden = true;
exports.enabled = true;
exports.handler = function(queryArray, response) {
    if (checkAuth(queryArray.auth)) {
        if (queryArray.vote == 'up') {
            bot.vote('up');
        } else if (queryArray.vote == 'down') {
            bot.vote('down');
        }
    }
}