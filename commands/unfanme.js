exports.name = '.unfanme';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    bot.removeFan(data.userid);
    var response = ('Fuck you too, ' + data.name + '.');
    output({text: response, destination: data.source, userid: data.userid});
}