//Reloads commands from the ./commands/ folder.

exports.name = '.reloadcommands';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    var newCommands = new Array();
    var j = 0;
    try {
        var filenames = fs.readdirSync('./commands');
        for (i in filenames) {
            var command = require('./' + filenames[i]);
            newCommands.push({name: command.name, handler: command.handler, hidden: command.hidden,
                enabled: command.enabled, matchStart: command.matchStart});
            j++;
        }
    } catch (e) {
        output({text: ('Command reload failed: ' + e), destination: 'speak', userid: null});
    }
    commands = newCommands;
    
    output({text: j + ' commands loaded.', destination: 'speak', userid: null});
}