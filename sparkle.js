/**
 *  sparkle.js
 *  Author: sharedferret
 *  
 *  A Turntable.fm bot for the Indie/Classic Alternative 1 + Done room.
 *  Based on bot implementations by anamorphism and heatvision
 *  Uses node.js with node modules ttapi, mysql, request
 * 
 *  Run: 'node sparkle.js'
 *  
 *  Make sure parameters in config.js are set before running.
 *  Make sure a mysql server instance is running before starting the bot (if useDatabase
 *  is enabled in the config file)
 *
*/

var version = '[experimental] 2012.02.24';

var fs = require('fs');

var Bot;
var config;
var mysql;
var client;
var request;
var singalong;
var enforcement;
var uptime = new Date();
var sockets = new Array();

initializeModules();

//Creates the bot and initializes global vars
var bot = new Bot(config.botinfo.auth, config.botinfo.userid);
if (config.tcp.usetcp) {
	bot.tcpListen(config.tcp.port, config.tcp.host);
}

//Room information
var usersList = { };                //A list of users in the room
var djs = new Array();                      //A list of current DJs

//Room enforcement variables
var usertostep = null;                     //The userid of the DJ to step down
var userstepped = false;            //A flag denoting if that user has stepped down
var enforcementtimeout = new Date();//The time that the user stepped down
var ffa = false;                    //A flag denoting if free-for-all mode is active
var legalstepdown = true;           //A flag denoting if a user stepped up legally
var pastdjs = new Array();          //An array of the past 4 DJs
var djqueue = new Array();
var waitlist = new Array();         // Array of users waiting to get on deck

//Used for bonus awesoming
var bonuspoints = new Array();      //An array of DJs wanting the bot to bonus
var bonusvote = false;              //A flag denoting if the bot has bonus'd a song
var bonusvotepoints = 0;            //The number of awesomes needed for the bot to awesome

//Current song info
var currentsong = {
	artist: null,
	song: null,
	djname: null,
	djid: null,
	up: 0,
	down: 0,
	listeners: 0,
	snags: 0};
    

//When the bot is ready, this makes it join the primary room (ROOMID)
//and sets up the database/tables
bot.on('ready', function (data) {

    if (config.database.usedb) {
		setUpDatabase();
	}
    
	bot.roomRegister(config.roomid);
});

//Runs when the room is changed.
//Updates the currentsong array and users array with new room data.
bot.on('roomChanged', function(data) {
	//Fill currentsong array with room data
    if ((data.room != null) && (data.room.metadata != null)) {
        if (data.room.metadata.current_song != null) {
            populateSongData(data);
        }

        //Creates the dj list
        for (i in data.room.metadata.djs) {
            djs.push({id: data.room.metadata.djs[i], remaining: config.enforcement.songstoplay});
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
	
});

//Runs when a user updates their vote
//Updates current song data and logs vote in console
bot.on('update_votes', function (data) {
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
});

//Runs when a user joins
//Adds user to userlist, logs in console, and greets user in chat.
bot.on('registered',   function (data) {
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
        //Ignore ttdashboard bots
		if (!user.name.match(/^ttdashboard/)) {
			if (config.database.usedb) {
				client.query('SELECT greeting FROM ' + config.database.dbname + '.'
                    + config.database.tablenames.holiday + ' WHERE date LIKE CURDATE()',
					function cbfunc(error, results, fields) {
						if (results[0] != null) {
							bot.speak(results[0]['greeting'] + ', ' + user.name + '!');
						} else {
							bot.speak(config.responses.greeting + user.name + '!');
						}
				});
			} else {
				bot.speak(config.responses.greeting + user.name + '!');
			}
		}
	}
    
    //Add user to user table
    if (config.database.usedb) {
        client.query('INSERT INTO ' + config.database.dbname + '.' + config.database.tablenames.user
        + ' (userid, username, lastseen)'
            + 'VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE lastseen = NOW()',
            [user.userid, user.name]);
    }
});

//Runs when a user leaves the room
//Removes user from usersList, logs in console
bot.on('deregistered', function (data) {
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
});

//Runs when something is said in chat
//Responds based on coded commands, logs in console, adds chat entry to chatlog table
//Commands are added under switch(text)
bot.on('speak', function (data) {
	//Log in console
	if (config.consolelog) {
		console.log('Chat [' + data.userid + ' ' + data.name +'] ' + data.text);
	}

	//Log in db (chatlog table)
	if (config.database.usedb) {
		client.query('INSERT INTO ' + config.database.dbname + '.' + config.database.tablenames.chat + ' '
			+ 'SET userid = ?, chat = ?, time = NOW()',
			[data.userid, data.text]);
	}

	//If it's a supported command, handle it	
    
    if (config.responses.respond) {
        handleCommand(data.name, data.userid, data.text.toLowerCase(), 'speak');
    }
    
    

});

//Runs when no song is playing.
bot.on('nosong', function (data) {
	//
});

//Runs at the end of a song
//Logs song in database, reports song stats in chat
bot.on('endsong', function (data) {
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
        for (i in djs) {
            if (djs[i].id == currentsong.djid) {
                djs[i].remaining--;
                if (djs[i].remaining <= 0) {
                    userstepped = false;
                    usertostep = currentsong.djid;
                }
            }
        }
        
        //If enforcement type is songs, decrease the song-wait count for all past djs
        if (config.enforcement.stepuprules.waittype == 'SONGS' && config.enforcement.stepuprules.waittostepup) {
            for (i in pastdjs) {
                pastdjs[i].wait--;
            }
            
            for (i in pastdjs) {
                if (pastdjs[i].wait < 1) {
                    pastdjs.splice(i, 1);
                }
            }
        //If enforcement type is minutes, remove dj from pastdjs list if they can step up
        } else if (config.enforcement.stepuprules.waittype == 'MINUTES' && config.enforcement.stepuprules.waittostepup) {
            for (i in pastdjs) {
                //Checks if the user has waited long enough
                //config.enforcement.stepuprules.length is converted from minutes to milliseconds
                if ((new Date().getTime() - pastdjs[i].wait.getTime()) > (config.enforcement.stepuprules.length * 60000)) {
                    pastdjs.splice(i, 1);
                }
            }
        }
    }
    

	//Report song stats in chat
	if (config.responses.reportsongstats) {
		bot.speak(currentsong.song + ' stats: awesomes: '
			+ currentsong.up + ' lames: ' + currentsong.down
			+ ' snags: ' + currentsong.snags);
	}
    
    
});

//Runs when a new song is played
//Populates currentsong data, tells bot to step down if it just played a song,
//logs new song in console, auto-awesomes song
bot.on('newsong', function (data) {
	//Populate new song data in currentsong
	populateSongData(data);

	//Check something
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
});

