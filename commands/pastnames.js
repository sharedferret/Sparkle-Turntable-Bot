exports.name = 'pastnames';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    if (config.database.usedb) {
		db.all('select username from ' + config.database.tablenames.pastuser
			+ ' where userid like (select userid from '
			+ config.database.tablenames.pastuser + ' where username like ? '
			+ 'order by lastseen desc limit 1) order by lastseen desc limit 5', 
			[data.text.substring(10)],
            function select(error, results, fields) {
				var response = 'That user has gone by ' + results.length + ' names, including: ';
                for (i in results) {
                    response += results[i]['username'] + ', ';
                }
                output({text: response.substring(0, response.length - 2), destination: data.source, userid: data.userid});
        });
    }
}