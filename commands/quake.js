exports.name = '.quake';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (parser != null) {
        request('http://earthquake.usgs.gov/earthquakes/catalogs/1day-M2.5.xml', 
        function (error, response, body) {
            parser.parseString(body, function (err, result) {
                var earthquakes = result.feed.entry;
                if (earthquakes == null) {
                    bot.speak('Rock me like a... uhh.. earthquake? Well, that didn\'t work');
                    console.log('Unable to parse earthquake info');
                    return;
                }
                var rp = 'Recent earthquakes: ';
                for (var i = 0; i < earthquakes.length && i < 3; i++) {
                    var timeelapsed = new Date() - new Date(earthquakes[i].updated);
                    var hrs = Math.floor(timeelapsed/60000/60);
                    var mins = Math.floor((timeelapsed%(1000*60*60)) / 60000);
                    rp += earthquakes[i].title + ' (' + hrs + 'h ' + mins + 'm ago). ';
                }
                output({text: rp, destination: data.source, userid: data.userid});
            });
        });
    }
}
