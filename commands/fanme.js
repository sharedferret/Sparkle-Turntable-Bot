exports.name = '.fanme';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    bot.becomeFan(data.userid);
    var response = ('Fanned you, ' + data.name + '!');
    output({text: response, destination: data.source, userid: data.userid});
}