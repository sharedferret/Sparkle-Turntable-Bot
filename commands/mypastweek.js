exports.name = 'mypastweek';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.database.usedb) {
        db.all('select count(*) as songs, sum(up) as upvotes, sum(down) as downvotes'
			+ ' from ' + config.database.tablenames.song + ' where started > '
			+ 'datetime(\'now\', \'-7 day\') AND djid LIKE \'' + data.userid + '\'',                 			function select(error, results, fields) {
                var response = data.name + ', you have played ' + results[0]['songs']
                    + ' songs in the past week, with ' + results[0]['upvotes']
                    + ' upvotes and ' + results[0]['downvotes'] + ' downvotes.';
                output({text: response, destination: data.source, userid: data.userid});
        });
    }
}