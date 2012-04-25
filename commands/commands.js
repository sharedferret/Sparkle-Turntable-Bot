//Displays the list of commands found in ./commands/

exports.name = 'commands';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    var response = 'Commands: ' + commands.filter(function(command) {
        return command.enabled && !command.hidden;
    }).map(function(command){return command.name;}).sort().join(', ');
    output({text: response, destination: data.source, userid: data.userid});
}