exports.name = 'debug';
exports.hidden = true;
exports.enabled = true;
exports.handler = function(queryArray, response) {
    response.writeHead(200, {'Content-Type': 'text/plain'});
    var rp = {usertostep: usertostep, userstepped: userstepped, ffa: ffa, legalstepdown: legalstepdown,
        pastdjs: pastdjs, djs: djs, waitlist: waitlist, currentsong: currentsong};
    response.end(JSON.stringify(rp));
}