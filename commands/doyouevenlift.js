//Says something funny

exports.name = 'do you even lift';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;

exports.handler = function(data) {
    var urls = ['http://i.imgur.com/cFttFqv.gif',
     'http://i.imgur.com/g1OPptC.gif',
     'http://i.imgur.com/F2xczxP.jpg',
     'http://i.imgur.com/X8ViFgA.jpg',
     'http://i.imgur.com/1esgU0Z.gif',
     'http://i.imgur.com/qUIFLcG.jpg'
    ];
    output({text: "WHAT DID YOU SAY? - " + urls[ parseInt(Math.random() * urls.length) ],
            destination: data.source,
            userid: data.userid});
}
