//Reptar call!
//Randomly picks a response in reptarCall()

exports.name = 'reptar';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = false;
exports.handler = function(data) {
    var response = reptarCall();
    output({text: response, destination: data.source, userid: data.userid});
}