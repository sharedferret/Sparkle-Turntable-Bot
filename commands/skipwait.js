exports.name = 'skipwait';
exports.hidden = true;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    if (admincheck(data.userid)) {
        for (i in usersList) {
            if (usersList[i].name.toLowerCase() == data.text.substring(9))
            {
                for (j in pastdjs) {
                    if (pastdjs[j].id == i) {
                        pastdjs.splice(j, 1);
                        output({text: usersList[i].name + ' has been removed from the wait list.',
                            destination: data.source, userid: data.userid});
                    }
                }
            }
        }
    }
}