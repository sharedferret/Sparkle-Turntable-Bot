//If waitlist is enabled, removes a user from the waitlist

exports.name = '-q';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.enforcement.waitlist) {
        for (i in waitlist) {
            if (waitlist[i].name == data.name) {
                waitlist.splice(i, 1);
                output({text: 'You\'ve been removed from the queue.', destination: data.source, 
                    userid: data.userid});
            }
        }
    }
}