//Runs when a dj steps down
//Logs in console
bot.on('rem_dj', function (data) {
	//Log in console
	//console.log(data.user[0]);
	if (config.consolelog) {
		console.log('Stepped down: '+ data.user[0].name + ' [' + data.user[0].userid + ']');
	}

	//Adds user to 'step down' vars
	//Used by enforceRoom()
	if (usertostep == data.user[0].userid) {
		userstepped = true;
		usertostep = null;
        
        if (config.enforcement.enforceroom) {
            //When a user steps, add them to the past djs array
            if (config.enforcement.stepuprules.waittype == 'SONGS' && config.enforcement.stepuprules.waittostepup) {
                pastdjs.push({id: data.user[0].userid, wait: config.enforcement.stepuprules.length});
            } else if (config.enforcement.stepuprules.waittype == 'MINUTES' && config.enforcement.stepuprules.waittostepup) {
                pastdjs.push({id: data.user[0].userid, wait: new Date()});
                setTimeout(function() {
                    for (i in pastdjs) {
                        if ((new Date().getTime() - pastdjs[i].wait.getTime()) > 
                        (config.enforcement.stepuprules.length * 60000)) {
                            pastdjs.splice(i, 1);
                        }
                    }
                }, config.enforcement.stepuprules.length * 60000);
            
            //If a DJ is now eligible to step up, remove them from the list
            for (i in pastdjs) {
                if (config.enforcement.stepuprules.waittype == 'SONGS' && config.enforcement.stepuprules.waittostepup) {
                    if (pastdjs[i].wait < 1) {
                        pastdjs.splice(i, 1);
                    }
                } else if (config.enforcement.stepuprules.waittype == 'MINUTES' && config.enforcement.stepuprules.waittostepup) {
                    if ((new Date().getTime() - pastdjs[i].wait.getTime()) > 
                        (config.enforcement.stepuprules.length * 60000)) {
                        pastdjs.splice(i, 1);
                    }
                }
            }
            }
        }
	}
    
    //Set time this event occurred for enforcing one and down room policy
    if (legalstepdown) {
        enforcementtimeout = new Date();
    }
    legalstepdown = true;

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
});

//Runs when a dj steps up
//Logs in console
bot.on('add_dj', function(data) {
    
	//Log in console
	if (config.consolelog) {
		console.log('Stepped up: ' + data.user[0].name);
	}
    djs.push({id: data.user[0].userid, remaining: config.enforcement.songstoplay});
    
    //See if this user is in the past djs list
    if (config.enforcement.enforceroom) {
    
        
        var found = false;
        for (i in pastdjs) {
            if (pastdjs[i].id == data.user[0].userid) {
                found = true;
                }
        }
    
        //Get time elapsed between previous dj stepping down and this dj stepping up
        var waittime = new Date().getTime() - enforcementtimeout.getTime();
    
        if (found) {
        
            //if the user waited longer than the FFA timeout or it's a free-for-all,
            //remove from list. Else, remove dj and warn
            legalstepdown = ((waittime > (config.enforcement.ffarules.timeout * 1000) && config.enforcement.ffarules.timerffa)
                || (ffa && config.enforcement.ffarules.multiplespotffa));
            
            if (legalstepdown) {
                for (i in pastdjs) {
                    if(pastdjs[i].id == data.user[0].userid) {
                        pastdjs.splice(i, 1);
                    }
                }
            } 
            else if ((config.enforcement.stepuprules.waittype == 'MINUTES' && config.enforcement.stepuprules.waittostepup)
                && (new Date().getTime() 
                - pastdjs[i].wait.getTime()) > (config.enforcement.stepuprules.length * 60000)) {
                pastdjs.splice(i, 1);
            }
            else {
                //Remove DJ and warn
                bot.remDj(data.user[0].userid);
                for (i in pastdjs) {
                    if(pastdjs[i].id == data.user[0].userid) {
                        if (config.enforcement.stepuprules.waittype == 'SONGS' && config.enforcement.stepuprules.waittostepup) {
                        bot.speak(data.user[0].name + ', please wait ' + pastdjs[i].wait
                            + ' more songs or ' + (10 - Math.floor(waittime/1000))
                            + ' more seconds before DJing again.');
                        } else if (config.enforcement.stepuprules.waittype == 'MINUTES' && config.enforcement.stepuprules.waittostepup) {
                        var timeremaining = (config.enforcement.stepuprules.length * 60000)
                            - (new Date().getTime() - pastdjs[i].wait.getTime());
                        
                        
                        bot.speak(data.user[0].name + ', please wait '
                            + Math.floor(timeremaining / 60000) + ' minutes and '
                            + Math.floor((timeremaining % 60000) / 1000) + ' seconds before DJing'
                            + ' again, or wait ' + (10 - Math.floor(waittime/1000)) + ' seconds '
                            + 'before trying for this spot.');
                        }
                    }
                }
            }
        }
    }
        
    
});

bot.on('snagged', function(data) {
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
});

bot.on('rem_moderator', function(data) {
    //If the bot admin was demodded, remod them
	if(config.admins.mainadmin == data.userid) {
		setTimeout(function() {
			bot.addModerator(config.admins.mainadmin);
		}, 200);
	}
});

bot.on('booted_user', function(data) {
	//if the bot was booted, reboot
	if((config.botinfo.userid == data.userid) && config.maintenance.autorejoin) {
		setTimeout(function() {
			bot.roomRegister(config.roomid);
		}, 25000);
		setTimeout(function() {
			bot.speak('Please do not boot the room bot.');
		}, 27000);
	}
});

bot.on('pmmed', function(data) {
    try {
        handleCommand(usersList[data.senderid].name, data.senderid, data.text.toLowerCase(), 'pm');
    } catch (e) {
        bot.pm(data.senderid, 'xxMEOWxx only responds to people in our room! http://turntable.fm/indieclassic_alternative_1_done');
    }
});
 
/**
bot.on('update_user', function(data) {
    //Update user name in users table
    if (data.name != null) {
        client.query('INSERT INTO ' + config.database.dbname + '.' + config.database.tablenames.user
            + ' (userid, username, lastseen)'
                + 'VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE lastseen = NOW()',
                [data.userid, data.name]);
        }
});*/

// Functions

function initializeModules() {
    //Creates the bot listener
    try {
        Bot = require('ttapi');
    } catch(e) {
        console.log(e);
        console.log('It is likely that you do not have the ttapi node module installed.'
            + '\nUse the command \'npm install ttapi\' to install.');
        process.exit(0);
    }

    //Creates the config object
    try {
        config = JSON.parse(fs.readFileSync('config.json', 'ascii'));
    } catch(e) {
        console.log(e);
        console.log('Ensure that config.json is present in this directory.');
        process.exit(0);
    }

    //Loads bot singalongs
    if (config.responses.sing) {
        try {
            singalong = require('./singalong.js');
        } catch (e) {
            console.log(e);
            console.log('Ensure that singalong.js is present in this directory,'
                + ' or disable the botSing flag in config.js');
            console.log('Starting bot without singalong functionality.');
            config.responses.sing = false;
        }
    }

    //Creates mysql db object
    if (config.database.usedb) {
        try {
            mysql = require('mysql');
        } catch(e) {
            console.log(e);
            console.log('It is likely that you do not have the mysql node module installed.'
                + '\nUse the command \'npm install mysql\' to install.');
            console.log('Starting bot without database functionality.');
            config.database.usedb = false;
        }

        //Connects to mysql server
        try {
            client = mysql.createClient(config.database.login);
        } catch(e) {
            console.log(e);
            console.log('Make sure that a mysql server instance is running and that the '
                + 'username and password information in config.js are correct.');
            console.log('Starting bot without database functionality.');
            config.database.usedb = false;
        }
    }

    //Initializes request module
    try {
        request = require('request');
    } catch(e) {
        console.log(e);
        console.log('It is likely that you do not have the request node module installed.'
            + '\nUse the command \'npm install request\' to install.');
        process.exit(0);
    }
}

