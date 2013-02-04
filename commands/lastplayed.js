exports.name = 'lastplayed';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
	if (config.database.usedb && currentsong._id) {
		client.query('SELECT started FROM '
			+ config.database.dbname + '.' + config.database.tablenames.song + ' WHERE (songid = \''+ currentsong._id +'\') ORDER BY started DESC LIMIT 1',
			function select(error, results, fields) {
				var response = '';

				if(results && results.length > 0) {
					response = 'Last played ' + results[0]['started'] + '.';
				} else {
					console.log(error);
					response = 'This song has not been played before.';
				}

				output({text: response, destination: data.source, userid: data.userid});
			});
	}
}
