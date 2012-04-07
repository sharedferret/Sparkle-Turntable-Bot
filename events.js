exports.readyEventHandler = function (data) {

    if (config.database.usedb) {
		setUpDatabase();
	}
    
	bot.roomRegister(config.roomid);
}

//Runs when the room is changed.
//Updates the currentsong array and users array with new room data.
exports.roomChangedEventHandler = function(data) {

    moderators = data.room.metadata.moderator_id;

	//Fill currentsong array with room data
    if ((data.room != null) && (data.room.metadata != null)) {
        if (data.room.metadata.current_song != null) {
            populateSongData(data);
        }

        //Creates the dj list
        for (i in data.room.metadata.djs) {
            if (config.enforcement.enforceroom) {
                djs.push({id: data.room.metadata.djs[i], remaining: config.enforcement.songstoplay});
            } else {
                djs.push({id: data.room.metadata.djs[i], remaining: 0});
            }
        }
    }
	
    //If the bonus flag is set to VOTE, find the number of awesomes needed for
    //the current song
	if (config.bonusvote == 'VOTE') {
		bonusvotepoints = getVoteTarget();
	}
    
    
	//Set bot's laptop type
	bot.modifyLaptop(config.botinfo.laptop);
	
	//Repopulates usersList array.
	var users = data.users;
	for (i in users) {
		var user = users[i];
		usersList[user.userid] = user;
	}
    
    //Adds all active users to the users table - updates lastseen if we've seen
    //them before, adds a new entry if they're new or have changed their username
    //since the last time we've seen them
    
    if (config.database.usedb) {
        for (i in users) {
            client.query('INSERT INTO ' + config.database.dbname + '.' + config.database.tablenames.user
            + ' (userid, username, lastseen)'
                + 'VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE lastseen = NOW()',
                [users[i].userid, users[i].name]);
        }
    }
	
}

//Runs when a user updates their vote
//Updates current song data and logs vote in console
exports.updateVoteEventHandler = function (data) {
	//Update vote and listener count
	currentsong.up = data.room.metadata.upvotes;
	currentsong.down = data.room.metadata.downvotes;
	currentsong.listeners = data.room.metadata.listeners;
    
    for (i in sockets) {
        if (sockets[i].votes == true) {
            var response = {response: 'currentsong', value: currentsong};
            try {
                sockets[i].socket.write(JSON.stringify(response));
            } catch(e) {
                console.log('TCP Error: ' + e);
            }
        }
    }
	
    //If the vote exceeds the bonus threshold and the bot's bonus mode
    //is set to VOTE, give a bonus point
	if ((config.bonusvote == 'VOTE') && !bonusvote && (currentsong.djid != config.botinfo.userid)) {
		if (currentsong.up >= bonusvotepoints) {
			bot.vote('up');
			bot.speak('Bonus!');
			bonuspoints.push('xxMEOWxx');
			bonusvote = true;
		}
	}

	//Log vote in console
	//Note: Username only displayed for upvotes, since TT doesn't broadcast
	//      username for downvote events.
	if (config.consolelog) {
		if (data.room.metadata.votelog[0][1] == 'up') {
			var voteduser = usersList[data.room.metadata.votelog[0][0]];
				console.log('Vote: [+'
				+ data.room.metadata.upvotes + ' -'
				+ data.room.metadata.downvotes + '] ['
				+ data.room.metadata.votelog[0][0] + '] '
				+ voteduser.name + ': '
				+ data.room.metadata.votelog[0][1]);
		} else {
			console.log('Vote: [+'
				+ data.room.metadata.upvotes + ' -'
				+ data.room.metadata.downvotes + ']');
		}
	}
}

