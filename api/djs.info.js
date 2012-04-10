exports.name = 'djs.info';
exports.hidden = false;
exports.enabled = true;
exports.handler = function(queryArray, response) {
    if(queryArray.format == 'json') {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        var rp = {response: 'djs.info', value: djs};
        response.end(JSON.stringify(rp));
    } else {
        if (config.enforcement.enforceroom) {
            response.writeHead(200, {'Content-Type': 'text/plain'});
            var rp = '';
            for (i in djs) {
                rp += usersList[djs[i].id].name + ' (' 
                    + djs[i].remaining + ' song(s) left), ';
            }
            response.end(rp.substring(0, rp.length - 2));
        } else {
            response.writeHead(200, {'Content-Type': 'text/plain'});
            var rp = '';
            for (i in djs) {
                rp += usersList[djs[i].id].name + ' (played '
                    + djs[i].remaining + '), ';
            }
            response.end(rp.substring(0, rp.length - 2));
        }
    }
}