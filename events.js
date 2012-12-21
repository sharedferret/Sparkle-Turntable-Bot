exports.readyEventHandler = function (data) {
    if (config.database.usedb) {
        setUpDatabase();
    }

	loop();

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
        for (var i in data.room.metadata.djs) {
            if (config.enforcement.enforceroom) {
                djs.push({id: data.room.metadata.djs[i], remaining: config.enforcement.songstoplay, lastActivity: new Date()});
            } else {
                djs.push({id: data.room.metadata.djs[i], remaining: Infinity});
            }
        }
    }
	checkDjs();
    
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
    
    //If the vote exceeds the bonus threshold and the bot's bonus mode
    //is set to VOTE, give a bonus point
    if ((config.bonusvote == 'VOTE') && !bonusvote && (currentsong.djid != config.botinfo.userid)) {
        if (currentsong.up >= bonusvotepoints) {
            bot.vote('up');
            if (config.enforcement.announcebonus) {
                bot.speak('Bonus!');
            }
            bonuspoints.push('xxMEOWxx');
            bonusvote = true;
        }
    }

	// Update the last activity for the dj if it was sending the message and remove the warning
	if(config.enforcement.enforceroom && config.enforcement.idle.idlerules) {
		var votes = data.room.metadata.votelog;
		for(var i = 0; i < votes.length; i++) {
			var vote = votes[i];
			var userid = vote[0];
			for(var i in djs) {
				if(djs[i].id == userid) {
					djs[i].lastActivity = new Date();
					djs[i].warned = false;
				}
			}
		}
	}

    //Log vote in console
    //Note: Username only displayed for upvotes, since TT doesn't broadcast
    //      username for downvote events.
    if (config.consolelog) {
        if (data.room.metadata.votelog[0][1] == 'up') {
            console.log('\u001b[32m[ Vote ] (+'
                + data.room.metadata.upvotes + ' -' + data.room.metadata.downvotes
                + ') ' + usersList[data.room.metadata.votelog[0][0]].name + '\u001b[0m');
        } else {
            console.log('\u001b[31m[ Vote ] (+'
                + data.room.metadata.upvotes + ' -' + data.room.metadata.downvotes
                + ') Downvote\u001b[0m');
        }
    }
}

//Runs when a user joins
//Adds user to userlist, logs in console, and greets user in chat.
exports.registeredEventHandler = function (data) {
    //Log event in console
    if (config.consolelog) {
        console.log('\u001b[34m[Joined] ' + data.user[0].name + '\u001b[0m');
    }
    
    //Add user to usersList
    var user = data.user[0];
    usersList[user.userid] = user;
    if (currentsong != null) {
        currentsong.listeners++;
    }
    
    //If the bonus flag is set to VOTE, find the number of awesomes needed
    if (config.bonusvote == 'VOTE') {
        bonusvotepoints = getVoteTarget();
    }

    //Greet user
    //Displays custom greetings for certain members
    //Wait for user to join chatserver before welcoming
    if(config.responses.welcomeusers) {
        setTimeout(function () {
            welcomeUser(user.name, user.userid);
        }, 1000);
    }
    
    if (config.responses.welcomepm) {
        if (config.database.usedb && !config.responses.alwayspm) {
            client.query('SELECT lastseen, NOW() AS now FROM ' + config.database.dbname + '.' + config.database.tablenames.user
                + ' WHERE userid LIKE \'' + user.userid + '\' ORDER BY lastseen desc LIMIT 1',
                function cb(error, results, fields) {
                    if (results != null && results[0] != null) {
                        var time = results[0]['lastseen'];
                        var curtime = results[0]['now'];
                        //Send a welcome PM if user hasn't joined in 36+ hours
                        if ((new Date().getTime() - time.getTime()) > 129600000) {
                            output({text: config.responses.pmgreet,
                                destination: 'pm', userid: user.userid});
                        }
                    } else {
                        output({text: config.responses.pmgreet,
                            destination: 'pm', userid: user.userid});
                    }
            });
        } else {
            output({text: config.responses.pmgreet,
                destination: 'pm', userid: user.userid});
        }
    }
    
    //Add user to user table
    if (config.database.usedb) {
        client.query('INSERT INTO ' + config.database.dbname + '.' + config.database.tablenames.user
        + ' (userid, username, lastseen)'
            + 'VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE lastseen = NOW()',
            [user.userid, user.name]);
    
    //See if banned
        client.query('SELECT userid, banned_by, DATE_FORMAT(timestamp, \'%c/%e/%y\')'
            + ' FROM ' + config.database.dbname + '.' + config.database.tablenames.banned + ' WHERE userid LIKE \'' + user.userid + '\'',
        function cb (error, results, fields) {
            if (results != null && results.length > 0) {
                bot.boot(user.userid, 'You were banned from this room by ' + results[0]['banned_by']
                    + ' on ' + results[0]['timestamp']);
            }
        });
    }
}

