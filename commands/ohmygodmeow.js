//Bot freakout

exports.name = 'oh my god ' + config.botinfo.botname;
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (admincheck(data.userid)) {
        output({text: reptarCall(), destination: data.source, userid: data.userid});
        setTimeout(function() {
            output({text: reptarCall(), destination: data.source, userid: data.userid});
        }, 1400);
        setTimeout(function() {
            output({text: reptarCall(), destination: data.source, userid: data.userid});
        }, 2800);
        setTimeout(function() {
            output({text: reptarCall(), destination: data.source, userid: data.userid});
        }, 4200);
        setTimeout(function() {
            output({text: reptarCall(), destination: data.source, userid: data.userid});
        }, 5600);
    }
}
