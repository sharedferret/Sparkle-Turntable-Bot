exports.name = 'mostnames';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    if (config.database.usedb) {				
        client.query('SELECT COUNT(u1.userid) AS name_count, (SELECT u2.username FROM ' + config.database.dbname + '.' + config.database.tablenames.user
            + ' u2 WHERE u1.userid = u2.userid ORDER BY lastseen LIMIT 1) AS current_username '
            + ' FROM ' + config.database.dbname + '.' + config.database.tablenames.user
            + ' u1 GROUP BY userid ORDER BY COUNT(userid) DESC LIMIT 5',
            function select(error, results, fields) {
                var response = 'The users with the most name changes: ';
                for (i in results) {
                    response += results[i]['current_username'] + ': '
                        + results[i]['name_count'] + ' name changes.  ';
                }
                output({text: response, destination: data.source, userid: data.userid});
        });
    }
}