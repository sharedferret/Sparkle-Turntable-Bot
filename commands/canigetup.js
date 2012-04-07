exports.name = 'can i get up';
exports.hidden = true;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    var response = canUserStep(data.name, data.userid);
    output({text: response, destination: data.source, userid: data.userid});
}