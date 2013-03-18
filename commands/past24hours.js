//Returns the three DJs with the most points in the last 24 hours

exports.name = 'past24hours';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.database.usedb) {
		console.log(config.database.tablenames.song + ' ' + config.database.tablenames.user);
		db.all('select username, upvotes from (select djid, sum(up) as upvotes from '
			+ config.database.tablenames.song + ' where started > datetime(\'now\', \'-1 day\')'
			+ ' group by djid) as a inner join (select * from '
			+ config.database.tablenames.user + ') as b on a.djid = b.userid order by upvotes '
			+ 'desc limit 3',
            function select(error, results, fields) {
                var response = 'DJs with the most points in the last 24 hours: ';
                for (i in results) {
                    response += results[i]['username'] + ': '
                        + results[i]['upvotes'] + ' awesomes.  ';
                }
                output({text: response, destination: data.source, userid: data.userid});
        });
    }
}