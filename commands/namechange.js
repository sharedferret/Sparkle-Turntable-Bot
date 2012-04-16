exports.name = 'namechange';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.database.usedb) {
        client.query('SELECT unix_timestamp(lastseen) FROM ' + config.database.dbname + '.' + config.database.tablenames.user
            + ' WHERE userid like ? ORDER BY lastseen desc',
            [data.userid],
            function select(error, results, fields) {
                if (results != null && results[1] != null) {
                    var lastname = new Date(results[1]['unix_timestamp(lastseen)'] * 1000);
                    console.log(results[1]['unix_timestamp(lastseen)']);
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