exports.name = 'listbans';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    if (config.database.usedb) {
        client.query('SELECT banned_by, DATE_FORMAT(timestamp, '
            + '\'%c/%d/%y\') AS date, username FROM (SELECT * FROM '
            + config.database.dbname + '.'
            + config.database.tablenames.banned + ') a INNER JOIN '
            + ' (SELECT * FROM (SELECT *'
            + ' FROM ' + config.database.dbname + '.'
            + config.database.tablenames.user
            + ' ORDER BY lastseen DESC) as test GROUP BY '
            + 'userid) b ON a.userid = b.userid',
            function cb (error, results, fields) {
                var rp = 'Banned users: ';
                for (i in results) {
                    rp += results[i]['username'] + ' (banned ' + results[i]['date']
                        + ' by ' + results[i]['banned_by'] + '), ';
                }
                output({text: rp.substring(0, rp.length - 2), destination: data.source, userid: data.userid});
        });
    }
}
