// Will not work without schema change

exports.name = 'allpastnames';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    if (config.database.usedb) {
        if (data.source != 'pm') {
            output({text: 'Let me PM that to you...', destination: data.source, userid: data.userid});
        }
		db.all('select username from ' + config.database.tablenames.pastuser
			+ ' where userid like (select userid from '
			+ config.database.tablenames.pastuser + ' where username like ? '
			+ 'order by lastseen desc limit 1) order by lastseen desc', 
			[data.text.substring(13)],
			function select(error, results, fields) {
				console.log(error);
                var response = '';
                response = 'That user has gone by ' + results.length + ' names: ';
                for (i in results) {
                    response += results[i]['username'] + ', ';
                }
                output({text: response.substring(0, response.length - 2), destination: 'pm', userid: data.userid});
        });
    }
}