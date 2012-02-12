var houseboatbabies = [
    ['CAN YOU FEEL IT?', 86000], 
    ['YES I CAN FEEL IT!', 88500], 
    ['When I\'m at Jenny\'s house', 90000], 
    ['I look for bad ends', 93500], 
    ['Forget your parents!', 96000], 
    ['But it\'s just cat and mouse!', 98500]
];

var blastoff = [
    ['Well I won\'t call you!', 184000],
    ['If you don\'t call me!', 186000],
    ['No no I won\'t call you!', 188000],
    ['If you don\'t call me!', 190000], 
    ['Yeah!', 192000]
];

var sail = [
    ['SAIL', 34500]
];
    
var songlist = [
    ['AWOLNATION', 'Sail', sail],
    ['Reptar', 'Blastoff', blastoff],  
    ['Reptar', 'Houseboat Babies', houseboatbabies]
];

exports.getLyrics = function (artist, song) {
    for (i in songlist) {
        if ((songlist[i][0] == artist) && (songlist[i][1] == song)) {
            return songlist[i][2];
        }
    }
    return null;
}