exports.name = '\\/dance';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if ((config.bonusvote == 'CHAT') && (bonuspoints.indexOf(data.name) == -1)) {
        bonuspoints.push(data.name);
        var target = getTarget();
        //If the target has been met, the bot will awesome
        if((bonuspoints.length >= target) && !bonusvote 
            && (currentsong.djid != config.botinfo.userid)) {
            bot.speak('Bonus!');
            bot.vote('up');
            bonusvote = true;
        }
    }
}