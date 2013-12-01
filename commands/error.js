exports.name = '.error';
exports.hidden = true;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (admincheck(data.userid, data)) {
        console.log("Causing error");
        throw new Error("fuck fuck fuck");
    }
}