//Runs when a user joins
//Adds user to userlist, logs in console, and greets user in chat.
exports.registeredEventHandler = function (data) {
	//Log event in console
	if (config.consolelog) {
		console.log('Joined room: ' + data.user[0].name);
	}
	
	//Add user to usersList
	var user = data.user[0];
	usersList[user.userid] = user;
    if (currentsong != null) {
        currentsong.listeners++;
    }
    
    //Send event
    for (i in sockets) {
        if (sockets[i].online == true) {
            var response = {response: 'online', value: currentsong.listeners};
            try {
                sockets[i].socket.write(JSON.stringify(response));
            } catch(e) {
                console.log('TCP Error: ' + e);
            }
        }
    }
	
    //If the bonus flag is set to VOTE, find the number of awesomes needed
	if (config.bonusvote == 'VOTE') {
		bonusvotepoints = getVoteTarget();
	}

	//Greet user
	//Displays custom greetings for certain members
	if(config.responses.welcomeusers) {
        welcomeUser(user.name, user.userid);
	}
    
    if (config.responses.welcomepm) {
        if (config.database.usedb) {
            client.query('SELECT lastseen, NOW() AS now FROM ' + config.database.dbname + '.' + config.database.tablenames.user
                + ' WHERE userid LIKE \'' + user.userid + '\' ORDER BY lastseen desc LIMIT 1',
                function cb(error, results, fields) {
                    if (results[0] != null) {
                        var time = results[0]['lastseen'];
                        var curtime = results[0]['now'];
                        //Send a welcome PM if user hasn't joined in 36+ hours
                        if ((new Date().getTime() - time.getTime()) > 129600000) {
                            output({text: 'Welcome to Indie/Classic Alternative 1 & Done! No queue, fastest finger, '
                            + 'play one song and step down. Full rules at http://tinyurl.com/63hr2jl . Type '
                            + '\'commands\' to see a list of commands I can respond to.',
                            destination: 'pm', userid: user.userid});
                        }
                    } else {
                        output({text: 'Welcome to Indie/Classic Alternative 1 & Done! No queue, fastest finger, '
                            + 'play one song and step down. Full rules at http://tinyurl.com/63hr2jl . Type '
                            + '\'commands\' to see a list of commands I can respond to.',
                            destination: 'pm', userid: user.userid});
                    }
            });
        } else {
            output({text: 'Welcome to Indie/Classic Alternative 1 & Done! No queue, fastest finger, '
                + 'play one song and step down. Full rules at http://tinyurl.com/63hr2jl . Type '
                + '\'commands\' to see a list of commands I can respond to.',
                destination: 'pm', userid: user.userid});
        }
    }
    
    //Add user to user table
    if (config.database.usedb) {
        client.query('INSERT INTO ' + config.database.dbname + '.' + config.database.tablenames.user
        + ' (userid, username, lastseen)'
            + 'VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE lastseen = NOW()',
            [user.userid, user.name]);
    }
}

//Runs when a user leaves the room
//Removes user from usersList, logs in console
exports.deregisteredEventHandler = function (data) {
	//Log in console
	if (config.consolelog) {
		console.log('Left room: ' + data.user[0].name);
	}
    
    currentsong.listeners--;
    
    //Send event
    for (i in sockets) {
        if (sockets[i].online == true) {
            var response = {response: 'online', value: currentsong.listeners};
            try {
                sockets[i].socket.write(JSON.stringify(response));
            } catch(e) {
                console.log('TCP Error: ' + e);
            }
        }
    }
	
	//Remove user from userlist
    //TODO: Replace this with a .splice fn
	delete usersList[data.user[0].userid];
}

//Runs when something is said in chat
//Responds based on coded commands, logs in console, adds chat entry to chatlog table
//Commands are added under switch(text)
exports.speakEventHandler = function (data) {
	//Log in console
	if (config.consolelog) {
		console.log('Chat [' + data.userid + ' ' + data.name +'] ' + data.text);
	}

	//Log in db (chatlog table)
	if (config.database.usedb && config.database.logchat) {
		client.query('INSERT INTO ' + config.database.dbname + '.' + config.database.tablenames.chat + ' '
			+ 'SET userid = ?, chat = ?, time = NOW()',
			[data.userid, data.text]);
	}

	//If it's a supported command, handle it	
    
    if (config.responses.respond) {
        handleCommand(data.name, data.userid, data.text.toLowerCase(), 'speak');
    }
}

exports.noSongEventHandler = function(data) {
    //
}

