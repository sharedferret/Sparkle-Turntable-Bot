exports.name = 'unmod ';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    if (admincheck(data.userid, data)) {
        var nameforid = data.text.substring(7);
        bot.getUserId(nameforid, function(d) {
            if (d.success) {
                var response = nameforid + '\'s (uid = ' + d.userid + ') has been unmodded';
                bot.remModerator(d.userid);
                output({text: response, destination: data.source, userid: data.userid});
            } else {
                var response = nameforid + ' is not a valid username on TT.fm.';
                output({text: response, destination: data.source, userid: data.userid});
            }
        });
    }
}
