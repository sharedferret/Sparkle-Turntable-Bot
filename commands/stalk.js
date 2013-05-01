exports.name = '.stalk';
exports.hidden = true;
exports.enabled = true;
exports.matchStart = true;

exports.handler = function(data) {
    var src = data.userid;
    if (admincheck(src, data)) {
        
        var u = data.text.substring('.stalk'.length + 2);
        var say = function(txt) {
            output({text: txt, destination: 'pm', userid: src});
        };
        bot.getUserId(u, function(d) {
            if (d.success) {
                bot.stalk(d.userid, true, function(data) {
                   var txt = "@" + u + " is in '" + data['room']['name'] + "'";
                   say(txt);
                   console.log("Stalking " + d.userid + " " + txt);
                });
            } else {
                output({text: "User id not found!", destination: 'pm', userid: data.userid});
            }
        });
    }
}
