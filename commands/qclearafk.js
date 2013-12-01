exports.name = '.qcheck';
exports.hidden = true;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    if (admincheck(data.userid, data)) {
        
        var inRoom = {};
        Object.keys(usersList).forEach(function(usrid) {
           inRoom[usrid] = true; 
        });
        
        var notInRoom = waitlist.filter(function(qusr) {
          return !inRoom[qusr.id];
        }).map(function(u) {
           return u.name 
        });
        
        waitlist = waitlist.filter(function(qusr) {
          return inRoom[qusr.id];
        });
        var response = "These people were removed since they're not in the room anymore: " + notInRoom.join(", ");
        if (notInRoom.length == 0) {
            response = "Nobody to remove. All people in waitlist are in room.";
        }
        output({text: response, destination: data.source,
            userid: data.userid});
    }
}