//Runs at the end of a song
//Logs song in database, reports song stats in chat
exports.endSongEventHandler = function (data) {
	//Log song in DB
	if (config.database.usedb) {
		addToDb();
	}

    //If a DJ that needed to step down hasn't by the end of the
    //next DJ's song, remove them immediately
    if (config.enforcement.enforceroom && !userstepped) {
        bot.remDj(usertostep);
    }
    
	//Used for room enforcement
    //Reduces the number of songs remaining for the current DJ by one
    if (config.enforcement.enforceroom) {
        reducePastDJCounts(currentsong.djid);
    }
    else {
        for (i in djs) {
            if (djs[i].id == currentsong.djid) {
                djs[i].remaining++;
            }
        }
    }
    

	//Report song stats in chat
	if (config.responses.reportsongstats) {
		bot.speak(currentsong.song + ' stats: awesomes: '
			+ currentsong.up + ' lames: ' + currentsong.down
			+ ' snags: ' + currentsong.snags);
	}
    
    
}

//Runs when a new song is played
//Populates currentsong data, tells bot to step down if it just played a song,
//logs new song in console, auto-awesomes song
exports.newSongEventHandler = function (data) {
	//Populate new song data in currentsong
	populateSongData(data);

	//Skrillex is awful
	if ((currentsong.artist.indexOf('Skrillex') != -1) || (currentsong.song.indexOf('Skrillex') != -1)) {
		bot.remDj(currentsong.djid);
		bot.speak('NO.');
	}

	//Enforce stepdown rules
	if (usertostep != null) {
		if (usertostep == config.botinfo.userid) {
			bot.remDj(config.botinfo.userid);
        } else if (config.enforcement.enforceroom) {
			enforceRoom();
		}
	}

	//Log in console
	if (config.consolelog) {
		console.log('Now Playing: '+currentsong.artist+' - '+currentsong.song);
	}
	
	//Reset bonus points
	bonusvote = false;
	bonuspoints = new Array();
	if (config.bonusvote == 'VOTE') {
		bonusvotepoints = getVoteTarget();
	} else if (config.bonusvote == 'AUTO' && (currentsong.djid != config.botinfo.userid)) {
        var randomwait = Math.floor(Math.random() * 20) + 4;
        setTimeout(function() {
            bot.vote('up');
        }, randomwait * 1000);
    }
    
    //If the botSing is enabled, see if there are any lyrics for this song
    if (config.responses.sing) {
        //Try to find lyrics from singalong.js
        var lyrics = singalong.getLyrics(currentsong.artist, currentsong.song);
        if (lyrics != null) {
            //If lyrics were found, loop through and set a timeout for each
            for (i in lyrics) {
                var fnc = function(y) { 
                    setTimeout(function() { bot.speak(lyrics[y][0]); }, lyrics[y][1]);
                }(i);
            }
        }
    }
}

//Runs when a dj steps down
//Logs in console
exports.remDjEventHandler = function (data) {
	//Log in console
	//console.log(data.user[0]);
	if (config.consolelog) {
		console.log('Stepped down: '+ data.user[0].name + ' [' + data.user[0].userid + ']');
	}

	//Adds user to 'step down' vars
	//Used by enforceRoom()
	if (usertostep == data.user[0].userid) {
        //Reset stepdown vars
        userstepped = true;
        usertostep = null;
        
        if (config.enforcement.enforceroom && config.enforcement.stepuprules.waittostepup) {
            addToPastDJList(data.user[0].userid);
        }
	}
    
    //Set time this event occurred for enforcing one and down room policy
    if (legalstepdown) {
        enforcementtimeout = new Date();
    }

	//Remove from dj list
	for (i in djs) {
		if (djs[i].id == data.user[0].userid) {
			djs.splice(i, 1);
		}
	}
    
    //If more than one DJ spot is open, set free-for-all mode to true
    if (config.enforcement.enforceroom && config.enforcement.ffarules.multiplespotffa) {
        ffa = (djs.length < 4);
    }
    
    if ((config.enforcement.waitlist) && (waitlist.length > 0) && legalstepdown) {
        bot.speak('The next spot is for @' + waitlist[0].name + '!');
        output({text: 'Hey! This spot is yours, so go ahead and step up!', destination: 'pm',
            userid: waitlist[0].id});
    }
    legalstepdown = true;
}

