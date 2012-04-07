exports.name = 'hodor';
exports.hidden = true;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    var response = ('Hodor!');
    output({text: response, destination: data.source, userid: data.userid});
}