//Responds to reptar-related call

exports.name = 'setlaptop';
exports.hidden = true;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    setTimeout(function() {
        var response = '';
        bot.modifyLaptop(data.text.substring(10), function(d) {
            if (d.success) {
                response = 'Laptop changed to ' + data.text.substring(10) + '.';
            } else {
                response = 'Could not change laptop.';
            }
        });
        output({text: response, destination: data.source, userid: data.userid});
    }, 1200);
}