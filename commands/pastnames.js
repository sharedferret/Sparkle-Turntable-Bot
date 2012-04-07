exports.name = 'pastnames';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.database.usedb) {
        client.query('SELECT username FROM ' + config.database.dbname + '.' + config.database.tablenames.user
            + ' WHERE (userid like (SELECT '
            + 'userid FROM ' + config.database.dbname + '.' + config.database.tablenames.user
            + ' WHERE username LIKE ? limit 1))',
            [data.text.substring(10)],
            function select(error, results, fields) {
                var response = 'Names I\'ve seen that user go by: ';
                for (i in results) {
                    response += results[i]['username'] + ', ';
                }
                output({text: response.substring(0, response.length - 2), destination: data.source, userid: data.userid});
        });
    }
}