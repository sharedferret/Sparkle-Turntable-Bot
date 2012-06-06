exports.name = 'q';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.enforcement.waitlist) {
        var response = 'Queue: ';
        var j = 0;
        if (waitlist.length > 0) {
            for (i in waitlist) {
                j++;
                response += ('[' + j + '] ' + waitlist[i].name + ', ');
            }
        } else {
            response = 'The queue is empty.  ';
        }
        output({text: response.substring(0, response.length - 2), destination: data.source,
            userid: data.userid});
    }
}