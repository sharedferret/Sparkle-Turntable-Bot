//Responds to reptar-related call

exports.name = 'can you feel it!?';
exports.hidden = true;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    setTimeout(function() {
        var response = ('YES I CAN FEEL IT!');
        output({text: response, destination: data.source, userid: data.userid});
    }, 1200);
}