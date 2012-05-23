exports.name = '.forecast';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    var userlocation = data.text.substring(10);
    if (userlocation == '') {
        userlocation = 20151;
    }
    
    request('http://www.google.com/ig/api?weather=' + encodeURIComponent(userlocation),
        function cb(error, response, body) {
        parser.parseString(body, function(err, result) {
            if (result.weather.forecast_conditions != null) {
                try {
                    var rp = 'Forecast for ' + result.weather.forecast_information.city['@'].data + ': ';
                    for (i in result.weather.forecast_conditions) {
                        rp += result.weather.forecast_conditions[i].day_of_week["@"].data
                            + ': '
                            + result.weather.forecast_conditions[i].condition["@"].data
                            + ' (' + result.weather.forecast_conditions[i].high["@"].data
                            + '°/' + result.weather.forecast_conditions[i].low["@"].data
                            + '°). ';
                    }
                    output({text: rp, destination: data.source, userid: data.userid});
                } catch (e) {
                    output({text: 'An error occurred.', destination: data.source, userid: data.userid});
                }
            } else {
                output({text: 'Sorry, I can\'t find that location.',
                    destination: data.source, userid: data.userid});
            }
        });
    });
}