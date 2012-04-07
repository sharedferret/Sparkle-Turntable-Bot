exports.name = 'mostawesomed';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.database.usedb) {
        client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, SUM(up) AS SUM FROM '
            + config.database.dbname + '.' + config.database.tablenames.song
            + ' GROUP BY CONCAT(song,\' by \',artist) ORDER BY SUM '
            + 'DESC LIMIT 3',
            function select(error, results, fields) {
                var response = 'The most awesomed songs I\'ve heard: ';
                for (i in results) {
                    response += results[i]['TRACK'] + ': '
                        + results[i]['SUM'] + ' awesomes.  ';
                }
                output({text: response, destination: data.source, userid: data.userid});
        });
    }
}