//Removes the user from the stage

exports.name = '\\/dive';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    bot.remDj(data.userid);
}