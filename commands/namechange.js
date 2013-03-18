exports.name = 'namechange';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.database.usedb) {
		db.all('select strftime(\'%s\', lastseen) as seen from '
			+ config.database.tablenames.pastuser + ' where userid = ? order by seen desc limit 2',
            [data.userid],
            function select(error, results, fields) {
                if (results != null && results[1] != null) {
                    var lastname = new Date(results[1]['seen'] * 1000);
                    lastname.setDate(lastname.getDate()+7);
                    if (lastname.getTime() - new Date().getTime() > 0) {
                        var response = data.name + ', you can probably change your name a little after ' + lastname.toLocaleString();
                    } else {
                        var response = data.name + ', you can probably change your name now.';
                    }
                    output({text: response, destination: data.source, userid: data.userid});
                } else {
                    output({text: data.name + ', I haven\'t seen you enough to figure it out.', destination: data.source, userid: data.userid});
                }
        });
    }
}