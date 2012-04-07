//Outputs github url for xxMEOWxx

exports.name = '.source';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    var response = ('My source code is available at: http://git.io/meow');
    output({text: response, destination: data.source, userid: data.userid});
}