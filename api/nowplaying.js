exports.name = 'nowplaying';
exports.hidden = false;
exports.enabled = true;
exports.handler = function(queryArray, response) {
    if(queryArray.format == 'json') {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        var rp = {response: 'nowplaying', value: currentsong};
        response.end(JSON.stringify(rp));
    } else {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        response.end('Current song: ' + currentsong.artist + ' - ' + currentsong.song
                    + '\nDJ ' + currentsong.djname + ' (+' + currentsong.up + '/-'
                    + currentsong.down + ')\n');
    }
}