exports.name = 'queue.print';
exports.hidden = false;
exports.enabled = true;
exports.handler = function(queryArray, response) {
    if (config.enforcement.waitlist) {
        var j = 0;
        var rp = 'Queue:\n';
        for (i in waitlist) {
            j++;
            rp += '[' + j + ']' + waitlist[i].name + '\n';
        }
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end(rp);
    }
}