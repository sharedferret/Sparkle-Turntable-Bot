exports.name = 'online';
exports.hidden = false;
exports.enabled = true;
exports.handler = function(queryArray, response) {
    if (queryArray.format == 'json') {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        var rp = {response: 'online', value: currentsong.listeners};
        response.end(JSON.stringify(rp));
    } else {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end('There are ' + currentsong.listeners + ' users online.\n');
    }
}