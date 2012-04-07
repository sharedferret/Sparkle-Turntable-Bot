//If waitlist is enabled, shows the user's position

exports.name = '.position';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.enforcement.waitlist) {
        var j = 0;
        for (i in waitlist) {
            j++;
            if (waitlist[i].name == data.name) {
                output({text: 'Your position in the queue is #' + j + '.', destination: data.source,
                    userid: data.userid});
            }
        }
    }
}