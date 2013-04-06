//If someone is afk by dj.
exports.name = '/afk';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    var response = (data.name + ' is now afk.');
    output({text: response, destination: data.source, userid: data.userid});
}
