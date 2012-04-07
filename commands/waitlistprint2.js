exports.name = 'printqueue';
exports.hidden = true;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.enforcement.waitlist) {
        var response = 'Queue: ';
        var j = 0;
        for (i in waitlist) {
            j++;
            response += ('[' + j + '] ' + waitlist[i].name + ', ');
        }
        output({text: response.substring(0, response.length - 2), destination: data.source,
            userid: data.userid});
    }
}