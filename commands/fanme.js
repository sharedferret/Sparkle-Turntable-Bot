exports.name = '.fanme';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    bot.getFans(function (fandata) {
        var response = '';
        if (fandata.fans.filter(function(fan) { return fan == data.userid; }).length == 0) {
            response += 'Fan me first, ' + data.name + '!';
            output({text: response, destination: data.source, userid: data.userid});
        } else {
            bot.becomeFan(data.userid, function(becomefan) {
                if (becomefan.success) {
                    response = 'Fanned you, ' + data.name + '!';
                } else {
                    response = 'I\'ve already fanned you, ' + data.name + '!';
                }
                output({text: response, destination: data.source, userid: data.userid});
            });

        }
    });
}