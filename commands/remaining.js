exports.name = '.remaining';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.enforcement.enforceroom) {
        var found = false;
        for (i in djs) {
            if (djs[i].id == data.userid) {
                var response = '';
                if (djs[i].remaining == 1) {
                    response = (data.name + ', you have one song remaining.');
                } else {
                    response = (data.name + ', you have ' + djs[i].remaining + ' songs remaining.');
                }
                output({text: response, destination: data.source, userid: data.userid});
                found = true;
            }
        }
    }
    if (!found) {
        var response = (data.name + ', you\'re not DJing...');
        output({text: response, destination: data.source, userid: data.userid});
    }
}