//Runs when a dj steps up
//Logs in console
exports.addDjEventHandler = function(data) {
    
	//Log in console
	if (config.consolelog) {
		console.log('Stepped up: ' + data.user[0].name);
	}
    
    //Add to DJ list
    if (config.enforcement.enforceroom) {
        djs.push({id: data.user[0].userid, remaining: config.enforcement.songstoplay});
    } else {
        djs.push({id: data.user[0].userid, remaining: 0});
    }
    
    if (config.enforcement.waitlist) {
        checkWaitlist(data.user[0].userid, data.user[0].name);
    }
    //See if this user is in the past djs list
    else if (config.enforcement.enforceroom && config.enforcement.stepuprules.waittostepup) {
        checkStepup(data.user[0].userid, data.user[0].name);
    }
}

exports.snagEventHandler = function(data) {
    //Increase song snag count
	currentsong.snags++;
	
    //If bonus is chat-based, increase bonus points count
	if (config.bonusvote == 'CHAT') {
		bonuspoints.push(usersList[data.userid].name);
	}
	
	var target = getTarget();
	if((bonuspoints.length >= target) && !bonusvote && (config.bonusvote == 'CHAT') && (currentsong.djid != config.botinfo.userid)) {
		bot.speak('Bonus!');
		bot.vote('up');
		bot.snag();
		bonusvote = true;
	}	
}

exports.bootedUserEventHandler = function(data) {
	//if the bot was booted, reboot
	if((config.botinfo.userid == data.userid) && config.maintenance.autorejoin) {
		setTimeout(function() {
			bot.roomRegister(config.roomid);
		}, 25000);
		setTimeout(function() {
			bot.speak('Please do not boot the room bot.');
		}, 27000);
	}
}

exports.pmEventHandler = function(data) {
    try {
        if (usersList[data.senderid] != null) {
            handleCommand(usersList[data.senderid].name, data.senderid, data.text.toLowerCase(), 'pm');
        } else if (config.database.usedb) {
            client.query('SELECT username FROM `USERS` WHERE userid LIKE \'' + data.senderid
                + '\' ORDER BY lastseen DESC LIMIT 1',
                function cb(error, results, fields) {
                    if (results[0] != null) {
                        handleCommand(results[0]['username'], data.senderid, data.text.toLowerCase(), 'pm');
                    } else {
                        handleCommand('PM user', data.senderid, data.text.toLowerCase(), 'pm');
                    }
            });
        } else {
            output({text: 'Please drop by our room first! http://http://turntable.fm/indieclassic_alternative_1_done',
                destination: 'pm', userid: data.senderid});
        }
    } catch (e) {
        bot.pm(data.senderid, 'Oh dear, something\'s gone wrong.');
    }
}
 

exports.updateUserEventHandler = function(data) {
    //Update user name in users table
    if (config.database.usedb && (data.name != null)) {
        client.query('INSERT INTO ' + config.database.dbname + '.' + config.database.tablenames.user
            + ' (userid, username, lastseen)'
                + 'VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE lastseen = NOW()',
                [data.userid, data.name]);
        }
}

exports.newModeratorEventHandler = function(data) {
    moderators.push(data.userid);
}

exports.removeModeratorEventHandler = function(data) {
    for (i in moderators) {
        if (moderators[i] == data.userid) {
            moderators.splice(i, 1);
        }
    }
    
    //If the bot admin was demodded, remod them
	if(config.admin == data.userid) {
		setTimeout(function() {
			bot.addModerator(config.admin);
		}, 200);
	}
}

exports.tcpConnectEventHandler = function(socket) {
	socket.write('>> Welcome! Type a command or \'help\' to see a list of commands\n');
    sockets.push({socket: socket, online: false, votes: false});
}

exports.tcpEndEventHandler = function(socket) {
    for (i in sockets) {
        if (sockets[i].socket.destroyed) {
            sockets.splice(i, 1);
        }
    }
}

