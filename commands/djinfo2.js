exports.name = 'counts';
exports.hidden = true;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.enforcement.enforceroom) {
        var response = '';
        for (i in djs) {
            response += usersList[djs[i].id].name + ' (' + djs[i].remaining + ' song(s) left), ';
        }
        output({text: response.substring(0, response.length - 2), destination: data.source, userid: data.userid});
    } else {
        var response = '';
        for (i in djs) {
            response += usersList[djs[i].id].name + ' (played ' + djs[i].remaining + '), ';
        }
        output({text: response.substring(0, response.length - 2), destination: data.source, userid: data.userid});
    }
}