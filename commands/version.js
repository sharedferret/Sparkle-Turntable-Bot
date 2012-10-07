exports.name = 'version';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    request('http://registry.npmjs.org/sparklebot/latest',
        function (error, response, body) {
            var currentversion = JSON.parse(body).version;
            var response;
            if (package.version != currentversion) {
                setTimeout(function() {
                    output({text: 'Your version of sparklebot is out of date! Update through npm or at http://git.io/meow', destination: data.source, userid: data.userid});
                }, 1000);
            }
            response = '[Sparkle] ' + package.version + ' (Latest version: ' + currentversion + ')';
            output({text: response, destination: data.source, userid: data.userid});
        });
}