exports.name = 'allpastnames';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    if (config.database.usedb) {
        if (data.source != 'pm') {
            output({text: 'That is a PM-only command.', destination: data.source, userid: data.userid});
        }
		else {		
            client.query('SELECT username FROM ' + config.database.dbname + '.' + config.database.tablenames.user
            + ' WHERE (userid like (SELECT '
            + 'userid FROM ' + config.database.dbname + '.' + config.database.tablenames.user
            + ' WHERE username LIKE ? limit 1)) ORDER BY RAND()',
            [data.text.substring(13)],
            function select(error, results, fields) {
                var response = '';
                response = 'That user has gone by ' + results.length + ' names: ';
                for (i in results) {
                    response += results[i]['username'] + ', ';
                }
                output({text: response.substring(0, response.length - 2), destination: data.source, userid: data.userid});
            });
        }
    }
}