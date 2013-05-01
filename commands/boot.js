exports.name = 'bootuser';
exports.hidden = true;
exports.enabled = true;
exports.matchStart = true;

exports.handler = function(data) {
    if (admincheck(data.userid, data)) {
        var nameforid = data.text.substring(10);
        bot.getUserId(nameforid, function(d) {
            if (d.success) {
                var urls = global.booturls;
                var msg = urls && urls.length > 0? urls[ parseInt(Math.random() * urls.length) ] : "You've been booted by the bot";
                bot.boot(d.userid, msg);
            } else {
                output({text: "User id not found!", destination: 'pm', userid: data.userid});
            }
        });
    }
};
