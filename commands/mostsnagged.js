exports.name = 'mostsnagged';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.database.usedb) {
        db.all('SELECT song || \' by \' || artist AS TRACK, sum(snags) AS SNAGS FROM '
            + config.database.tablenames.song + ' GROUP BY song || \' by \' || artist'
			+ ' ORDER BY SNAGS DESC LIMIT 3', 
			function select(error, results, fields) {
                var response = 'The songs I\'ve seen snagged the most: ';
                for (i in results) {
                    response += results[i]['TRACK'] + ': '
                        + results[i]['SNAGS'] + ' snags.  ';
                }
                output({text: response, destination: data.source, userid: data.userid});
        });
    }
}