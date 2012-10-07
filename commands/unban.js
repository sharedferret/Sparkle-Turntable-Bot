exports.name = 'unbanuser';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    if (config.database.usedb && admincheck(data.userid)) {
        //Get name and userid
        var givenname = data.text.substring(10);
        client.query('SELECT userid FROM ' + config.database.dbname + '.' + config.database.tablenames.user
            + ' WHERE username LIKE ? limit 1', [givenname], function select(error, results, fields) {
            if (results.length > 0) {
                removeFromBanList(results[0]['userid'], givenname, data.name);
            }
        });
    }
}

function removeFromBanList(userid, name, bannedby) {
    client.query('DELETE FROM ' + config.database.dbname + '.' + config.database.tablenames.banned + ' WHERE userid = ?',
            [userid], function (error, results, fields) {
            if (error == null) {
                bot.speak(name + ' has been unbanned.');
            }
            else {
                console.log(error);
            }
    });
}
