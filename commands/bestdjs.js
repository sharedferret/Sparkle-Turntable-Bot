//Returns the three DJs with the most points logged in the songlist table

exports.name = 'bestdjs';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
	console.log('bestdjs called');
    if (config.database.usedb) {
        db.all('select username, upvotes from (select djid, sum(up) as upvotes from '
			+ config.database.tablenames.song + ' group by djid order by sum(up) desc '
			+ 'limit 3) a inner join (select * from ' + config.database.tablenames.user
			+ ') b on a.djid = b.userid order by upvotes desc limit 3',
            function select(error, results, fields) {
				console.log('bestdjs', error);
                var response = 'The DJs with the most points accrued in this room: ';
                for (i in results) {
                    response += results[i]['username'] + ': '
                        + results[i]['upvotes'] + ' points.  ';
                }
                output({text: response, destination: data.source, userid: data.userid});
        });
    }
}