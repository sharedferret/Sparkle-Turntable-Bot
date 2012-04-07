exports.name = '.weather';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    var userlocation = data.text.substring(9);
    if (userlocation == '') {
        userlocation = 20151;
    }
    request('http://query.yahooapis.com/v1/public/yql?q=use%20\'http%3A%2F%2Fgithub'
            + '.com%2Fyql%2Fyql-tables%2Fraw%2Fmaster%2Fweather%2Fweather.bylocatio'
            + 'n.xml\'%20as%20we%3B%0Aselect%20*%20from%20we%20where%20location%3D'
            + '%22' + encodeURIComponent(userlocation) + '%22%20and%20unit%3D\'f\''
            + '&format=json&diagnostics=false',
        function cbfunc(error, response, body) {
            if (!error && response.statusCode == 200) {
                var formatted = JSON.parse(body);
                try {
                    var loc = formatted.query.results.weather.rss.channel.location.city + ', '
                    if (formatted.query.results.weather.rss.channel.location.region != '') {
                        loc += formatted.query.results.weather.rss.channel.location.region;
                    } else {
                        loc += formatted.query.results.weather.rss.channel.location.country;
                    }
                    var temp = formatted.query.results.weather.rss.channel.item.condition.temp;
                    var cond = formatted.query.results.weather.rss.channel.item.condition.text;
                    var response = ('The weather in ' + loc + ' is ' + temp + 'ºF and ' + cond + '.');
                    
                    output({text: response, destination: data.source, userid: data.userid});
                } catch(e) {
                console.log(e);
            var response = ('Sorry, I can\'t find that location.');
            output({text: response, destination: data.source, userid: data.userid});
            }
        }
    });
}