exports.tcpMessageEventHandler = function(socket, msg) {
    //If the message ends in a ^M character, remove it.
    if (msg.substring(msg.length - 1).match(/\cM/)) {
        msg = msg.substring(0, msg.length - 1);
    }
    
    var jsonmsg;
    try {
        jsonmsg = JSON.parse(msg);
    } catch (e) {
        return;
    }
    
    //JSON message handler
    var response = {response: 'INVALID QUERY'};
    if (jsonmsg.command != null) {
        switch (jsonmsg.command) {
        
            //Get commands
            
            //Deprecated
            case 'sendonlineevents':
                for (i in sockets) {
                    if (sockets[i].socket == socket) {
                        if (jsonmsg.parameter == 'true') {
                            sockets[i].online = true;
                        } else if (jsonmsg.parameter == 'false') {
                            sockets[i].online = false;
                        }
                        response = {response: 'sendvoteevents', value: sockets[i].online};
                    }
                }
                break;
                
            //Deprecated
            case 'sendvoteevents':
                for (i in sockets) {
                    if (sockets[i].socket == socket) {
                        if (jsonmsg.parameter == 'true') {
                            sockets[i].votes = true;
                        } else if (jsonmsg.parameter == 'false') {
                            sockets[i].votes = false;
                        }
                        response = {response: 'sendvoteevents', value: sockets[i].votes};
                        setTimeout(function () {
                        socket.write(JSON.stringify({response: 'currentsong', 
                            value: currentsong}));
                        }, 200);
                        
                    }
                }
                break;
                
            case 'online':
                response = {response: 'online', value: currentsong.listeners};
                break;
                
            case 'users': 
                response = {response: 'users', value: usersList};
                break;
                
            case 'uptime':
                response = {response: 'uptime', value: uptime};
                break;
            
            case 'currentsong':
                response = {response: 'currentsong', value: currentsong};
                break;
                
                
            case 'speak':
                bot.speak(jsonmsg.parameter);
                response = {response: 'speak', value: true};
                break;
                
            case 'boot':
                bot.boot(jsonmsg.parameter);
                response = {response: 'boot', value: true};
                break;
            
            case 'getconfig':
                response = {response: 'getconfig', value: config};
                break;
            
            case 'vote':
                if (jsonmsg.parameter == 'up') {
                    bot.vote('up');
                } else if (jsonmsg.parameter == 'down') {
                    bot.vote('down');
                }
                break;
                
            case 'stepup':
                bot.addDj();
                response = {response: 'stepup', value: true};
                break;
            
            case 'stepdown':
                bot.remDj(config.botinfo.userid);
                response = {response: 'stepdown', value: true};
                break;
                
            case 'pulldj':
                bot.remDj(usertostep);
                response = {response: 'pulldj', value: true};
                break;
                
            case 'exit':
                response = {response: 'exit', value: true};
                socket.end();
                break;
                
            //Database get commands
            
            //Set commands
            /**
            case 'setconfig':
                //Authenticate using jsonmsg.login.username, jsonmsg.login.password
                var newconfig = jsonmsg.parameter;
                config = newconfig;
                response = {response: 'setconfig', value: config};
                break;
            */
        }
    }
    socket.write(JSON.stringify(response));
}

