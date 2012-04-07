//Ping bot
//Useful for users that use the iPhone app

exports.name = 'ping';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    var rand = Math.random();
    var response = '';
    if (rand < 0.5) {
        response = ('You\'re still here, ' + data.name + '!');
    } else {
        response = ('Still here, ' + data.name + '!');
    }
    output({text: response, destination: data.source, userid: data.userid});
}