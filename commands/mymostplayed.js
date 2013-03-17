exports.name = 'mymostplayed';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.database.usedb) {
        db.all('SELECT song || \' by \' || artist AS TRACK, COUNT(*) AS COUNT FROM '
            + config.database.tablenames.song + ' WHERE (djid = \''+ data.userid +'\')'
            + ' GROUP BY song || \' by \' || artist ORDER BY COUNT(*) DESC LIMIT 3',
            function select(error, results, fields) {
                var response = 'The songs I\'ve heard the most from you: ';
                for (i in results) {
                    response += results[i]['TRACK'] + ': '
                        + results[i]['COUNT'] + ' plays.  ';
                }
                output({text: response, destination: data.source, userid: data.userid});
        });
    }
}