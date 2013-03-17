exports.name = 'catfact';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.database.usedb) {
        db.all('SELECT * FROM CATFACTS ORDER BY RANDOM() LIMIT 1',
            function selectCb(error, results, fields) {
                if (results != null && results[0] != null) {
                    var response = (results[0]['fact']);
                    output({text: response, destination: data.source, userid: data.userid});
                }
        });
    }
}
