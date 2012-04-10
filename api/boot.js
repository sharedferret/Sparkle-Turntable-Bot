exports.name = 'boot';
exports.hidden = true;
exports.enabled = true;
exports.handler = function(queryArray, response) {
    if (checkAuth(queryArray.auth)) {
        for (i in usersList) {
            if (queryArray.name == usersList[i].name) {
                bot.boot(i, queryArray.reason);
            }
        }
    }
}