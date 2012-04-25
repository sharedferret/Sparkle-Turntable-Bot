//Snags a song to the bot's playlist

exports.name = 'addtoplaylist';
exports.hidden = true;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    if(admincheck(data.userid)) {
    	 bot.playlistAll(function (data) {
                bot.playlistAdd(currentsong.id, data.list.length);
            }); 
        bot.snag();
        output({text: 'Snagging this song, ' + data.name + '!', destination: data.source, userid: data.userid});
    }
}