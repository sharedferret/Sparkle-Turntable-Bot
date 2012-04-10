exports.name = 'config.set';
exports.hidden = true;
exports.enabled = false;
exports.handler = function(queryArray, response) {
    //if(queryArray.format == 'json') {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        var rp = {response: 'Not implemented yet.'};
        response.end(JSON.stringify(rp));
    //} else {
    //    response.writeHead(200, {'Content-Type': 'text/plain'});
    //    response.end('Pong!\n');
    //}
}