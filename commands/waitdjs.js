//Lists the DJs that must wait before stepping up (as per room rules)

exports.name = 'waitdjs';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.enforcement.enforceroom) {
        var pastdjnames = 'These DJs must wait before stepping up again: ';
        for (i in pastdjs) {
            if (usersList[pastdjs[i].id] != null) {
                //TODO: Change to songs/minutes
                pastdjnames += usersList[pastdjs[i].id].name
                    + ' (' + pastdjs[i].wait + ' songs), ';
            }
        }
        output({text: pastdjnames.substring(0, pastdjnames.length - 2), destination: data.source, userid: data.userid});
    }
}