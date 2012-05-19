//Displays the list of commands found in ./commands/

exports.name = 'onlinemods';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    var response = 'Online mods: ' + moderators.filter(function(moderatorid) { return (usersList[moderatorid] != null); }).map(function(moderatorid) { return usersList[moderatorid].name; }).sort().join(', ');
    output({text: response, destination: data.source, userid: data.userid});
}