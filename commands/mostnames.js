exports.name = 'mostnames';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    if (config.database.usedb) {
		db.all('select namecount, username from (select count(*) as namecount, '
			+ 'userid from ' + config.database.tablenames.pastuser
			+ ' group by userid) a inner join (select * from '
			+ config.database.tablenames.user + ') b on a.userid = b.userid order by '
			+ 'namecount desc limit 5',
			function select(error, results, fields) {
                var response = 'The users with the most name changes: ';
                for (i in results) {
                    response += results[i]['username'] + ': '
                        + results[i]['namecount'] + ' name changes.  ';
                }
                output({text: response, destination: data.source, userid: data.userid});
        });
    }
}