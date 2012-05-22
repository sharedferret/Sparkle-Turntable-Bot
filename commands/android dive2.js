//Removes the user from the stage

exports.name = '\\/stagedive';
exports.hidden = true;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    bot.remDj(data.userid);
}