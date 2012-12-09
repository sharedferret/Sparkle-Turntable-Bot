//Snags a song to the bot's playlist

exports.name = '.snag';
exports.hidden = true;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
	if(admincheck(data.userid)) {
		bot.snag();
		bot.playlistAll(function (data) {
			bot.playlistAdd(currentsong._id, data.list.length);
		});
		output({text: 'Snagging this song, ' + data.name + '!', destination: data.source, userid: data.userid});
	}
}