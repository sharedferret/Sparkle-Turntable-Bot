//Returns information on the current song (for users without TT+)

exports.name = 'songinfo';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    var response = (currentsong.song + ' (mid-song stats): Awesomes: ' + currentsong.up + '  Lames: '
            + currentsong.down + '  Snags: ' + currentsong.snags);
    output({text: response, destination: data.source, userid: data.userid});
}