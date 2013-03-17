exports.name = 'mypast24hours';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.database.usedb) {
        db.all('SELECT count(*) AS songs, sum(up) AS upvotes, sum(down) AS downvotes FROM '
            + config.database.tablenames.song + ' WHERE started > DATE_SUB(CURRENT_TIMESTAMP, '
            + 'INTERVAL 1 DAY) AND djid LIKE \'' + data.userid + '\'',
            function select(error, results, fields) {
                var response = data.name + ', you have played ' + results[0]['songs']
                    + ' songs in the past 24 hours, with ' + results[0]['upvotes']
                    + ' upvotes and ' + results[0]['downvotes'] + ' downvotes.';
                output({text: response, destination: data.source, userid: data.userid});
        });
    }
}