//Returns the three song plays with the most awesomes in the songlist table

exports.name = 'bestplays';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.database.usedb) {
        db.all('SELECT song || \' by \' || artist AS TRACK, UP FROM '
			+ config.database.tablenames.song + ' ORDER BY UP DESC LIMIT 3',
            function select(error, results, fields) {
                var response = 'The song plays I\'ve heard with the most awesomes: ';
                for (i in results) {
                    response += results[i]['TRACK'] + ': '
                        + results[i]['up'] + ' awesomes.  ';
                }
                output({text: response, destination: data.source, userid: data.userid});
        });
    }
}