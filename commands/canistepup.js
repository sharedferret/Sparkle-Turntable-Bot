exports.name = 'can i step up';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    var response = canUserStep(data.name, data.userid);
    output({text: response, destination: data.source, userid: data.userid});
}