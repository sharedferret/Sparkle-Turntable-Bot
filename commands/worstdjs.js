exports.name = 'worstdjs';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.database.usedb) {
        client.query('SELECT username, downvotes FROM (SELECT djid, sum(down) AS downvotes '
            + 'FROM ' + config.database.dbname + '.' + config.database.tablenames.song
            + ' GROUP BY djid ORDER BY sum(down) DESC LIMIT 3) a INNER JOIN (SELECT * FROM (SELECT * FROM '
                + config.database.dbname + '.' + config.database.tablenames.user
            + ' ORDER BY lastseen DESC) as test GROUP BY userid)'
            + ' b ON a.djid = b.userid ORDER BY downvotes DESC LIMIT 3',
            function select(error, results, fields) {
                var response = 'The DJs with the most lames accrued in this room: ';
                for (i in results) {
                    response += results[i]['username'] + ': '
                        + results[i]['downvotes'] + ' lames.  ';
                }
                output({text: response, destination: data.source, userid: data.userid});
        });
    }
}