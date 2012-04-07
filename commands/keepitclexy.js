

exports.name = 'keep it clexy';
exports.hidden = true;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    output({text: 'Always.', destination: data.source, userid: data.userid});
}