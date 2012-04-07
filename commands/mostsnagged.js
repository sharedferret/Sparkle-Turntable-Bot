exports.name = 'mostsnagged';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.database.usedb) {
        client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, sum(snags) AS SNAGS FROM '
            + config.database.dbname + '.' + config.database.tablenames.song
            + ' GROUP BY CONCAT(song, \' by \', artist) ORDER BY SNAGS '
            + 'DESC LIMIT 3', function select(error, results, fields) {
                var response = 'The songs I\'ve seen snagged the most: ';
                for (i in results) {
                    response += results[i]['TRACK'] + ': '
                        + results[i]['SNAGS'] + ' snags.  ';
                }
                output({text: response, destination: data.source, userid: data.userid});
        });
    }
}