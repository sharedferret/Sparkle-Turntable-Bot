//If waitlist is enabled, removes the first user from the waitlist

exports.name = '.removefirst';
exports.hidden = true;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.enforcement.waitlist && admincheck(data.userid, data)) {
        var removed = waitlist.shift();
        if (removed != null) {
            output({text: removed.name + ' has been removed from the queue.',
                destination: data.source, userid: data.userid});
        }
    }
}