//Runs when a user leaves the room
//Removes user from usersList, logs in console
exports.deregisteredEventHandler = function (data) {
    //Log in console
    if (config.consolelog) {
        console.log('\u001b[36m[ Left ] ' + data.user[0].name + '\u001b[0m');
    }

    
    currentsong.listeners--;
    
    //If waitlist, hold for 30 secs then remove
    if (config.enforcement.waitlist) {
        for (i in waitlist) {
            if (waitlist[i].id == data.user[0].userid) {
                setTimeout(function() {
                    if (waitlist.length > 0) {
                        waitlist.splice(i, 1);
                    }
                }, 30000);
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
        console.log('[ Chat ] ' + data.name +': ' + data.text);
    }

    //Log in db (chatlog table)
    if (config.database.usedb && config.database.logchat) {
        var inputtext = data.text;
        if (inputtext.length > 255) {
            inputtext = inputtext.substring(0, 255);
        }
        client.query('INSERT INTO ' + config.database.dbname + '.' + config.database.tablenames.chat + ' '
            + 'SET userid = ?, chat = ?, time = NOW()',
            [data.userid, inputtext]);
    }

    //If it's a supported command, handle it    
    
    if (config.responses.respond) {
        handleCommand(data.name, data.userid, data.text.toLowerCase(), 'speak');
    }

	// Update the last activity for the dj if it was sending the message and remove the warning
	if(config.enforcement.enforceroom && config.enforcement.idle.idlerules) {
		for(var i in djs) {
			if(djs[i].id == data.userid) {
				djs[i].lastActivity = new Date();
				djs[i].warned = false;
			}
		}
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
    if (config.enforcement.enforceroom && usertostep && !userstepped) {
		bot.remDj(usertostep);
    }
    
    //Used for room enforcement
    //Reduces the number of songs remaining for the current DJ by one
    if (config.enforcement.enforceroom) {
        reducePastDJCounts(currentsong.djid);
    }
    

    //Report song stats in chat
    if (config.responses.reportsongstats) {
        var endsongresponse = currentsong.song + ' stats: Awesomes: '
            + currentsong.up + ':+1: Lames: ' + currentsong.down
            + ':-1: Snags: ' + currentsong.snags + ':heart:';
        if (config.enforcement.waitlist) {
            endsongresponse += ' waitlist: ' + waitlist.length + ' people.';
        }
        bot.speak(endsongresponse);
    }

	//Delete the current song
	currentsong = {};
	checkDjs();
}

//Runs when a new song is played
//Populates currentsong data, tells bot to step down if it just played a song,
//logs new song in console, auto-awesomes song
exports.newSongEventHandler = function (data) {
    //Populate new song data in currentsong
    populateSongData(data);

    //Enforce stepdown rules
    if (usertostep != null) {
        if (config.enforcement.enforceroom) {
            enforceRoom();
        }
    }

    //Log in console
    if (config.consolelog) {
        console.log('\u001b[37mNow Playing: ' + currentsong.artist + ' - ' + currentsong.song + '\u001b[0m');
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
    } else if(config.bonusvote == 'OPTIMIZE' && currentsong.djid != config.botinfo.userid) {
		var time = Math.random() *.6 + .3;
		setTimeout(function() {
			if(currentsong.down == 0 && currentsong.up > 0) {
				bot.vote('up');
			} else if(currentsong.down > currentsong.up) {
				bot.vote('down');
			}
		}, time * currentsong.metadata.length * 1000);
	}
    
    //Decrement partialdjs list
    for (i in partialdjs) {
        partialdjs[i].rem--;
        if (partialdjs[i].rem <= 0) {
            partialdjs.splice(i, 1);
        }
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
        console.log('\u001b[35m[ - DJ ] '+ data.user[0].name + '\u001b[0m');
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
            //If they haven't played all their songs, keep track
            //of that for a while
            if (config.enforcement.enforceroom
                && config.enforcement.stepuprules.waittostepup
                && djs[i].remaining > 0 &&
                djs[i].remaining != config.enforcement.songstoplay)
            {
                var rem = djs[i].remaining;
                if (config.enforcement.stepuprules.waittype == 'SONGS') {
                    rem += config.enforcement.stepuprules.length;
                } else {
                    rem += (config.enforcement.stepuprules.length / 4);
                }
                partialdjs.push({id: djs[i].id,
                    lefttoplay: djs[i].remaining, rem: rem});
            }
            djs.splice(i, 1);
        }
    }

	// Check if the bot was removed
	if(isBot(data.user[0].userid)) {
		isdjing = false;
	} else if(currentsong.djid != config.botinfo.userid) { // Don't remove the bot in th middle of a song
		checkDjs();
	}

    
    //If more than one DJ spot is open, set free-for-all mode to true
    if (config.enforcement.enforceroom && config.enforcement.ffarules.multiplespotffa) {
        ffa = (djs.length < 4);
    }
    
    if ((config.enforcement.waitlist) && (waitlist.length > 0) && legalstepdown) {
        announceNextPersonOnWaitlist();
    }
    legalstepdown = true;
}

//Runs when a dj steps up
//Logs in console
exports.addDjEventHandler = function(data) {
    //Log in console
    if (config.consolelog) {
        console.log('\u001b[35m[ + DJ ] ' + data.user[0].name + '\u001b[0m');
    }
    
    //Add to DJ list
    if (config.enforcement.enforceroom) {
		var toplay = Infinity;

        if(config.enforcement.songslimit.limitsongs) {
			toplay = config.enforcement.songslimit.maxsongs;

			//If they've been up recently, modify their remaining count
			for (i in partialdjs) {
				if (partialdjs[i].id == data.user[0].userid) {
					toplay = partialdjs[i].lefttoplay;
					partialdjs.splice(i, 1);
				}
			}
		}

        djs.push({id: data.user[0].userid, remaining: toplay, lastActivity: new Date(), user: data.user[0] });
    } else {
        djs.push({id: data.user[0].userid, remaining: Infinity});
    }

	// Check if the bot was added
	if(isBot(data.user[0].userid)) {
		isdjing = true;
	} else if(currentsong.djid != config.botinfo.userid) { // Don't remove the bot in th middle of a song
		checkDjs();
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
    //Log in console
    if (config.consolelog) {
        console.log('[ Snag ] ' + usersList[data.userid].name);
    }
    
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
    //Log in console
    if (config.consolelog) {
        console.log('\u001b[37m\u001b[41m[ Boot ] ' + (usersList[data.userid] != null ? usersList[data.userid].name : data.userid) + '\u001b[0m');
    }
    
    //if the bot was booted, reboot
    if(config.botinfo.userid == data.userid) {
        console.log(config.botinfo.botname + ' was booted.', data);
        if (config.maintenance.autorejoin) {
            setTimeout(function() {
                bot.roomRegister(config.roomid);
            }, 25000);
            setTimeout(function() {
                bot.speak('Please do not boot the room bot.');
            }, 27000);
        }
    }
}

exports.pmEventHandler = function(data) {

	// Update the last activity for the dj if it was sending the message and remove the warning
	if(config.enforcement.enforceroom && config.enforcement.idle.idlerules) {
		for(var i in djs) {
			if(djs[i].id == data.senderid) {
				djs[i].lastActivity = new Date();
				djs[i].warned = false;
			}
		}
	}

	try {
        //Case 1: In room. We have their name.
        if (usersList[data.senderid] != null) {
            handleCommand(usersList[data.senderid].name, data.senderid, data.text.toLowerCase(), 'pm');
        //Case 2: In DB. We have their name.
        } else if (config.database.usedb) {
            client.query('SELECT username FROM ' + config.database.dbname + '.' + config.database.tablenames.users + ' WHERE userid LIKE \'' + data.senderid
                + '\' ORDER BY lastseen DESC LIMIT 1',
                function cb(error, results, fields) {
                    if (results != null && results[0] != null) {
                        handleCommand(results[0]['username'], data.senderid, data.text.toLowerCase(), 'pm');
                    } else {
                        bot.getProfile(data.senderid, function(d) {
                            handleCommand(d.name, data.senderid, data.text.toLowerCase(), 'pm');
                        });
                    }
            });
        //Case 3: We can still get their name from TT
        } else {
            bot.getProfile(data.senderid, function(d) {
                handleCommand(d.name, data.senderid, data.text.toLowerCase(), 'pm');
            });
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
    //Log in console
    if (config.consolelog) {
        console.log('\u001b[33m[ +Mod ] ' + usersList[data.userid].name + '\u001b[0m');
    }
    moderators.push(data.userid);
}

exports.removeModeratorEventHandler = function(data) {
    //Log in console
    if (config.consolelog) {
        console.log('\u001b[33m\u001b[41m[ -Mod ] ' + usersList[data.userid].name + '\u001b[0m');
    }
    
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

exports.httpRequestEventHandler = function(request, response) {
    var urlRequest = request.url;
    var queryArray = url.parse(urlRequest, true).query; //HTTP GET requests
    
    var found = false;
    for (i in httpcommands) {
        if (httpcommands[i].enabled && (httpcommands[i].name == queryArray.command)) {
            httpcommands[i].handler(queryArray, response);
            found = true;
        }
    }
    if (!found) {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        var rp = {error: 'Invalid query'};
        response.end(JSON.stringify(rp));
    }
}
