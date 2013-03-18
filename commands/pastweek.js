//Returns the five DJs with the most points in the last week

exports.name = 'pastweek';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.database.usedb) {
        db.all('select username, upvotes from (select djid, sum(up) as upvotes from '
			+ config.database.tablenames.song + ' where started > datetime(\'now\', \'-7 day\')'
			+ ' group by djid) a inner join (select * from '
			+ config.database.tablenames.user + ') b on a.djid = b.userid order by upvotes '
			+ 'desc limit 5',
            function select(error, results, fields) {
                var response = 'DJs with the most points in the last week: ';
                for (i in results) {
                    response += results[i]['username'] + ': '
                        + results[i]['upvotes'] + '▲. ';
                }
                output({text: response, destination: data.source, userid: data.userid});
        });
    }
}