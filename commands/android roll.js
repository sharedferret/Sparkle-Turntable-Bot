//Rolls a die and returns a value of 1-6
//If vote bonus is set to DICE, the bot will awesome if a
//4 or higher is rolled.

exports.name = '\\/roll';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    var roll = Math.ceil(Math.random() * 6);
    if (config.bonusvote == 'DICE' && !bonusvote && (currentsong.djid == data.userid)) {
        if (roll > 3) {
            bot.speak(data.name + ', you rolled a ' + roll + ', BONUS!');
            bot.vote('up');
        } else {
            bot.speak (data.name + ', you rolled a ' + roll +', bummer.');
        }
        bonusvote = true;
    } else {
        var response = (data.name + ', you rolled a ' + roll + '.');
        output({text: response, destination: data.source, userid: data.userid});
    }
}