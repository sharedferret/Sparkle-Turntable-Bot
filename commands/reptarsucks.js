//Bot freakout

exports.name = 'reptar sucks';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    var response = ('OH NO YOU DIDN\'T');
    output({text: response, destination: data.source, userid: data.userid});
    setTimeout(function() {
        output({text: reptarCall(), destination: data.source, userid: data.userid});
    }, 1000);
}