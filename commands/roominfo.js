//Reptar call!
//Randomly picks a response in reptarCall()

exports.name = 'roominfo';
exports.hidden = true;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    var response = reptarCall();
    bot.roomInfo(function(d) {
        output({text:d.room.description, destination: data.source, userid: data.userid});
        });
}