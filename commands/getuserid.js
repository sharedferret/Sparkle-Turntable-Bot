exports.name = 'getuserid';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    var nameforid = data.text.substring(10);
    bot.getUserId(nameforid, function(d) {
        if (d.success) {
            var response = nameforid + '\'s user id is ' + d.userid + '!';
            output({text: response, destination: data.source, userid: data.userid});
        } else {
            var response = nameforid + ' is not a valid username on TT.fm.';
            output({text: response, destination: data.source, userid: data.userid});
        }
    });
    
}