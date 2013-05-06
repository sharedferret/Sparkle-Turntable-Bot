exports.name = 'betrippy';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;

global.isTrippy = false;

exports.handler = function(data) {
    if (admincheck(data.userid, data)) {
        var botSay = function(txt) {
            output({text: txt, destination: data.source, userid: data.userid});    
        }
        var avatarIds = [9, 10, 11, 12, 13, 14, 15, 16, 17];
        var avChanger = function() {
            if (isTrippy) {
                var avId = avatarIds[parseInt(Math.random() * avatarIds.length)];
                bot.setAvatar(avId, function(data, err) {
                    setTimeout(avChanger, 3100);
                });
            }
        }
        if (!isTrippy) {
            isTrippy = true;
            botSay("Imma be trippy on " + ["DMT", "Bromo-Dragon Fly", "LSD", "Cocaine", "Ecstacy"][ parseInt(Math.random() * 5) ]);
            avChanger();
        }
    }
}
