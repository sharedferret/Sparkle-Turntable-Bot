exports.name = 'users';
exports.hidden = false;
exports.enabled = true;
exports.handler = function(queryArray, response) {
    if(queryArray.format == 'json') {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        var rp = {response: 'users', value: usersList};
        response.end(JSON.stringify(rp));
    } else {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        var output = '';
        for (var i in usersList) {
            output += (usersList[i].name) + ', ';
        }
        response.end('Users online: ' + output.substring(0, output.length - 2) + '\n');
    }
}