exports.name = '.similar';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if (config.lastfm.useapi) {
        request('http://ws.audioscrobbler.com/2.0/?method=track.getSimilar'
            + '&artist=' + encodeURIComponent(currentsong.artist)
            + '&track='  + encodeURIComponent(currentsong.song)
            + '&api_key=' + config.lastfm.lastfmkey + '&format=json&limit=5',
            function cbfunc(error, response, body) {
                //If call returned correctly, continue
                if(!error && response.statusCode == 200) {
                    //TODO: Fix this
                    var formatted = eval('(' + body + ')');
                    var botstring = 'Similar songs to ' + currentsong.song + ': ';
                    
                    //TODO: Make sure this is the best way to do this.
                    try {
                        //Ignore the first two songs since last.fm returns
                        //two songs by the same artist when making this call
                        botstring += formatted.similartracks.track[2].name + ' by '
                            + formatted.similartracks.track[2].artist.name + ', ';
                        botstring += formatted.similartracks.track[3].name + ' by '
                            + formatted.similartracks.track[3].artist.name + ', ';
                        botstring += formatted.similartracks.track[4].name + ' by '
                            + formatted.similartracks.track[4].artist.name + ', ';
                    } catch (e) {
                        //
                    }
                    var response = (botstring.substring(0, botstring.length - 2));
                    output({text: response, destination: data.source, userid: data.userid});
                }
        });
    }
}