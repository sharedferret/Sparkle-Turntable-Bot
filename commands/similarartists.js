exports.name = '.similarartists';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.lastfm.useapi) {
        request('http://ws.audioscrobbler.com/2.0/?method=artist.getSimilar'
            + '&artist=' + encodeURIComponent(currentsong.artist)
            + '&api_key=' + config.lastfm.lastfmkey + '&format=json&limit=4',
            function cbfunc(error, response, body) {
                //If call returned correctly, continue
                if(!error && response.statusCode == 200) {
                    var formatted = eval('(' + body + ')');
                    var botstring = 'Similar artists to ' + currentsong.artist + ': ';
                    try {
                        for (i in formatted.similarartists.artist) {
                            botstring += formatted.similarartists.artist[i].name + ', ';
                        }
                    } catch (e) {
                        //
                    }
                    var response = (botstring.substring(0, botstring.length - 2));
                    output({text: response, destination: data.source, userid: data.userid});
                }
        });
    }
}