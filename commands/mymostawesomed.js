exports.name = 'mymostawesomed';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.database.usedb) {
        db.all('SELECT song || \' by \' || artist AS TRACK, SUM(up) AS SUM FROM '
            + config.database.tablenames.song + ' WHERE (djid = \''+ data.userid +'\')'
            + ' GROUP BY song || \' by \' || artist ORDER BY SUM DESC LIMIT 3',
            function select(error, results, fields) {
                var response = 'The most appreciated songs I\'ve heard from you: ';
                for (i in results) {
                    response += results[i]['TRACK'] + ': '
                        + results[i]['SUM'] + ' awesomes.  ';
                }
                output({text: response, destination: data.source, userid: data.userid});
        });
    }
}