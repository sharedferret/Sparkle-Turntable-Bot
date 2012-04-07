exports.name = 'test';
exports.hidden = true;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    output({text: 'test successful', destination: 'speak', userid: null});
}