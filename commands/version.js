exports.name = 'version';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    var response = (version);
    output({text: response, destination: data.source, userid: data.userid});
}