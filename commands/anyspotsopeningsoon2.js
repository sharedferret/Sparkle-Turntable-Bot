exports.name = 'anyone stepping down soon?';
exports.hidden = true;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.enforcement.enforceroom) {
        var response = ('The next DJ to step down is ' + usersList[djs[0].id].name + ', who has '
            + djs[0].remaining + ' songs remaining.');
        output({text: response, destination: data.source, userid: data.userid});
    }
}