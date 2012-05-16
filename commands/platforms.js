//Returns the number of each type of laptop present in the room

exports.name = 'platforms';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    var platforms = {
        pc: 0,
        mac: 0,
        linux: 0,
        chrome: 0,
        iphone: 0,
        android: 0};
    for (i in usersList) {
        platforms[usersList[i].laptop]++;
    }
    var response = ('Platforms in this room: '
        + 'PC: ' + platforms.pc
        + '.  Mac: ' + platforms.mac
        + '.  Linux: ' + platforms.linux
        + '.  Chrome: ' + platforms.chrome
        + '.  iPhone: ' + platforms.iphone
        + '.  Android: ' + platforms.android + '.');
    output({text: response, destination: data.source, userid: data.userid});
}