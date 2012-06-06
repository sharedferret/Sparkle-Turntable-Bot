exports.name = '.fq';
exports.hidden = true;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    if (admincheck(data.userid)) {
        for (i in usersList) {
            if (usersList[i].name.toLowerCase() == data.text.substring(4)) {
                waitlist.unshift({name: usersList[i].name, id: i});
                output({text: usersList[i].name + ' has been added to the start of the queue.',
                    destination: data.source, userid: data.userid});
            }
        }
    }
}