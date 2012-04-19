exports.name = 'recentlyplayed';
exports.hidden = false;
exports.enabled = true;
exports.handler = function(queryArray, response) {
    var start = 0;
    if (queryArray.start != null) {
        start = parseInt(queryArray.start);
    }
    client.query('SELECT artist, song, username, up, down, '
        + 'DATE_FORMAT(started, \'%W %h:%i %p\') as started FROM (SELECT artist, song, djid, up, down, '
        + 'started FROM ' + config.database.dbname + '.' 
        + config.database.tablenames.song + ' ORDER BY started '
        + 'DESC LIMIT ' + start + ', 20) a INNER JOIN (SELECT * FROM (SELECT * '
        + 'FROM '+ config.database.dbname + '.' 
        + config.database.tablenames.user + ' ORDER BY lastseen '
        + 'DESC) as test GROUP BY userid) b ON a.djid = b.userid '
        + 'ORDER BY started DESC LIMIT 20',
        function (error, results, fields) {
            response.writeHead(200, {'Content-Type': 'text/html'});
            var rp = '<html><head><title>Recently Played</title></head><body><h2>Recently Played</h2>';
            rp += '<table><tr><td><b>Time</b></td><td><b>Song</b></td><td><b>DJ</b></td><td><b>+</b></td><td><b>-</b></td></tr>';
            for (i in results) {
                rp += '<tr><td>' + results[i]['started'] + '</td><td>' + results[i]['artist'] + ' - ' + results[i]['song']
                    + '</td><td>' + results[i]['username'] + '</td><td>' + results[i]['up'] + '</td><td>' + results[i]['down'] + '</td></tr>';
            }
            rp += '</table><p>';
            if (start >= 20) {
                rp += '<a href=\'?command=recentlyplayed&start=' + (start - 20) + '\'>Prev 20</a> ';
            } else if (start > 0) {
                rp += '<a href=\'?command=recentlyplayed&start=0\'>Prev 20</a> ';
            }
            rp += '<a href=\'?command=recentlyplayed&start=' + (start + 20) + '\'>Next 20</a></p></body></html>';
            response.end(rp);

        });
}