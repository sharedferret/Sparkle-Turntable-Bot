exports.name = 'mostlamed';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.database.usedb) {
        db.all('SELECT song || \' by \' || artist AS TRACK, SUM(down) AS SUM FROM '
            + config.database.tablenames.song + ' GROUP BY song || \' by \' || artist'
			+ ' ORDER BY SUM DESC LIMIT 3',
            function select(error, results, fields) {
                var response = 'The most lamed songs I\'ve heard: ';
                for (i in results) {
                    response += results[i]['TRACK'] + ': '
                        + results[i]['SUM'] + ' lames.  ';
                }
                output({text: response, destination: data.source, userid: data.userid});
        });
    }
}