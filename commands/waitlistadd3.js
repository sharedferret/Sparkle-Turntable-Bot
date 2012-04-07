//If waitlist is enabled, adds a user to the waitlist

exports.name = '+q';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.enforcement.waitlist) {
        addToWaitlist(data.userid, data.name, data.source);
    }
}