exports.name = 'getpicture';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    var nameforid = data.text.substring(11);
    bot.getUserId(nameforid, function(iddata) {
        if (iddata.success) {
            bot.getProfile(iddata.userid, function(d) {
                var response;
                
                //Try Facebook
                if (d.facebook != null && d.facebook != '') {
                    var loc = d.facebook.indexOf('facebook.com/');
                    if (loc >= 0) {
                        var innerloc = d.facebook.indexOf('profile.php?id=');
                        var profileid = d.facebook.substring(loc + 13);
                        if (innerloc >= 0) {
                            profileid = d.facebook.substring(innerloc + 15);
                        }
                        response = d.name + '\'s picture: https://graph.facebook.com/' + profileid + '/picture?type=large';
                    }
                }
                
                //Try Twitter
                else if (d.twitter != null && d.twitter != '') {
                    response = d.name + '\'s picture: https://api.twitter.com/1'
                        + '/users/profile_image?screen_name=' + d.twitter + '&size=bigger';
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