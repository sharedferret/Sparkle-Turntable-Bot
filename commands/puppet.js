exports.name = '/puppet';
exports.hidden = true;
exports.enabled = false;
exports.matchStart = true;
exports.handler = function(data) {
    if (admincheck(data.userid, data)) {
        var response = data.text.substring(8);
        output({text: response, destination: 'speak', userid: data.userid});
    }
}
