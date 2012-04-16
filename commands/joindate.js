exports.name = 'joindate';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    var datejoined = new Date(parseInt(data.userid.substring(0,8), 16) * 1000);
    output({text: data.name + ', you joined on ' + datejoined.toLocaleString(), destination: data.source, userid: data.userid});
}