exports.httpRequestEventHandler = function(request, response) {
    var urlRequest = request.url;
    var queryArray = url.parse(urlRequest, true).query; //HTTP GET requests
    
    console.log(queryArray);
    switch (queryArray.command) {
        case 'ping':
            if(queryArray.response == 'json') {
                response.writeHead(200, {'Content-Type': 'text/plain'});
                var rp = {response: 'ping', value: uptime};
                response.end(JSON.stringify(rp));
            } else {
                response.writeHead(200, {'Content-Type': 'text/plain'});
                response.end('Pong!\n');
            }
            break;
            
        case 'online':
            if(queryArray.response == 'json') {
                response.writeHead(200, {'Content-Type': 'text/plain'});
                var rp = {response: 'online', value: currentsong.listeners};
                response.end(JSON.stringify(rp));
            } else {
                response.writeHead(200, {'Content-Type': 'text/plain'});
                response.end('There are ' + currentsong.listeners + ' users online.\n');
            }
            break;
        
        case 'users':
            if(queryArray.response == 'json') {
                response.writeHead(200, {'Content-Type': 'text/plain'});
                var rp = {response: 'users', value: usersList};
                response.end(JSON.stringify(rp));
            } else {
                var output = '';
                for (var i in usersList) {
                    output += (usersList[i].name) + ', ';
                }
                response.writeHead(200, {'Content-Type': 'text/plain'});
                response.end('Users online: ' + output.substring(0, output.length - 2) + '\n');
            }
            break;
            
        case 'nowplaying':
            if(queryArray.response == 'json') {
                response.writeHead(200, {'Content-Type': 'text/plain'});
                var rp = {response: 'nowplaying', value: currentsong};
                response.end(JSON.stringify(rp));
            } else {
                response.writeHead(200, {'Content-Type': 'text/plain'});
                response.end('Current song: ' + currentsong.artist + ' - ' + currentsong.song
                    + '\nDJ ' + currentsong.djname + ' (+' + currentsong.up + '/-'
                    + currentsong.down + ')\n');
            }
            break;   
        
        case 'speak':
            if (checkAuth(queryArray.auth)) {
                
            }
            break;
            
        case 'boot':
            if (checkAuth(queryArray.auth)) {
                for (i in usersList) {
                    if (queryArray.name == usersList[i].name) {
                        bot.boot(i, queryArray.reason);
                    }
                }
            }
            break;
            
        case 'config.get':
            if (checkAuth(queryArray.auth)) {
                response.writeHead(200, {'Content-Type': 'text/plain'});
                var rp = {response: 'config', value: config};
                response.end(JSON.stringify(rp));
            }
            break;
        
        case 'vote':
            if (checkAuth(queryArray.auth)) {
                if (queryArray.vote == 'up') {
                    bot.vote('up');
                } else if (queryArray.vote == 'down') {
                    bot.vote('down');
                }
            }
            break;
        
        case 'stepup':
            if (checkAuth(queryArray.auth)) {
                bot.addDj();
            }
            break;
        
        case 'stepdown':
            if (checkAuth(queryArray.auth)) {
                bot.remDj(config.botinfo.userid);
            }
            break;
        
        case 'pulldj':
            if (checkAuth(queryArray.auth)) {
                bot.remDj(usertostep);
            }
            break;
        
        case 'config.set':
            if (checkAuth(queryArray.auth)) {
                //
            }
            break;
        
        case 'djs.info':
            if(queryArray.response == 'json') {
                response.writeHead(200, {'Content-Type': 'text/plain'});
                var rp = {response: 'djs.info', value: djs};
                response.end(JSON.stringify(rp));
            } else {
                if (config.enforcement.enforceroom) {
                    response.writeHead(200, {'Content-Type': 'text/plain'});
                    var rp = '';
                    for (i in djs) {
                        rp += usersList[djs[i].id].name + ' (' 
                            + djs[i].remaining + ' song(s) left), ';
                    }
                    response.end(rp.substring(0, rp.length - 2));
                } else {
                    response.writeHead(200, {'Content-Type': 'text/plain'});
                    var rp = '';
                    for (i in djs) {
                        rp += usersList[djs[i].id].name + ' (played '
                            + djs[i].remaining + '), ';
                    }
                    response.end(rp.substring(0, rp.length - 2));
                }
            }
            break;
        
        case 'djs.wait':
            if (config.enforcement.enforceroom) {
                if (queryArray.response == 'json') {
                    response.writeHead(200, {'Content-Type': 'text/plain'});
                    var rp = {response: 'djs.wait', value: pastdjs};
                    response.end(JSON.stringify(rp));
                } else {
                    var pastdjnames = 'These DJs must wait before stepping up again: ';
                    for (i in pastdjs) {
                        if (usersList[pastdjs[i].id] != null) {
                            //TODO: Change to songs/minutes
                            pastdjnames += usersList[pastdjs[i].id].name
                                + ' (' + pastdjs[i].wait + ' songs), ';
                        }
                    }
                    response.writeHead(200, {'Content-Type': 'text/plain'});
                    response.end(pastdjnames.substring(0, pastdjnames.length - 2));
                }
            }
            break;
        
        case 'queue.print':
            if (config.enforcement.waitlist) {
                var j = 0;
                var rp = 'Queue:\n';
                for (i in waitlist) {
                    j++;
                    rp += '[' + j + ']' + waitlist[i].name + '\n';
                }
                response.writeHead(200, {'Content-Type': 'text/plain'});
                response.end(rp);
            }
            break;
        
        case 'queue.add':
            if (config.enforcement.waitlist) {
                //
            }
            break;
        
        case 'debug':
            response.writeHead(200, {'Content-Type': 'text/plain'});
            var rp = {usertostep: usertostep, userstepped: userstepped, ffa: ffa, legalstepdown: legalstepdown,
                        pastdjs: pastdjs, djs: djs, waitlist: waitlist, currentsong: currentsong};
            response.end(JSON.stringify(rp));
            break;
    }
}