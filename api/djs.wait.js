exports.name = 'djs.wait';
exports.hidden = false;
exports.enabled = true;
exports.handler = function(queryArray, response) {
    if (config.enforcement.enforceroom) {
        if (queryArray.format == 'json') {
            response.writeHead(200, {'Content-Type': 'text/plain'});
            var rp = {response: 'djs.wait', value: pastdjs};
            response.end(JSON.stringify(rp));
        } else {
            var pastdjnames = 'These DJs must wait before stepping up again: ';
            for (i in pastdjs) {
                if (usersList[pastdjs[i].id] != null) {
                    //TODO: Change to songs/minutes
                    pastdjnames += usersList[pastdjs[i].id].name
                        + ' (' + pastdjs[i].wait + ' songs), ';
                }
            }
            response.writeHead(200, {'Content-Type': 'text/plain'});
            response.end(pastdjnames.substring(0, pastdjnames.length - 2));
        }
    }
}