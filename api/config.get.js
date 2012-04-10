exports.name = 'config.get';
exports.hidden = true;
exports.enabled = true;
exports.handler = function(queryArray, response) {
    if (checkAuth(queryArray.auth)) {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        var rp = {response: 'config', value: config};
        response.end(JSON.stringify(rp));
    }
}