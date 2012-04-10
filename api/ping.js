exports.name = 'ping';
exports.hidden = false;
exports.enabled = true;
exports.handler = function(queryArray, response) {
    if(queryArray.format == 'json') {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        var rp = {response: 'ping', value: uptime};
        response.end(JSON.stringify(rp));
    } else {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end('Pong!\n');
    }
}