//Sets up the database
function setUpDatabase() {
//Creates DB and tables if needed, connects to db
    client.query('CREATE DATABASE ' + config.database.dbname,
        function(error) {
            if(error && error.number != mysql.ERROR_DB_CREATE_EXISTS) {
                throw (error);
            }
    });
    client.query('USE '+ config.database.dbname);

    //song table
    client.query('CREATE TABLE ' + config.database.tablenames.song
        + '(id INT(11) AUTO_INCREMENT PRIMARY KEY,'
        + ' artist VARCHAR(255),'
        + ' song VARCHAR(255),'
        + ' djid VARCHAR(255),'
        + ' up INT(3),' + ' down INT(3),'
        + ' listeners INT(3),'
        + ' started DATETIME,'
        + ' snags INT(3),'
        + ' bonus INT(3))',
			
        function (error) {
            //Handle an error if it's not a table already exists error
            if(error && error.number != 1050) {
                throw (error);
            }
    });

    //chat table
    client.query('CREATE TABLE ' + config.database.tablenames.chat
        + '(id INT(11) AUTO_INCREMENT PRIMARY KEY,'
        + ' userid VARCHAR(255),'
        + ' chat VARCHAR(255),'
        + ' time DATETIME)',
        function (error) {
            //Handle an error if it's not a table already exists error
            if(error && error.number != 1050) {
                throw (error);
            }
    });
        
    //user table
    client.query('CREATE TABLE ' + config.database.tablenames.user
        + '(userid VARCHAR(255), '
        + 'username VARCHAR(255), '
        + 'lastseen DATETIME, '
        + 'PRIMARY KEY (userid, username))',
        function (error) {
            //Handle an error if it's not a table already exists error
            if(error && error.number != 1050) {
                throw (error);
            }
    });
}

function populateSongData(data) {
    currentsong.artist = data.room.metadata.current_song.metadata.artist;
	currentsong.song = data.room.metadata.current_song.metadata.song;
	currentsong.djname = data.room.metadata.current_song.djname;
	currentsong.djid = data.room.metadata.current_song.djid;
	currentsong.up = data.room.metadata.upvotes;
	currentsong.down = data.room.metadata.downvotes;
	currentsong.listeners = data.room.metadata.listeners;
	currentsong.started = data.room.metadata.current_song.starttime;
	currentsong.snags = 0;
}

function output(data) {
    if (data.destination == 'speak') {
        bot.speak(data.text);
    } else if (data.destination == 'pm') {
        bot.pm(data.text, data.userid);
    }
}

//Checks if the user id is present in the admin list. Authentication
//for admin-only privileges.
function admincheck(userid) {
    return config.admins.mainadmin == userid || config.admins.admins.indexOf(userid) >= 0
}

//The bot will respond to a Reptar call with a variant of 'rawr!' based on
//the result from a RNG.
function reptarCall(source) {
	var rand = Math.random();
    var response = '';
	if (rand < 0.05) {
		response = ('That band is pretty awesome.');
	} else if (rand < 0.10) {
		response = ('Good morning!');
	} else if (rand < 0.17) {
		response = ('Rawr!');
	} else if (rand < 0.3) {
		response = ('rawr!');
	} else if (rand < 0.4) {
		response = ('RAWR!');
	} else if (rand < 0.5) {
		response = ('rawr.');
	} else if (rand < 0.6) {
		response = ('RAWR!!!');
	} else {
		response = ('.reptar');
	}
    return response;
}

//Adds the song data to the songdata table.
//This runs on the endsong event.
function addToDb(data) {
	client.query(
		'INSERT INTO ' + config.database.dbname + '.' + config.database.tablenames.song +' '
		+ 'SET artist = ?,song = ?, djid = ?, up = ?, down = ?,'
		+ 'listeners = ?, started = NOW(), snags = ?, bonus = ?',
		[currentsong.artist, 
		currentsong.song,  
		currentsong.djid, 
		currentsong.up, 
		currentsong.down, 
		currentsong.listeners,
		currentsong.snags,
		bonuspoints.length]);
}

//Reminds a user that has just played a song to step down, and pulls them
//off stage if they do not step down.
function enforceRoom() {
	setTimeout( function() {
		if(!userstepped) {
			bot.speak('@' + usersList[usertostep].name + ', please step down');
			setTimeout( function() {
				if(!userstepped) {
					bot.remDj(usertostep);
				}
			}, 15000);
		}
	}, 15000);
}

//Calculates the target number of bonus votes needed for bot to awesome
function getTarget() {
	if (currentsong.listeners < 11) {
		return 3;
	} else if (currentsong.listeners < 21) {
		return 4;
	}
	return 5 + Math.floor((currentsong.listeners - 20) / 20);
}

//Calculates the target number of awesomes needed for the bot to awesome
function getVoteTarget() {
	if (currentsong.listeners <= 3) {
		return 2;
	}
    //Trendline on the average number of awesomes in the 1+Done room
	return Math.ceil(Math.pow(1.1383*(currentsong.listeners - 3), 0.6176));
}

//Checks if the user can step up
//TODO: Change this to support waitlists (when I implement them)
function canUserStep(name, userid) {
    //Case 1: DJ is already on the decks
    for (i in djs) {
        if (djs[i].id == userid) {
            found = true;
            return 'You\'re already up!';
        }
    }
    
    //Case 2: fastest-finger
    if (config.enforcement.ffarules.multiplespotffa && (djs.length < 4)) {
        return 'There\'s more than one spot open, so anyone can step up!';
    }
    
    //Case 3: Longer than FFA timeout
    if (config.enforcement.ffarules.timerffa && (djs.length < 5)
        && ((new Date()).getTime() - enforcementtimeout > (config.enforcement.ffarules.length * 1000))) {
        return 'It\'s been ' + config.enforcement.ffarules.length + ' seconds, so anyone can step up!';
    }
    
    //Case 4: DJ in queue
    //The bot will tell the user how much longer they must wait
    for (i in pastdjs) {
        if (pastdjs[i].id == userid) {
            if (config.enforcement.stepuprules.waittype == 'SONGS' && config.enforcement.stepuprules.waittostepup) {
                if (pastdjs[i].wait == 1) {
                    return (name + ', please wait one more song.');
                } else {
                    return (name + ', please wait another ' + pastdjs[i].wait + ' songs.');
                }
            } else if (config.enforcement.stepuprules.waittype == 'MINUTES' && config.enforcement.stepuprules.waittostepup) {
                var timeremaining = (config.enforcement.stepuprules.length * 60000)
                    - (new Date().getTime() - pastdjs[i].wait.getTime());
                
                return (name + ', please wait ' + Math.floor(timeremaining / 60000) + ' minutes and '
                    + Math.floor((timeremaining % 60000)/1000) + ' seconds.');
            }
        }
    }
    
    //Case 5: Free to step up, but no spots
    if (djs.length == 5) {
        return (name + ', you can, but there aren\'t any spots...');
    }
    
    //Default: Free to step up
    return (name + ', go ahead!');
}

