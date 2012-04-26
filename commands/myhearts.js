exports.name = 'myhearts';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.database.usedb) {
        client.query('SELECT SUM(snags) AS SUM FROM '
            + config.database.dbname + '.' + config.database.tablenames.song + ' WHERE (djid = \''+ data.userid +'\')',
            function select(error, results, fields) {
                var response = 'You have ' + results[0]['SUM'] + ' hearts total!';
                output({text: response, destination: data.source, userid: data.userid});
        });
    }
}