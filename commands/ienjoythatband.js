exports.name = 'i enjoy that band.';
exports.hidden = true;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    setTimeout(function() {
        var response = ('Me too!');
        output({text: response, destination: data.source, userid: data.userid});
    }, 1200);
}