//Welcome message for TCP connection
bot.on('tcpConnect', function (socket) {
	socket.write('>> Welcome! Type a command or \'help\' to see a list of commands\n');
    sockets.push({socket: socket, online: false, votes: false});
});

bot.on('tcpEnd', function(socket) {
    for (i in sockets) {
        if (sockets[i].socket.destroyed) {
            sockets.splice(i, 1);
        }
    }
    console.log(sockets);
});

//TCP message handling
bot.on('tcpMessage', function (socket, msg) {
    var jsonmsg;
    try {
        jsonmsg = JSON.parse(msg);
    } catch (e) {
        return;
    }
    
    var response = {response: 'INVALID QUERY'};
    if (jsonmsg.command != null) {
        switch (jsonmsg.command) {
        
            //Get commands
            
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
    
    /**
    //If the message ends in a ^M character, remove it.
    	if (msg.substring(msg.length - 1).match(/\cM/)) {
        	msg = msg.substring(0, msg.length - 1);
    	}
	
	//Have the bot speak in chat
	if (msg.match(/^speak/)) {
		bot.speak(msg.substring(6));
		socket.write('>> Message sent\n');
	}
	
	//Boot the given userid
	//TODO: Change userid to user name
	if (msg.match(/^boot/)) {
		bot.boot(msg.substring(5));
        socket.write('>> User booted\n');
	}
	
	//Handle commands
	switch (msg) {
		case 'help':
			socket.write('>> xxMEOWxx responds to the following commands in the console: '
				+ 'online, .a,\n'
                + '>> .l, step up, step down, speak [text], exit, shutdown\n');
			break;
		case 'online':
			socket.write('>> ' + currentsong.listeners + '\n');
			break;
		case 'users':
			var output = '>> ';
			for (var i in usersList) {
				output += (usersList[i].name) + ', ';
			}
			socket.write(output.substring(0,output.length - 2) + '\n');
			break;
		case 'nowplaying':
			socket.write('>> ' + currentsong.artist + ' - ' + currentsong.song
				+ '\n>> DJ ' + currentsong.djname + ' +' + currentsong.up 
				+ ' -' + currentsong.down + '\n');
			break;
		case '.a':
			bot.vote('up');
			socket.write('>> Awesomed\n');
			break;
		case '.l':
			bot.vote('down');
			socket.write('>> Lamed\n');
			break;
		case 'step up':
			bot.addDj();
			socket.write('>> Stepped up\n');
			break;
		case 'step down':
			bot.remDj(config.botinfo.userid);
			socket.write('>> Stepped down\n');
			break;
		case 'pulldj':
			bot.remDj(usertostep);
			socket.write('>> DJ removed\n');
			break;
		case 'exit':
			socket.write('>> Goodbye!\n');
			socket.end();
			break;
		case 'shutdown':
			socket.write('>> Shutting down...\n');
			bot.speak('Shutting down...');
			socket.end();
			bot.roomDeregister();
			process.exit(0);
			break;
		}*/
});

//Handles chat commands
function handleCommand (name, userid, text, source) {
    switch(text) {
    //--------------------------------------
    // Command lists
    //--------------------------------------
    
    case '.sparklecommands':
        
        var response = 'commands: .owner, .source, mystats, bonus, points, rules, ping, '
            + 'platforms, reptar, mostplayed, mostawesomed, mostlamed, mymostplayed, '
            + 'mymostawesomed, mymostlamed, totalawesomes, mostsnagged, '
            + 'pastnames [username], .similar, .similarartists, '
            + '.weather [zip], .find [zip] [thing]';
            
        output({text: response, destination: source, userid: userid});
        break;

    case 'help':
    case 'commands':
        var response = 'commands: .ad, bonus, points, ping, reptar, merica, .random, platforms, '
            + '.twitter, .rules, .users, .owner, .source, mystats, mostplayed, '
            + 'mostawesomed, mymostplayed, mymostawesomed, '
            + 'pastnames [username], .similar, .similarartists';
        output({text: response, destination: source, userid: userid});
        break;
    
    //--------------------------------------
    // Bonus points
    //--------------------------------------
    
    case 'tromboner':
    case 'meow':
    case 'bonus':
    case '/bonus':
    case 'good dong':
    case 'awesome':
    case 'good song':
    case 'great song':
    case 'nice pick':
    case 'good pick':
    case 'great pick':
    case 'dance':
    case '/dance':
        //Adds the user to the list of bonuspoints if the bot's bonus mode is set to CHAT
        //and if they are not already in the list.
        if ((config.bonusvote == 'CHAT') && (bonuspoints.indexOf(name) == -1)) {
            bonuspoints.push(name);
            var target = getTarget();
            //If the target has been met, the bot will awesome
            if((bonuspoints.length >= target) && !bonusvote && (currentsong.djid != config.botinfo.userid)) {
                bot.speak('Bonus!');
                bot.vote('up');
                bonusvote = true;
            }
        }
        break;
        
    //Rolls the dice.
    //If vote bonus is set to DICE, the bot will awesome if a 4 or higher is rolled
    case '/roll':
        var roll = Math.ceil(Math.random() * 6);
        if (config.bonusvote == 'DICE' && !bonusvote && (currentsong.djid == userid)) {
            if (roll > 3) {
                bot.speak(name + ', you rolled a ' + roll + ', BONUS!');
                bot.vote('up');
            } else {
                bot.speak (name + ', you rolled a ' + roll +', bummer.');
            }
            bonusvote = true;
        } else {
            var response = (name + ', you rolled a ' + roll + '.');
            output({text: response, destination: source, userid: userid});
        }
        break;
    
    //Checks the number of points cast for a song, as well as the number needed
    case 'points':
        if (config.bonusvote == 'VOTE') {
            var response = (bonusvotepoints + ' awesomes are needed for a bonus (currently '
                + currentsong.up + ').');
            output({text: response, destination: source, userid: userid});
        } else if (config.bonusvote == 'CHAT') {
            var target = getTarget();
            var response = ('Bonus points: ' + bonuspoints.length + '. Needed: ' + target + '.');
            output({text: response, destination: source, userid: userid});
        } else if (config.bonusvote == 'DICE') {
            var response = ('The DJ must roll a 4 or higher using /roll to get a bonus.');
            output({text: response, destination: source, userid: userid});
        }
        break;
    
    //--------------------------------------
    // User commands
    //--------------------------------------
    
    case 'stagedive':
    case '/stagedive':
    case '/dive':
    if (userid == usertostep) {
        bot.remDj(usertostep);
    }
    break;
    
    //Outputs bot owner
    case '.owner':
        var response = (config.responses.ownerresponse);
        output({text: response, destination: source, userid: userid});
        break;
    
    //Outputs github url for xxMEOWxx
		case '.source':
        var response = ('My source code is available at: http://git.io/meow');
        output({text: response, destination: source, userid: userid});
        break;

    //Ping bot
    //Useful for users that use the iPhone app
    case 'ping':
        var rand = Math.random();
        var response = '';
        if (rand < 0.5) {
            response = ('You\'re still here, ' + name + '!');
        } else {
            response = ('Still here, ' + name + '!');
        }
        output({text: response, destination: source, userid: userid});
        break;
        
    //Reptar call!
    //Randomly picks a response in reptarCall()
    case 'reptar':
        var response = reptarCall();
        output({text: response, destination: source, userid: userid});
        break;
    
    case 'version':
        var response = (version);
        output({text: response, destination: source, userid: userid});
        break;
        
    //Bot freakout
    case 'reptar sucks':
        var response = ('OH NO YOU DIDN\'T');
        output({text: response, destination: source, userid: userid});
        setTimeout(function() {
            output({text: reptarCall(), destination: source, userid: userid});
        }, 1000);
        break;
        
    //Rules rehash since xxRAWRxx only responds to .rules
    //TODO: Generate rules based on bot options
		case 'rules':
			var response = ('You can view the rules here: ' + config.responses.rules.link);
            output({text: response, destination: source, userid: userid});
			setTimeout(function() {
				var response = (config.responses.rules.description);
                output({text: response, destination: source, userid: userid});
			}, 600);
			break;
            
    //hugs support.
    //Change xxMEOWxx, meow etc to bot name
    case 'hugs xxmeowxx':
    case 'hugs meow':
        var rand = Math.random();
        var timetowait = 1600;
        if (rand < 0.4) {
            setTimeout(function() {
                output({text: 'Awww!', destination: source, userid: userid});
            }, 1500);
            timetowait += 600;
        }
        setTimeout(function() {
            var response = ('hugs ' + name);
            output({text: response, destination: source, userid: userid});
        }, timetowait);
        break;
        
    //Returns the number of each type of laptop present in the room
    case 'platforms':
        var platforms = {
            pc: 0,
            mac: 0,
            linux: 0,
            chrome: 0,
            iphone: 0};
        for (i in usersList) {
            platforms[usersList[i].laptop]++;
        }
        var response = ('Platforms in this room: '
            + 'PC: ' + platforms.pc
            + '.  Mac: ' + platforms.mac
            + '.  Linux: ' + platforms.linux
            + '.  Chrome: ' + platforms.chrome
            + '.  iPhone: ' + platforms.iphone + '.');
        output({text: response, destination: source, userid: userid});
        break;
        
    //Returns information on the current song (for users without TT+)
    case 'songinfo':
        var response = (currentsong.song + ' (mid-song stats): Awesomes: ' + currentsong.up + '  Lames: '
            + currentsong.down + '  Snags: ' + currentsong.snags);
        output({text: response, destination: source, userid: userid});
        break;
    
    //Lists the DJs that must wait before stepping up (as per room rules)
    case 'waitdjs':
        if (config.enforcement.enforceroom) {
            var pastdjnames = 'These DJs must wait before stepping up again: ';
            for (i in pastdjs) {
                if (usersList[pastdjs[i].id] != null) {
                    //TODO: Change to songs/minutes
                    pastdjnames += usersList[pastdjs[i].id].name
                        + ' (' + pastdjs[i].wait + ' songs), ';
                }
            }
            output({text: pastdjnames.substring(0, pastdjnames.length - 2), destination: source, userid: userid});
        }
        break;
    
    //ICA inside joke
    case 'antiquing':
    case 'antiquing?':
        var response = ('\"Antiquing\" is the act of shopping, identifying, negotiating, or '
            + 'bargaining for antiques. Items can be bought for personal use, gifts, and '
            + 'in the case of brokers and dealers, profit.');
        output({text: response, destination: source, userid: userid});
        break;
        
    //Responds to reptar-related call
    case 'can you feel it!?':
        setTimeout(function() {
            var response = ('YES I CAN FEEL IT!');
            output({text: response, destination: source, userid: userid});
        }, 1200);
        break;
    
    //ICA inside joke
    case 'i enjoy that band.':
        setTimeout(function() {
            var response = ('Me too!');
            output({text: response, destination: source, userid: userid});
        }, 1200);
        break;
     
     case '.hodor':
     case 'hodor':
     case 'hodor?':
        var response = ('Hodor!');
        output({text: response, destination: source, userid: userid});
        break;
        
    //--------------------------------------
    // Queue/room enforcement commands
    //--------------------------------------   
    
    //Tells a DJ how many songs they have remaining
    case 'songsremaining':
    case '.remaining':
        if (config.enforcement.enforceroom) {
            var found = false;
            for (i in djs) {
                if (djs[i].id == userid) {
                    var response = '';
                    if (djs[i].remaining == 1) {
                        response = (name + ', you have one song remaining.');
                    } else {
                        response = (name + ', you have ' + djs[i].remaining + ' songs remaining.');
                    }
                    output({text: response, destination: source, userid: userid});
                    found = true;
                }
            }
        }
        if (!found) {
            var response = (name + ', you\'re not DJing...');
            output({text: response, destination: source, userid: userid});
        }
        break;
        
    //Displays a list of how many songs each DJ has left
    case 'djinfo':
        if (config.enforcement.enforceroom) {
            var response = '';
            for (i in djs) {
                response += usersList[djs[i].id].name + ' (' + djs[i].remaining + ' songs left), ';
            }
            output({text: response.substring(0, response.length - 2), destination: source, userid: userid});
        }
        break;
        
    //Tells a person who the next DJ to step down is
    case 'any spots opening soon?': 
    case 'anyone stepping down soon?':
        if (config.enforcement.enforceroom) {
            var response = ('The next DJ to step down is ' + usersList[djs[0].id].name + ', who has '
                + djs[0].remaining + ' songs remaining.');
            output({text: response, destination: source, userid: userid});
        }
        break;
        
    case 'uptime':
        var cur = new Date().getTime() - uptime.getTime();
        var days = Math.floor(cur / 86400000);
        cur = cur % 86400000;
        var hours = Math.floor(cur / 3600000);
        cur = cur % 3600000;
        var minutes = Math.floor(cur / 60000);
        cur = cur % 60000;
        var response = 'Uptime: ';
        if (days > 0) {
            response += days + ' days, ';
        }
        var response = (response + hours + ' hours, ' + minutes + ' minutes, '
                + Math.floor(cur/1000) + ' seconds.');
        output({text: response, destination: source, userid: userid});
        break;
    
        
    //--------------------------------------
    // Last.fm Queries
    //--------------------------------------
        
    //Returns three similar songs to the one playing.
    //Uses last.fm's API
    case '.similar':
        if (config.lastfm.useapi) {
            request('http://ws.audioscrobbler.com/2.0/?method=track.getSimilar'
                + '&artist=' + encodeURIComponent(currentsong.artist)
                + '&track='  + encodeURIComponent(currentsong.song)
                + '&api_key=' + config.lastfm.lastfmkey + '&format=json&limit=5',
                function cbfunc(error, response, body) {
                    //If call returned correctly, continue
                    if(!error && response.statusCode == 200) {
                        var formatted = eval('(' + body + ')');
                        var botstring = 'Similar songs to ' + currentsong.song + ': ';
                        
                        //TODO: Make sure this is the best way to do this.
                        try {
                            //Ignore the first two songs since last.fm returns
                            //two songs by the same artist when making this call
                            botstring += formatted.similartracks.track[2].name + ' by '
                                + formatted.similartracks.track[2].artist.name + ', ';
                            botstring += formatted.similartracks.track[3].name + ' by '
                                + formatted.similartracks.track[3].artist.name + ', ';
                            botstring += formatted.similartracks.track[4].name + ' by '
                                + formatted.similartracks.track[4].artist.name + ', ';
                        } catch (e) {
                            //
                        }
                        var response = (botstring.substring(0, botstring.length - 2));
                        output({text: response, destination: source, userid: userid});
                    }
            });
        }
        break;
	
    //Returns three similar artists to the one playing.
    //Uses last.fm's API
    case '.similarartists':
        if (config.lastfm.useapi) {
            request('http://ws.audioscrobbler.com/2.0/?method=artist.getSimilar'
                + '&artist=' + encodeURIComponent(currentsong.artist)
                + '&api_key=' + config.lastfm.lastfmkey + '&format=json&limit=4',
                function cbfunc(error, response, body) {
                    //If call returned correctly, continue
                    if(!error && response.statusCode == 200) {
                        var formatted = eval('(' + body + ')');
                        var botstring = 'Similar artists to ' + currentsong.artist + ': ';
                        try {
                            for (i in formatted.similarartists.artist) {
                                botstring += formatted.similarartists.artist[i].name + ', ';
                            }
                        } catch (e) {
                            //
                        }
                        var response = (botstring.substring(0, botstring.length - 2));
                        output({text: response, destination: source, userid: userid});
                    }
            });
        }
        break;
    
    //--------------------------------------
    // User database commands
    //--------------------------------------
    
    //Returns the room's play count, total awesomes/lames, and average awesomes/lames
    //in the room
    case 'stats':
        if (config.database.usedb) {
            client.query('SELECT @uniquesongs := count(*) FROM (select * from '
                + config.database.dbname + '.' + config.database.tablenames.song
                + ' group by concat(song, \' by \', artist)) as songtbl');
            client.query('SELECT @numdjs := count(*) FROM (select * from '
                + config.database.dbname + '.' + config.database.tablenames.song + ' group by djid) as djtable');
            client.query('SELECT @uniquesongs as uniquesongs, @numdjs as numdjs, '
                + 'count(*) as total, sum(up) as up, avg(up) as avgup, '
                + 'sum(down) as down, avg(down) as avgdown FROM ' + config.database.dbname
                + '.' + config.database.tablenames.song,
                function select(error, results, fields) {
                    var response = ('In this room, '
                        + results[0]['total'] + ' songs ('
                        + results[0]['uniquesongs'] + ' unique) have been played by '
                        + results[0]['numdjs'] + ' DJs with a total of '
                        + results[0]['up'] + ' awesomes and ' + results[0]['down']
                        + ' lames (avg +' + new Number(results[0]['avgup']).toFixed(1) 
                        + '/-' + new Number(results[0]['avgdown']).toFixed(1)
                        + ').');
                    output({text: response, destination: source, userid: userid});
            });
        }
        break;
        
    //Returns the three song plays with the most awesomes in the songlist table
    case 'bestplays':
        if (config.database.usedb) {
            client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, UP FROM '
                + config.database.dbname + '.' + config.database.tablenames.song + ' ORDER BY UP DESC LIMIT 3',
                function select(error, results, fields) {
                    var response = 'The song plays I\'ve heard with the most awesomes: ';
                    for (i in results) {
                        response += results[i]['TRACK'] + ': '
                            + results[i]['UP'] + ' awesomes.  ';
                    }
                    output({text: response, destination: source, userid: userid});
            });
        }
        break;
    
    //Returns the three DJs with the most points in the last 24 hours
    case 'past24hours':
        if (config.database.usedb) {
            client.query('SELECT username, upvotes FROM (SELECT djid, sum(up) as upvotes '
                + 'FROM ' + config.database.dbname + '.' + config.database.tablenames.song
                + ' WHERE started > DATE_SUB(NOW(), INTERVAL '
                + '1 DAY) GROUP BY djid) a INNER JOIN (SELECT * FROM (SELECT * FROM '
                 + config.database.dbname + '.' + config.database.tablenames.user
                + ' ORDER BY lastseen DESC) as test GROUP BY userid) b ON a.djid = b.userid'
                + ' ORDER BY upvotes DESC LIMIT 3',
                function select(error, results, fields) {
                    var response = 'DJs with the most points in the last 24 hours: ';
                    for (i in results) {
                        response += results[i]['username'] + ': '
                            + results[i]['upvotes'] + ' awesomes.  ';
                    }
                    output({text: response, destination: source, userid: userid});
            });
        }
        break;
        
    case 'mypast24hours':
        if (config.database.usedb) {
            client.query('SELECT count(*) AS songs, sum(up) AS upvotes, sum(down) AS downvotes FROM '
                + config.database.dbname + '.'
                + config.database.tablenames.song + ' WHERE started > DATE_SUB(NOW(), '
                + 'INTERVAL 1 DAY) AND djid LIKE \'' + userid + '\'',
                function select(error, results, fields) {
                    var response = name + ', you have played ' + results[0]['songs']
                        + ' songs in the past 24 hours, with ' + results[0]['upvotes']
                        + ' upvotes and ' + results[0]['downvotes'] + ' downvotes.';
                    output({text: response, destination: source, userid: userid});
            });
        }
        break;
    
    //Returns the three DJs with the most points logged in the songlist table
    case 'bestdjs':
        if (config.database.usedb) {
            client.query('SELECT username, upvotes FROM (SELECT djid, sum(up) AS upvotes '
                + 'FROM ' + config.database.dbname + '.' + config.database.tablenames.song
                + ' GROUP BY djid ORDER BY sum(up) DESC LIMIT 3) a INNER JOIN (SELECT * FROM (SELECT * FROM '
                 + config.database.dbname + '.' + config.database.tablenames.user
                + ' ORDER BY lastseen DESC) as test GROUP BY userid)'
                + ' b ON a.djid = b.userid ORDER BY upvotes DESC LIMIT 3',
                function select(error, results, fields) {
                    var response = 'The DJs with the most points accrued in this room: ';
                    for (i in results) {
                        response += results[i]['username'] + ': '
                            + results[i]['upvotes'] + ' points.  ';
                    }
                    output({text: response, destination: source, userid: userid});
            });
        }
        break;
        
    //Returns the three DJs with the most points logged in the songlist table
    case 'worstdjs':
        if (config.database.usedb) {
            client.query('SELECT username, downvotes FROM (SELECT djid, sum(down) AS downvotes '
                + 'FROM ' + config.database.dbname + '.' + config.database.tablenames.song
                + ' GROUP BY djid ORDER BY sum(down) DESC LIMIT 3) a INNER JOIN (SELECT * FROM (SELECT * FROM '
                 + config.database.dbname + '.' + config.database.tablenames.user
                + ' ORDER BY lastseen DESC) as test GROUP BY userid)'
                + ' b ON a.djid = b.userid ORDER BY downvotes DESC LIMIT 3',
                function select(error, results, fields) {
                    var response = 'The DJs with the most lames accrued in this room: ';
                    for (i in results) {
                        response += results[i]['username'] + ': '
                            + results[i]['downvotes'] + ' lames.  ';
                    }
                    output({text: response, destination: source, userid: userid});
            });
        }
        break;
        
    //Returns the three most-played songs in the songlist table
    case 'mostplayed':
        if (config.database.usedb) {
            client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, COUNT(*) AS COUNT FROM '
                + config.database.dbname + '.' + config.database.tablenames.song
                + ' GROUP BY CONCAT(song,\' by \',artist) ORDER BY COUNT(*) '
                + 'DESC LIMIT 3',
                function select(error, results, fields) {
                    var response = 'The songs I\'ve heard the most: ';
                    for (i in results) {
                        response += results[i]['TRACK'] + ': '
                            + results[i]['COUNT'] + ' plays.  ';
                    }
                    output({text: response, destination: source, userid: userid});
            });
        }
        break;
        
    //Returns the three most-snagged songs in the songlist table
    case 'mostsnagged':
        if (config.database.usedb) {
            client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, sum(snags) AS SNAGS FROM '
                + config.database.dbname + '.' + config.database.tablenames.song
                + ' GROUP BY CONCAT(song, \' by \', artist) ORDER BY SNAGS '
                + 'DESC LIMIT 3', function select(error, results, fields) {
                    var response = 'The songs I\'ve seen snagged the most: ';
                    for (i in results) {
                        response += results[i]['TRACK'] + ': '
                            + results[i]['SNAGS'] + ' snags.  ';
                    }
                    output({text: response, destination: source, userid: userid});
            });
        }
        break;
    
    //Returns the three most-awesomed songs in the songlist table
    case 'mostawesomed':
        if (config.database.usedb) {
            client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, SUM(up) AS SUM FROM '
                + config.database.dbname + '.' + config.database.tablenames.song
                + ' GROUP BY CONCAT(song,\' by \',artist) ORDER BY SUM '
                + 'DESC LIMIT 3',
                function select(error, results, fields) {
                    var response = 'The most awesomed songs I\'ve heard: ';
                    for (i in results) {
                        response += results[i]['TRACK'] + ': '
                            + results[i]['SUM'] + ' awesomes.  ';
                    }
                    output({text: response, destination: source, userid: userid});
            });
        }
        break;
    
    //Returns the three most-lamed songs in the songlist table
    case 'mostlamed':
        if (config.database.usedb) {
            client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, SUM(down) AS SUM FROM '
                + config.database.dbname + '.' + config.database.tablenames.song
                + ' GROUP BY CONCAT(song,\' by \',artist) ORDER BY SUM '
                + 'DESC LIMIT 3',
                function select(error, results, fields) {
                    var response = 'The most lamed songs I\'ve heard: ';
                    for (i in results) {
                        response += results[i]['TRACK'] + ': '
                            + results[i]['SUM'] + ' lames.  ';
                    }
                    output({text: response, destination: source, userid: userid});
            });
        }
        break;
			
    //Returns the user's play count, total awesomes/lames, and average awesomes/lames
    //in the room
    case 'mystats':
        if (config.database.usedb) {
            //These two statements gets the user's rank (by awesomes) and sets it to @rank
            client.query('SET @rownum := 0');
            client.query('SELECT @rank := rank FROM (SELECT @rownum := @rownum + 1 AS '
                + 'rank, djid, POINTS FROM (SELECT djid, sum(up) as POINTS from '
                + config.database.dbname + '.' + config.database.tablenames.song
                + ' group by djid order by sum(up) desc) as test) as rank where '
                + 'djid like \'' + userid + '\'');
            //This statement grabs the rank from the previous query, and gets the total songs
            //played, total awesomes, lames, and averages
            client.query('SELECT @rank as rank, count(*) as total, sum(up) as up, avg(up) as avgup, '
                + 'sum(down) as down, avg(down) as avgdown '
                + 'FROM '+ config.database.dbname + '.' + config.database.tablenames.song + ' WHERE `djid` LIKE \''
                + userid + '\'',
                function select(error, results, fields) {
                    var response = (name + ', you have played ' + results[0]['total'] 
                        + ' songs in this room with a total of '
                        + results[0]['up'] + ' awesomes and ' + results[0]['down']
                        + ' lames (avg +' + new Number(results[0]['avgup']).toFixed(1) 
                        + '/-' + new Number(results[0]['avgdown']).toFixed(1)
                        + ') (Rank: ' + results[0]['rank'] + ')');
                    output({text: response, destination: source, userid: userid});
            });
        }
        break;
			
    //Returns the user's three most played songs
    case 'mymostplayed':
        if (config.database.usedb) {
            client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, COUNT(*) AS COUNT FROM '
                + config.database.dbname + '.' + config.database.tablenames.song + ' WHERE (djid = \''+ userid +'\')'
                + ' GROUP BY CONCAT(song,\' by \',artist) ORDER BY COUNT(*) DESC LIMIT 3',
                function select(error, results, fields) {
                    var response = 'The songs I\'ve heard the most from you: ';
                    for (i in results) {
                        response += results[i]['TRACK'] + ': '
                            + results[i]['COUNT'] + ' plays.  ';
                    }
                    output({text: response, destination: source, userid: userid});
            });
        }
        break;

    //Returns the user's three most-awesomed songs (aggregate)
    case 'mymostawesomed':
        if (config.database.usedb) {
            client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, SUM(up) AS SUM FROM '
                + config.database.dbname + '.' + config.database.tablenames.song + ' WHERE (djid = \''+ userid +'\')'
                + ' GROUP BY CONCAT(song,\' by \',artist) ORDER BY SUM DESC LIMIT 3',
                function select(error, results, fields) {
                    var response = 'The most appreciated songs I\'ve heard from you: ';
                    for (i in results) {
                        response += results[i]['TRACK'] + ': '
                            + results[i]['SUM'] + ' awesomes.  ';
                    }
                    output({text: response, destination: source, userid: userid});
            });
        }
        break;

    //Returns the user's three most-lamed songs (aggregate)
    case 'mymostlamed':
        if (config.database.usedb) {
            client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, SUM(down) AS SUM FROM '
                + config.database.dbname + '.' + config.database.tablenames.song + ' WHERE (djid = \''+ userid +'\')'
                + ' GROUP BY CONCAT(song,\' by \',artist) ORDER BY SUM DESC LIMIT 3',
                function select(error, results, fields) {
                    var response = 'The most hated songs I\'ve heard from you: ';
                    for (i in results) {
                        response += results[i]['TRACK'] + ': '
                            + results[i]['SUM'] + ' lames.  ';
                    }
                    output({text: response, destination: source, userid: userid});
            });
        }
        break;
    
    //For debugging/monitoring of db
    //Returns the number of songs logged.
    case 'dbsize':
        if (config.database.usedb) {
            //var response = 'Songs logged';
            client.query('SELECT COUNT(STARTED) AS COUNT FROM ' + config.database.dbname + '.'
            + config.database.tablenames.song,
                function selectCb(error, results, fields) {
                    var response = ('Songs logged: ' + results[0]['COUNT'] + ' songs.');
                    output({text: response, destination: source, userid: userid});
            });
        }
        break;
        
    case 'catfact':
    case '.catfact':
    case 'catfacts':
    case '.catfacts':
    case 'cat fact':
    case 'cat facts':
        if (config.database.usedb) {
            client.query('SELECT * FROM CATFACTS ORDER BY RAND() LIMIT 1',
                function selectCb(error, results, fields) {
                    if (results[0] != null) {
                        var response = (results[0]['fact']);
                        output({text: response, destination: source, userid: userid});
                    }
            });
        }
        break;
        
    //--------------------------------------
    // Admin-only commands
    //--------------------------------------
    
    //Tells bot to awesome the current song
    case '\.a':
        if (admincheck(userid)) {
            bot.vote('up');
        }
        break;
        
    //Tells bot to lame the current song
    case '\.l':
        if (admincheck(userid)) {
            bot.vote('down');
        }
        break;

    //Pulls a DJ after their song.
    case 'pulldj':
        if (admincheck(userid)) {
            if (!userstepped) {
                bot.remDj(usertostep);
            }
        }
        break;

    //Pulls the current dj.
    case 'pullcurrent':
        if (admincheck(userid)) {
            if(currentsong.djid != null) {
                bot.remDj(currentsong.djid);
            }
        }
        break;
        
    //Step up to DJ
    case 'meow, step up':
        if (admincheck(userid)) {
            bot.addDj();
        }
        break;

    //Step down if DJing
    case 'meow, step down':
        if (admincheck(userid)) {
            bot.remDj(config.botinfo.userid);
        }
        break;

    //Bot freakout
    case 'oh my god meow':
        if (admincheck(userid)) {
            output({text: reptarCall(), destination: source, userid: userid});
            setTimeout(function() {
                output({text: reptarCall(), destination: source, userid: userid});
            }, 1400);
            setTimeout(function() {
                output({text: reptarCall(), destination: source, userid: userid});
            }, 2800);
            setTimeout(function() {
                output({text: reptarCall(), destination: source, userid: userid});
            }, 4200);
            setTimeout(function() {
                output({text: reptarCall(), destination: source, userid: userid});
            }, 5600);
        }
        break;

    //Shuts down bot (only the main admin can run this)
    //Disconnects from room, exits process.
    case 'meow, shut down':
        if (userid == config.admins.mainadmin) {
            bot.speak('Shutting down...');
            bot.roomDeregister();
            process.exit(0);
        }
        break;
    
    //Restarts bot (if keepalive script is used)
    case 'meow, restart':
        if (userid == config.admins.mainadmin) {
            bot.speak('Back in 10 seconds! Rebooting...');
            bot.roomDeregister();
            process.exit(1);
        }
        break;
    }
    
    //--------------------------------------
    // Matching commands (regex)
    //--------------------------------------
    
    //Checks if a user can step up as per room rules or if they must wait
    if (text.toLowerCase().match(/^can i step up/) && config.enforcement.enforceroom) {
        var response = canUserStep(name, userid);
        output({text: response, destination: source, userid: userid});
    }
    
    //Sends a PM to the user
    if (text.toLowerCase().match(/^meow, pm me/)) {
        if (source == 'speak') {
            bot.pm('Hey there! Type "commands" for a list of commands.', userid);
        } else if (source == 'pm') {
            bot.pm('But... you PM\'d me that. Do you think I\'m stupid? >:T', userid);
        }
    }

	//Returns weather for a user-supplied city using YQL.
	//Returns bot's location if no location supplied.
	if(text.match(/^.weather/)) {
		var userlocation = text.substring(9);
		if (userlocation == '') {
			userlocation = 20151;
		}
		request('http://query.yahooapis.com/v1/public/yql?q=use%20\'http%3A%2F%2Fgithub'
		        + '.com%2Fyql%2Fyql-tables%2Fraw%2Fmaster%2Fweather%2Fweather.bylocatio'
		        + 'n.xml\'%20as%20we%3B%0Aselect%20*%20from%20we%20where%20location%3D'
		        + '%22' + encodeURIComponent(userlocation) + '%22%20and%20unit%3D\'f\''
		        + '&format=json&diagnostics=false',
        	function cbfunc(error, response, body) {
        	        if (!error && response.statusCode == 200) {
                            var formatted = JSON.parse(body);
        	        	try {
						var loc = formatted.query.results.weather.rss.channel.location.city + ', '
        	            if (formatted.query.results.weather.rss.channel.location.region != '') {
        	            	loc += formatted.query.results.weather.rss.channel.location.region;
        	            } else {
        	            	loc += formatted.query.results.weather.rss.channel.location.country;
        	            }
        	        	var temp = formatted.query.results.weather.rss.channel.item.condition.temp;
        	        	var cond = formatted.query.results.weather.rss.channel.item.condition.text;
        	        	var response = ('The weather in ' + loc + ' is ' + temp + 'ºF and ' + cond + '.');
                        if (source == 'speak') {
                            bot.speak(response);
                        } else if (source == 'pm') {
                            bot.pm(response, userid);
                        }
                	} catch(e) {
				var response = ('Sorry, I can\'t find that location.');
                output({text: response, destination: source, userid: userid});
			}
            }
        });
	}
	
    //Returns the nearest location for a specified business in a zip code.
    //Uses YQL
	if(text.match(/^.find/)) {
		var location = text.split(' ', 2);
        if (location[1] != null) {
		var thingToFind = text.substring(7 + location[1].length);
		request('http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20local.search'
			+'%20where%20zip%3D\'' + encodeURIComponent(location[1]) + '\'%20and%20query%3D\''
			+ encodeURIComponent(thingToFind) + '\'%20limit%201&format=json',
			function cbfunc(error, response, body) {
				if (!error && response.statusCode == 200) {
					var formatted = eval('(' + body + ')');
					try {
						var botresponse = 'Nearest ' + thingToFind + ' location to ' + location[1] + ': ';
							botresponse += formatted.query.results.Result.Title + ' ('
								+ formatted.query.results.Result.Rating.AverageRating + ' ☆) '
								+ formatted.query.results.Result.Address + ', ' 
								+ formatted.query.results.Result.City + ' ('
								+ formatted.query.results.Result.Distance + ' miles).  ';
						
						output({text: botresponse, destination: source, userid: userid});
					} catch (e) {
						var response = ('Sorry, no locations found.');
                        output({text: response, destination: source, userid: userid});
					}
				}
		});
        }
	}

	//Returns a list of names a user has gone by
	//Usage: 'pastnames [username]'
	if (text.match(/^pastnames/)) {
		if (config.database.usedb) {
			client.query('SELECT username FROM ' + config.database.dbname + '.' + config.database.tablenames.user
            + ' WHERE (userid like (SELECT '
                + 'userid FROM ' + config.database.dbname + '.' + config.database.tablenames.user
                + ' WHERE username LIKE ? limit 1))',
                [text.substring(10)],
				function select(error, results, fields) {
						var response = 'Names I\'ve seen that user go by: ';
						for (i in results) {
							response += results[i]['username'] + ', ';
						}
                        output({text: response.substring(0, response.length - 2), destination: source, userid: userid});
			});
		}
	}		
}

