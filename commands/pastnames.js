exports.name = 'pastnames';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    if (config.database.usedb) {
        client.query('SELECT username FROM ' + config.database.dbname + '.' + config.database.tablenames.user
            + ' WHERE (userid like (SELECT '
            + 'userid FROM ' + config.database.dbname + '.' + config.database.tablenames.user
            + ' WHERE username LIKE ? limit 1)) ORDER BY RAND()',
            [data.text.substring(10)],
            function select(error, results, fields) {
                var response = '';
                if (results != null && results.length > 6) {
                    response = 'That user has gone by ' + results.length + ' names, including: ';
                    for (i = 0; i < 6; i++) {
                        response += results[i]['username'] + ', ';
                    }
                } else {
                    response = 'Names I\'ve seen that user go by: ';
                    for (i in results) {
                        response += results[i]['username'] + ', ';
                    }
                }
                output({text: response.substring(0, response.length - 2), destination: data.source, userid: data.userid});
        });
    }
}