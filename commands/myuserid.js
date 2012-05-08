exports.name = 'myuserid';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    var response = 'Your user id is ' + data.userid + '!';
    output({text: response, destination: data.source, userid: data.userid});
}