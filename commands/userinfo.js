exports.name = 'userinfo';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    var nameforid = data.text.substring(9);
    bot.getUserId(nameforid, function(iddata) {
        if (iddata.success) {
            bot.getProfile(iddata.userid, function(d) {
                var response = d.name;
                if (d.acl > 0) {
                    response += ' is a superuser,';
                }
                response += ' has ' + d.points + ' points, ' + d.fans
                    + ' fans, uses a';
                if (d.laptop == 'android') {
                    response += ' Droid';
                } else if (d.laptop == 'iphone') {
                    response += 'n iPhone';
                } else if (d.laptop == 'pc') {
                    response += ' PC';
                } else if (d.laptop == 'mac') {
                    response += ' Mac';
                } else if (d.laptop == 'linux') {
                    response += ' Linux distro';
                } else if (d.laptop == 'chrome') {
                    response += ' Chromebook';
                } else {
                    response += ' ' + d.laptop;
                }
                var datejoined = new Date(parseInt(d.userid.substring(0,8), 16) * 1000);
                response += ', and joined ' + datejoined.toLocaleString() + '.';
                
                output({text: response, destination: data.source, userid: data.userid});
            });
        } else {
            var response = nameforid + ' is not a valid username on TT.fm.';
            output({text: response, destination: data.source, userid: data.userid});
        }
    });
    
}