exports.name = 'getpicture';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    var nameforid = data.text.substring(11);
    bot.getUserId(nameforid, function(iddata) {
        if (iddata.success) {
            bot.getProfile(iddata.userid, function(d) {
                var response = '';
				console.log('profile', d);
                
                //Try Facebook
				//TODO: Re-add Twitter profile picture check (requires 1.1 OAuth)
                if (d.facebook != null && d.facebook != '') {
					response = d.name + '\'s picture: https://graph.facebook.com/' + d.facebook + '/picture?type=large';
                } else {
                
                    response = 'I can\'t find one.';
                }
                output({text: response, destination: data.source, userid: data.userid});
            });
        } else {
            var response = nameforid + ' is not a valid username on TT.fm.';
            output({text: response, destination: data.source, userid: data.userid});
        }
    });
    
}