//Displays the list of commands found in ./commands/

exports.name = 'commands';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    var response = 'Commands: ' + commands.filter(function(command) {
        return command.enabled && !command.hidden;
    }).join(', ');
    output({text: response.substring(0, response.length - 2), destination: data.source, userid: data.userid});
}
