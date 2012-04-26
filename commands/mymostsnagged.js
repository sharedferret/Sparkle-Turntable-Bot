exports.name = 'mymostsnagged';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.database.usedb) {
        client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, SUM(snags) AS SUM FROM '
            + config.database.dbname + '.' + config.database.tablenames.song + ' WHERE (djid = \''+ data.userid +'\')'
            + ' GROUP BY CONCAT(song,\' by \',artist) ORDER BY SUM DESC LIMIT 3',
            function select(error, results, fields) {
                var response = 'The songs I\'ve seen snagged the most from you: ';
                for (i in results) {
                    response += results[i]['TRACK'] + ': '
                        + results[i]['SUM'] + ' snags.  ';
                }
                output({text: response, destination: data.source, userid: data.userid});
        });
    }
}