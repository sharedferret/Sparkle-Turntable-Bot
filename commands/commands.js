//Displays the list of commands found in ./commands/

exports.name = 'commands';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    
    var comms = commands.filter(function(command) {
        return command.enabled && !command.hidden;
    }).map(function(command){
        if (command.name instanceof Array) {
            return command.name;
        } else {
            return [command.name];
        }
    });
    
    
    var merged = [];
    merged = merged.concat.apply(merged, comms).sort();
    output({text: "Commands are: " + merged.join(', '), destination: 'pm', userid: data.userid});
}
