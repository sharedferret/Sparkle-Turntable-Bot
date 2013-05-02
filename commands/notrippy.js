//Ping bot
//Useful for users that use the iPhone app

exports.name = 'notrippy';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;


exports.handler = function(data) {
    if (admincheck(data.userid, data)) {
        var botSay = function(txt) {
            output({text: txt, destination: data.source, userid: data.userid});    
        }
        if (isTrippy) {
            isTrippy = false;
            botSay("Whoa that was one helluva trip. So messed up right now.");
        }
    }
}
