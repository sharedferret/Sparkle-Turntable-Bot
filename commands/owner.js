//Outputs bot owner

exports.name = '.owner';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    output({text: config.responses.ownerresponse, destination: data.source, userid: data.userid});
}