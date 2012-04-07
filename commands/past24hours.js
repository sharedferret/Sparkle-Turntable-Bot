//Returns the three DJs with the most points in the last 24 hours

exports.name = 'past24hours';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.database.usedb) {
        client.query('SELECT username, upvotes FROM (SELECT djid, sum(up) as upvotes '
            + 'FROM ' + config.database.dbname + '.' + config.database.tablenames.song
            + ' WHERE started > DATE_SUB(NOW(), INTERVAL '
            + '1 DAY) GROUP BY djid) a INNER JOIN (SELECT * FROM (SELECT * FROM '
                + config.database.dbname + '.' + config.database.tablenames.user
            + ' ORDER BY lastseen DESC) as test GROUP BY userid) b ON a.djid = b.userid'
            + ' ORDER BY upvotes DESC LIMIT 3',
            function select(error, results, fields) {
                var response = 'DJs with the most points in the last 24 hours: ';
                for (i in results) {
                    response += results[i]['username'] + ': '
                        + results[i]['upvotes'] + ' awesomes.  ';
                }
                output({text: response, destination: data.source, userid: data.userid});
        });
    }
}