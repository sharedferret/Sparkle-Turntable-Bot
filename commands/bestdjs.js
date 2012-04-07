//Returns the three DJs with the most points logged in the songlist table

exports.name = 'bestdjs';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.database.usedb) {
        client.query('SELECT username, upvotes FROM (SELECT djid, sum(up) AS upvotes '
            + 'FROM ' + config.database.dbname + '.' + config.database.tablenames.song
            + ' GROUP BY djid ORDER BY sum(up) DESC LIMIT 3) a INNER JOIN (SELECT * FROM (SELECT * FROM '
                + config.database.dbname + '.' + config.database.tablenames.user
            + ' ORDER BY lastseen DESC) as test GROUP BY userid)'
            + ' b ON a.djid = b.userid ORDER BY upvotes DESC LIMIT 3',
            function select(error, results, fields) {
                var response = 'The DJs with the most points accrued in this room: ';
                for (i in results) {
                    response += results[i]['username'] + ': '
                        + results[i]['upvotes'] + ' points.  ';
                }
                output({text: response, destination: data.source, userid: data.userid});
        });
    }
}