exports.name = 'mystats';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.database.usedb) {
		async.waterfall([
			function(callback) {
				db.all('select count(*) as total, sum(up) as sumup, sum(down) as sumdown, ' 
					+ 'avg(up) as avgup, avg(down) as avgdown from ' 
					+ config.database.tablenames.song
					+ ' where djid = \'' + data.userid + '\' group by djid',
					function(error, results) {
						if (results.length == 0) {
							error = 'No results found!';
						}
						callback(error, results[0]);
					});
			},
			function(response, callback) {
				db.all('select count(*) as rank from (select sum(up) as sumup from '
					+ config.database.tablenames.song + ' group by djid order by sumup '
					+ 'desc) as a where sumup >= ' + response['sumup'],
				function(error, results) {
						response['rank'] = results[0]['rank'];
						callback(error, response);
					});
			}
		], function(err, result) {
			var response = '';
			if (err) {
				response = data.name + ', you haven\'t played any songs in here yet!';
			} else {
				response = (data.name + ', you have played ' + result['total'] 
                    + ' songs in this room with a total of ' + result['sumup'] 
					+ ' awesomes and ' + result['sumdown'] + ' lames (avg +' 
					+ new Number(result['avgup']).toFixed(1) + '/-' 
					+ new Number(result['avgdown']).toFixed(1)
                    + ') (Rank: ' + result['rank'] + ')');
			}
            output({text: response, destination: data.source, userid: data.userid});
		});
	}
}