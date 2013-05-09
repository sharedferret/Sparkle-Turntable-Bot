exports.name = 'myhearts';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.database.usedb) {
        client.query('SELECT SUM(snags) AS SUM FROM '
            + config.database.dbname + '.' + config.database.tablenames.song + ' WHERE (djid = \''+ data.userid +'\')',
            function select(error, results, fields) {
                var sum = results[0]['SUM'];
                var response;
                if (sum) {
                    response = 'You have ' + sum + ' hearts total!';
                } else {
                    response = 'You have no hearts';
                    output({text: 'Pro-tip: To get more hearts, get on the deck and play awesome music!', destination: 'pm', userid: data.userid});
                }
                output({text: response, destination: data.source, userid: data.userid});
        });
    }
}
