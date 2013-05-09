//Says something funny

exports.name = 'come at me bro';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;

exports.handler = function(data) {
    var urls = ['http://i.imgur.com/NfPxyYv.gif',
         'http://i.imgur.com/NrSpjLJ.gif',
         'http://i.imgur.com/nDSOUVU.png',
         'http://i.imgur.com/O2luo9a.gif',
         'http://i.imgur.com/BJr5xRD.jpg',
         'http://i.imgur.com/FFjrQlz.jpg',
         'http://i.imgur.com/aX4Lf60.gif',
         'http://i.imgur.com/4gT9jod.gif',
         'http://i.imgur.com/mSiZ0Cz.gif',
         'http://25.media.tumblr.com/f7c92c51222ee0c7acd6b923884fa392/tumblr_mfate9ACPm1s0da1po1_500.gif',
         ];
    output({text: "SAY WUT? - " + urls[ parseInt(Math.random() * urls.length) ],
            destination: data.source,
            userid: data.userid});
}
