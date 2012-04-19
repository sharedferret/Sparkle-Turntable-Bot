exports.name = 'leaderboard';
exports.hidden = false;
exports.enabled = true;
exports.handler = function(queryArray, response) {
    client.query('SELECT username, upvotes FROM (SELECT djid, sum(up) AS upvotes '
            + 'FROM ' + config.database.dbname + '.' + config.database.tablenames.song
            + ' GROUP BY djid ORDER BY sum(up) DESC LIMIT 20) a INNER JOIN (SELECT * FROM (SELECT * FROM '
                + config.database.dbname + '.' + config.database.tablenames.user
            + ' ORDER BY lastseen DESC) as test GROUP BY userid)'
            + ' b ON a.djid = b.userid ORDER BY upvotes DESC LIMIT 20',
            function select(error, results, fields) {
                if (queryArray.format == 'json') {
                    response.writeHead(200, {'Content-Type': 'application/json'});
                    response.end(JSON.stringify(results));
                } else {
                    response.writeHead(200, {'Content-Type': 'text/html'});
                    var rp = '<html><head><title>Best DJs</title></head><body><h2>Best DJs</h2>';
                    var j = 1;
                    rp += '<table><tr><td><b>Rank</b></td><td><b>Username</b></td><td><b>Points</b></td></tr>';
                    for (i in results) {
                        rp += '<tr><td>' + j + '</td><td>' + results[i]['username']
                            + '</td><td>' + results[i]['upvotes'] + '</td></tr>';
                        j++;
                    }
                    rp += '</table></body></html>';
                    endWith(rp, response);
                }
        });
}

function endWith(rsp, response) {
    response.end(rsp);
}