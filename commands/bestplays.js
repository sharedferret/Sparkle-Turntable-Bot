//Returns the three song plays with the most awesomes in the songlist table

exports.name = 'bestplays';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.database.usedb) {
        client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, UP FROM '
            + config.database.dbname + '.' + config.database.tablenames.song + ' ORDER BY UP DESC LIMIT 3',
            function select(error, results, fields) {
                var response = 'The song plays I\'ve heard with the most awesomes: ';
                for (i in results) {
                    response += results[i]['TRACK'] + ': '
                        + results[i]['UP'] + ' awesomes.  ';
                }
                output({text: response, destination: data.source, userid: data.userid});
        });
    }
}