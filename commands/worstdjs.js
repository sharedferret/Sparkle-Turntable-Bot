exports.name = 'worstdjs';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.database.usedb) {
        db.all('select username, upvotes from (select djid, sum(down) as upvotes from '
			+ config.database.tablenames.song + ' group by djid order by sum(down) desc '
			+ 'limit 3) a inner join (select * from ' + config.database.tablenames.user
			+ ') b on a.djid = b.userid order by upvotes desc limit 3',
            function select(error, rows) {
                var response = 'The DJs with the most lames accrued in this room: ';
                for (i in rows) {
                    response += results[i]['username'] + ': '
                        + rows[i]['downvotes'] + ' lames.  ';
                }
                output({text: response, destination: data.source, userid: data.userid});
        });
    }
}