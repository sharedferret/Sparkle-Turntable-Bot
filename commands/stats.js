//Returns the room's play count, total awesomes/lames, and average awesomes/lames
//in the room

exports.name = 'stats';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.database.usedb) {
		async.parallel([
		function(callback) {
			db.all('SELECT count(*) as songcount FROM (select * from '
            	+ config.database.tablenames.song + ' group by '
				+ 'song || \' by \' || artist) as songtbl',
				function (err, cb) {
					callback(err, cb);
			});
		},
		function(callback) {
			db.all('SELECT count(*) as usercount FROM (select * from '
				+ config.database.tablenames.song + ' group by djid) as djtable',
				function (err, cb) {
					callback(err, cb);
			});
		},
		function(callback) {
			db.all('SELECT count(*) as total, sum(up) as up, avg(up) as avgup, '
				+ 'sum(down) as down, avg(down) as avgdown from '
				+ config.database.tablenames.song,
				function (err, cb) {
					callback(err, cb);
			});
		}
		],
		function (err, results) {
            var response = ('In this room, '
                + results[2][0]['total'] + ' songs ('
                + results[0][0]['songcount'] + ' unique) have been played by '
                + results[1][0]['usercount'] + ' DJs with a total of '
                + results[2][0]['up'] + ' awesomes and ' + results[2][0]['down']
                + ' lames (avg +' + new Number(results[2][0]['avgup']).toFixed(1) 
                + '/-' + new Number(results[2][0]['avgdown']).toFixed(1)
                + ').');
			output({text: response, destination: data.source, userid: data.userid});
		});
    }
}
