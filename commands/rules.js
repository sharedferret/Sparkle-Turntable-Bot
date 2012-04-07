//Rules rehash since xxRAWRxx only responds to .rules
//TODO: Generate rules based on bot options

exports.name = 'rules';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    var response = ('You can view the rules here: ' + config.responses.rules.link);
    output({text: response, destination: data.source, userid: data.userid});
    setTimeout(function() {
        var response = (config.responses.rules.description);
        output({text: response, destination: data.source, userid: data.userid});
    }, 600);
}