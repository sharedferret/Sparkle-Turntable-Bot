/**
 *  sparkle.js
 *  Author: sharedferret
 *  Version: [dev] 2012.01.12
 *  
 *  A Turntable.fm bot for the Indie/Classic Alternative 1 + Done room.
 *  Based on bot implementations by alaingilbert, anamorphism, and heatvision
 *  Uses node.js with node modules ttapi, mysql, request
 * 
 *  Run: 'node sparkle.js'
 *  
 *  Make sure parameters in config.js are set before running.
 *  Make sure a mysql server instance is running before starting the bot (if useDatabase
 *  is enabled in the config file)
 *
*/
var Bot;
var config;
var mysql;
var client;
var request;

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
	config = require('./config.js');
} catch(e) {
	console.log(e);
	console.log('Ensure that config.js is present in this directory.');
	process.exit(0);
}

//Creates mysql db object
if (config.useDatabase) {
	try {
		mysql = require('mysql');
	} catch(e) {
		console.log(e);
		console.log('It is likely that you do not have the mysql node module installed.'
			+ '\nUse the command \'npm install mysql\' to install.');
		process.exit(0);
	}

	//Connects to mysql server
	try {
		client = mysql.createClient(config.DBLOGIN);
	} catch(e) {
		console.log(e);
		console.log('Make sure that a mysql server instance is running and that the '
			+ 'username and password information in config.js are correct.');
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

//Creates the bot and initializes global vars
var bot = new Bot(config.AUTH, config.USERID);
if (config.useTCP) {
	bot.tcpListen(config.tcpPort, config.tcpHost);
}

//Room information
var usersList = { };
var djs = { };
var usertostep;
var userstepped = false;

//Used for bonus awesoming
var bonuspoints = new Array();
var bonusvote = false;
var bonusvotepoints = 0;

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

//Checks if the user id is present in the admin list. Authentication
//for admin-only privileges.
function admincheck(userid) {
	for (i in config.admins) {
		if (userid == config.admins[i]) {
			return true;
		}
	}
	return false;
}

//The bot will respond to a Reptar call with a variant of 'rawr!' based on
//the result from a RNG.
function reptarCall() {
	var rand = Math.random();
	if (rand < 0.05) {
		bot.speak('That band is pretty awesome.');
	} else if (rand < 0.10) {
		bot.speak('Good morning!');
	} else if (rand < 0.17) {
		bot.speak('Rawr!');
	} else if (rand < 0.3) {
		bot.speak('rawr!');
	} else if (rand < 0.4) {
		bot.speak('RAWR!');
	} else if (rand < 0.5) {
		bot.speak('rawr.');
	} else if (rand < 0.6) {
		bot.speak('RAWR!!!');
	} else {
		bot.speak('.reptar');
	}
}

//Adds the song data to the songdata table.
//This runs on the endsong event.
function addToDb(data) {
	client.query(
		'INSERT INTO '+ config.SONG_TABLE +' '
		+ 'SET artist = ?,song = ?, djname = ?, djid = ?, up = ?, down = ?,'
		+ 'listeners = ?, started = NOW(), snags = ?, bonus = ?',
		[currentsong.artist, 
		currentsong.song, 
		currentsong.djname, 
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
			bot.speak(usersList[usertostep].name + ', please step down');
			setTimeout( function() {
				if(!userstepped) {
					bot.remDj(usertostep);
				}
			}, 19000);
		}
	}, 15000);
}

//Calculates the target number of votes needed for bot to awesome
function getTarget() {
	if (currentsong.listeners < 11) {
		return 3;
	} else if (currentsong.listeners < 21) {
		return 4;
	}
	return 5 + Math.floor((currentsong.listeners - 20) / 20);
}

function getVoteTarget() {
	if (currentsong.listeners <= 3) {
		return 1;
	}
	return Math.ceil(Math.pow(1.1383*(currentsong.listeners - 3), 0.6176));
}

//Welcome message for TCP connection
bot.on('tcpConnect', function (socket) {
	socket.write('>> Welcome! Type a command or \'help\' to see a list of commands\n');
});

//TCP message handling
bot.on('tcpMessage', function (socket, msg) {
	//Have the bot speak in chat
	if (msg.match(/^speak/)) {
		bot.speak(msg.substring(6));
		socket.write('>> Message sent\n');
	}
	
	//Boot the given userid
	//TODO: Change userid to user name
	if (msg.match(/^boot/)) {
		bot.boot(msg.substring(5));
	}
	
	//Handle commands
	switch (msg) {
		case 'help':
			socket.write('>> xxMEOWxx responds to the following commands in the console: '
				+ 'online, .a, .l, step up, step down, speak [text], exit, shutdown\n');
			break;
		case 'online':
			socket.write('>> ' + currentsong.listeners + '\n');
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
			bot.remDj(config.USERID);
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
		}
});


//When the bot is ready, this makes it join the primary room (ROOMID)
//and sets up the database/tables
//TODO: Actually handle those errors (99% of the time it'll be a "db/table
//	already exists" error which is why I didn't handle them immediately)
bot.on('ready', function (data) {
	if (config.useDatabase) {
		//Creates DB and tables if needed, connects to db
		client.query('CREATE DATABASE ' + config.DATABASE,
			function(error) {
				if(error && error.number != mysql.ERROR_DB_CREATE_EXISTS) {
					throw (error);
				}
		});
		client.query('USE '+ config.DATABASE);

		//song table
		client.query('CREATE TABLE ' + config.SONG_TABLE
			+ '(id INT(11) AUTO_INCREMENT PRIMARY KEY,'
			+ ' artist VARCHAR(255),'
			+ ' song VARCHAR(255),'
			+ ' djname VARCHAR(255),'
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
		client.query('CREATE TABLE ' + config.CHAT_TABLE
			+ '(id INT(11) AUTO_INCREMENT PRIMARY KEY,'
			+ ' user VARCHAR(255),'
			+ ' userid VARCHAR(255),'
			+ ' chat VARCHAR(255),'
			+ ' time DATETIME)',
			function (error) {
				//Handle an error if it's not a table already exists error
				if(error && error.number != 1050) {
					throw (error);
				}
		});
	}
			
	bot.roomRegister(config.ROOMID);
});

//Runs when the room is changed.
//Updates the currentsong array and users array with new room data.
bot.on('roomChanged', function(data) {
	//Fill currentsong array with room data
	if (data.room.metadata.current_song != null) {
		currentsong.artist    = data.room.metadata.current_song.metadata.artist;
		currentsong.song      = data.room.metadata.current_song.metadata.song;
		currentsong.djname    = data.room.metadata.current_song.djname;
		currentsong.djid      = data.room.metadata.current_song.djid;
		currentsong.up        = data.room.metadata.upvotes;
		currentsong.down      = data.room.metadata.downvotes;
		currentsong.listeners = data.room.metadata.listeners;
	}

	//Creates the dj list
	djs = data.room.metadata.djs;
	
	if (config.voteBonus) {
		bonusvotepoints = getVoteTarget();
	}
	
	//Repopulates usersList array.
	var users = data.users;
	for (i in users) {
		var user = users[i];
		usersList[user.userid] = user;
	}
	
	//Set bot's laptop type
	bot.modifyLaptop(config.LAPTOP);
});

//Runs when a user updates their vote
//Updates current song data and logs vote in console
bot.on('update_votes', function (data) {
	//Update vote and listener count
	currentsong.up = data.room.metadata.upvotes;
	currentsong.down = data.room.metadata.downvotes;
	currentsong.listeners = data.room.metadata.listeners;
	
	if (config.voteBonus && !bonusvote) {
		if (currentsong.up >= bonusvotepoints) {
			bot.vote('up');
			bot.speak('Bonus!');
			bot.snag();
			bonusvote = true;
		}
	}

	//Log vote in console
	//Note: Username only displayed for upvotes, since TT doesn't broadcast
	//      username for downvote events.
	if (config.logConsoleEvents) {
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
	if (config.logConsoleEvents) {
		console.log('Joined room: ' + data.user[0].name);
	}
	
	//Add user to usersList
	var user = data.user[0];
	usersList[user.userid] = user;
	
	if (config.voteBonus) {
		bonusvotepoints = getVoteTarget();
	}

	//Greet user
	//Displays custom greetings for certain members
	if(config.welcomeUsers) {
		if (!user.name.match(/^ttdashboard/)) {
			if (config.useDatabase) {
				client.query('SELECT greeting FROM HOLIDAY_GREETINGS WHERE '
					+ 'date LIKE CURDATE()',
					function cbfunc(error, results, fields) {
						if (results[0] != null) {
							bot.speak(results[0]['greeting'] + ', ' + user.name + '!');
						} else {
							bot.speak(config.welcomeGreeting + user.name + '!');
						}
				});
			} else {
				bot.speak(config.welcomeGreeting + user.name + '!');
			}
		}
	}
});

//Runs when a user leaves the room
//Removes user from usersList, logs in console
bot.on('deregistered', function (data) {
	//Log in console
	if (config.logConsoleEvents) {
		console.log('Left room: ' + data.user[0].name);
	}
	
	//Remove user from userlist
	delete usersList[data.user[0].userid];
});

//Runs when something is said in chat
//Responds based on coded commands, logs in console, adds chat entry to chatlog table
//Commands are added under switch(text)
bot.on('speak', function (data) {
	//Get name/text data
	var name = data.name;
	var text = data.text;

	//Log in console
	if (config.logConsoleEvents) {
		console.log('Chat ['+data.userid+' ' +name+'] '+text);
	}

	//Log in db (chatlog table)
	if (config.useDatabase) {
		client.query('INSERT INTO ' + config.CHAT_TABLE + ' '
			+ 'SET user = ?, userid = ?, chat = ?, time = NOW()',
			[data.name, data.userid, data.text]);
	}

	//If it's a supported command, handle it	
	switch(text.toLowerCase()) {
		//--------------------------------------
		//COMMAND LISTS
		//--------------------------------------
	
		case '.sparklecommands':
			bot.speak('commands: .users, .owner, .source, mystats, bonus, points, rules, ping, '
				+ 'platforms, reptar, mostplayed, mostawesomed, mostlamed, mymostplayed, '
				+ 'mymostawesomed, mymostlamed, totalawesomes, mostsnagged, '
				+ 'pastnames [username], .similar, .similarartists, '
				+ '.weather [zip], .find [zip] [thing]');
			break;

		case 'help':
		case 'commands':
			bot.speak('commands: .ad, bonus, points, ping, reptar, merica, .random, platforms, '
				+ '.twitter, .rules, .users, .owner, .source, mystats, mostplayed, '
				+ 'mostawesomed, mymostplayed, mymostawesomed, '
				+ 'pastnames [username], .similar, .similarartists');
			break;

		//Bonus points
		//If enough bonus points are cast for a song, the bot will awesome.
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
			//If the user has not cast a bonus point, add to bonuspoints array
			//Only use this scheme if vote-based bonus points are disabled
			if ((bonuspoints.indexOf(data.name) == -1) && !config.voteBonus) {
				bonuspoints.push(data.name);
				var target = getTarget();
				//If the target has been met, the bot will awesome
				if((bonuspoints.length >= target) && !bonusvote) {
					bot.speak('Bonus!');
					bot.vote('up');
					bot.snag();
					bonusvote = true;
				}
			}
		break;
			
		//Checks the number of points cast for a song, as well as the number needed
		case 'points':
			if (config.voteBonus) {
				bot.speak(bonusvotepoints + ' awesomes are needed for a bonus.');
			} else {
				var target = getTarget();
				bot.speak('Bonus points: ' + bonuspoints.length + '. Needed: ' + target + '.');
			}
			break;
			
		//--------------------------------------
		//USER COMMANDS
		//--------------------------------------

		//Displays a list of users in the room
		case '.users':
			var numUsers = 0;
			var output = '';
			for (var i in usersList) {
				output += (usersList[i].name) + ', ';
				numUsers++;
			}
			bot.speak(numUsers + ' users in room: '
				+ output.substring(0,output.length - 2));
			break;

		case 'antiquing':
		case 'antiquing?':
			bot.speak('\"Antiquing\" is the act of shopping, identifying, negotiating, or '
				+ 'bargaining for antiques. Items can be bought for personal use, gifts, and '
				+ 'in the case of brokers and dealers, profit.');
			break;

		//Responds to reptar-related call
		case 'can you feel it!?':
			setTimeout(function() {
				bot.speak('YES I CAN FEEL IT!');
			}, 1200);
			break;
			
		case 'i enjoy that band.':
			setTimeout(function() {
				bot.speak('Me too!');
			}, 1200);
			break;

		//Outputs bot owner
		case '.owner':
			bot.speak(config.ownerResponse);
			break;

		//Outputs github url for SparkleBot
		case '.source':
			bot.speak('My source code is available at: '
				+ 'https://github.com/sharedferret/Sparkle-Turntable-Bot');
			break;

		//Ping bot
		//Useful for users that use the iPhone app
		case 'ping':
			var rand = Math.random();
			if (rand < 0.5) {
				bot.speak('You\'re still here, '+name+'!');
			} else {
				bot.speak('Still here, '+name+'!');
			}
			break;

		//Reptar call!
		//Randomly picks a response in reptarCall()
		case 'reptar':
			reptarCall();
			break;

		//Rules rehash since xxRAWRxx only responds to .rules
		case 'rules':
			bot.speak('You can view the rules here: http://tinyurl.com/63hr2jl');
			setTimeout(function() {
				bot.speak('No queue, fastest finger, play one song and step down');
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
					bot.speak('Awww!');
				}, 1500);
				timetowait += 600;
			}
			setTimeout(function() {
				bot.speak('hugs ' + data.name);
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
			bot.speak('Platforms in this room: '
			    + 'PC: ' + platforms.pc
				+ '.  Mac: ' + platforms.mac
				+ '.  Linux: ' + platforms.linux
				+ '.  Chrome: ' + platforms.chrome
				+ '.  iPhone: ' + platforms.iphone + '.');
			break;
			
		//--------------------------------------
		//HTTP REST QUERIES
		//--------------------------------------

		//Returns three similar songs to the one playing.
		//Uses last.fm's API
        case '.similar':
        	if (config.uselastfmAPI) {
				request('http://ws.audioscrobbler.com/2.0/?method=track.getSimilar'
					+ '&artist=' + encodeURIComponent(currentsong.artist)
					+ '&track='  + encodeURIComponent(currentsong.song)
      				+ '&api_key=' + config.lastfmkey + '&format=json&limit=5',
                	function cbfunc(error, response, body) {
                    	if(!error && response.statusCode == 200) {
                        	var formatted = eval('(' + body + ')');
							var botstring = 'Similar songs to ' + currentsong.song + ': ';
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
							bot.speak(botstring.substring(0, botstring.length - 2));
                        }
                });
			}
        	break;
	
		//Returns three similar artists to the one playing.
		//Uses last.fm's API
		case '.similarartists':
			if (config.uselastfmAPI) {
				request('http://ws.audioscrobbler.com/2.0/?method=artist.getSimilar'
                	+ '&artist=' + encodeURIComponent(currentsong.artist)
                    + '&api_key=' + config.lastfmkey + '&format=json&limit=4',
                	function cbfunc(error, response, body) {
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
                            bot.speak(botstring.substring(0, botstring.length - 2));
                        }
                });
			}
			break;


		//--------------------------------------
		//USER DATABASE COMMANDS
		//--------------------------------------

		//Returns the room's play count, total awesomes/lames, and average awesomes/lames
		//in the room
		case 'stats':
			if (config.useDatabase) {
				client.query('SELECT count(*) as total, sum(up) as up, avg(up) as avgup, '
					+ 'sum(down) as down, avg(down) as avgdown FROM ' + config.SONG_TABLE,
					function select(error, results, fields) {
						bot.speak('In this room, '
							+ results[0]['total'] + ' songs have been played with a total of '
							+ results[0]['up'] + ' awesomes and ' + results[0]['down']
							+ ' lames (avg +' + new Number(results[0]['avgup']).toFixed(1) 
							+ '/-' + new Number(results[0]['avgdown']).toFixed(1)
							+ ').');
				});
			}
			break;

		//Returns the three song plays with the most awesomes in the songlist table
		case 'bestplays':
			if (config.useDatabase) {
				client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, UP FROM '
					+ config.SONG_TABLE + ' ORDER BY UP DESC LIMIT 3',
					function select(error, results, fields) {
						var response = 'The song plays I\'ve heard with the most awesomes: ';
						for (i in results) {
							response += results[i]['TRACK'] + ': '
								+ results[i]['UP'] + ' awesomes.  ';
						}
						bot.speak(response);
				});
			}
			break;
			
		//Returns the three DJs with the most points in the last 24 hours
		case 'past24hours':
			if (config.useDatabase) {
				client.query('SELECT djname, sum(up) AS upvotes FROM ' + config.SONG_TABLE
					+ ' WHERE started > DATE_SUB(NOW(), INTERVAL 1 DAY) GROUP BY djid '
					+ 'ORDER BY sum(up) DESC LIMIT 3',
					function select(error, results, fields) {
						var response = 'DJs with the most points in the last 24 hours: ';
						for (i in results) {
							response += results[i]['djname'] + ': '
								+ results[i]['upvotes'] + ' awesomes.  ';
						}
						bot.speak(response);
				});
			}
			break;

		//Returns the three DJs with the most points logged in the songlist table
		case 'bestdjs':
			if (config.useDatabase) {
				client.query('SELECT djname as DJ, sum(up) as POINTS from '
					+ '(SELECT * from ' + config.SONG_TABLE + ' order by id desc) as SORTED'
					+ ' group by djid order by sum(up) desc limit 3',
					function select(error, results, fields) {
						var response = 'The DJs with the most points accrued in this room: ';
						for (i in results) {
							response += results[i]['DJ'] + ': '
								+ results[i]['POINTS'] + ' points.  ';
						}
						bot.speak(response);
				});
			}
			break;
		
		case 'rank':
			if (config.useDatabase) {
				client.query('SET @rownum := 0');
				client.query('SELECT POINTS, rank FROM (SELECT @rownum := @rownum + 1 AS '
					+ 'rank, djid, POINTS FROM (SELECT djid, sum(up) as POINTS from SONGLIST '
					+ 'group by djid order by sum(up) desc) as test) as rank where '
					+ 'djid like \'' + data.userid + '\'',
					function select(error, results, fields) {
						try {
						bot.speak (data.name + ', you have ' + results[0]['POINTS'] + ' points in'
							+ ' this room (Rank: ' + results[0]['rank'] + ')');
						} catch(e) {
							bot.speak('You haven\'t played any songs in this room!');
						}
					});
			}
			break;
					

		//Returns the three DJs with the most points logged in the songlist table
		case 'worstdjs':
			if (config.useDatabase) {
				client.query('SELECT djname as DJ, sum(down) as POINTS from '
					+ '(SELECT * from ' + config.SONG_TABLE + ' order by id desc) as SORTED'
					+ ' group by djid order by sum(down) desc limit 3',
					function select(error, results, fields) {
						var response = 'The DJs with the most lames accrued in this room: ';
						for (i in results) {
							response += results[i]['DJ'] + ': '
								+ results[i]['POINTS'] + ' lames.  ';
						}
						bot.speak(response);
				});
			}
			break;

		//Returns the three most-played songs in the songlist table
		case 'mostplayed':
			if (config.useDatabase) {
				client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, COUNT(*) AS COUNT FROM '
					+ config.SONG_TABLE + ' GROUP BY CONCAT(song,\' by \',artist) ORDER BY COUNT(*) '
					+ 'DESC LIMIT 3',
					function select(error, results, fields) {
						var response = 'The songs I\'ve heard the most: ';
						for (i in results) {
							response += results[i]['TRACK'] + ': '
								+ results[i]['COUNT'] + ' plays.  ';
						}
						bot.speak(response);
				});
			}
			break;
			
			//Returns the three most-played songs in the songlist table
		case 'mostsnagged':
			if (config.useDatabase) {
				client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, sum(snags) AS SNAGS FROM '
					+ config.SONG_TABLE + ' GROUP BY CONCAT(song, \' by \', artist) ORDER BY SNAGS '
					+ 'DESC LIMIT 3', function select(error, results, fields) {
						var response = 'The songs I\'ve seen snagged the most: ';
						for (i in results) {
							response += results[i]['TRACK'] + ': '
								+ results[i]['SNAGS'] + ' snags.  ';
						}
						bot.speak(response);
				});
			}
			break;

		//Returns the three most-awesomed songs in the songlist table
		case 'mostawesomed':
			if (config.useDatabase) {
				client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, SUM(up) AS SUM FROM '
					+ config.SONG_TABLE + ' GROUP BY CONCAT(song,\' by \',artist) ORDER BY SUM '
					+ 'DESC LIMIT 3',
					function select(error, results, fields) {
						var response = 'The most awesomed songs I\'ve heard: ';
						for (i in results) {
							response += results[i]['TRACK'] + ': '
								+ results[i]['SUM'] + ' awesomes.  ';
						}
						bot.speak(response);
				});
			}
			break;

		//Returns the three most-lamed songs in the songlist table
		case 'mostlamed':
			if (config.useDatabase) {
				client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, SUM(down) AS SUM FROM '
					+ config.SONG_TABLE + ' GROUP BY CONCAT(song,\' by \',artist) ORDER BY SUM '
					+ 'DESC LIMIT 3',
					function select(error, results, fields) {
						var response = 'The most lamed songs I\'ve heard: ';
						for (i in results) {
							response += results[i]['TRACK'] + ': '
								+ results[i]['SUM'] + ' lames.  ';
						}
						bot.speak(response);
				});
			}
			break;
			
		//Returns the user's play count, total awesomes/lames, and average awesomes/lames
		//in the room
		case 'mystats':
			if (config.useDatabase) {
				client.query('SELECT count(*) as total, sum(up) as up, avg(up) as avgup, '
					+ 'sum(down) as down, avg(down) as avgdown '
					+ 'FROM '+ config.SONG_TABLE + ' WHERE `djid` LIKE \'' + data.userid + '\'',
					function select(error, results, fields) {
						bot.speak (data.name + ', you have played ' + results[0]['total'] 
							+ ' songs in this room with a total of '
							+ results[0]['up'] + ' awesomes and ' + results[0]['down']
							+ ' lames (avg +' + new Number(results[0]['avgup']).toFixed(1) 
							+ '/-' + new Number(results[0]['avgdown']).toFixed(1)
							+ ')');
				});
			}
			break;
			
		//Returns the user's three most played songs
		case 'mymostplayed':
			if (config.useDatabase) {
				client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, COUNT(*) AS COUNT FROM '
					+ config.SONG_TABLE + ' WHERE (djid = \''+ data.userid +'\')'
					+ ' GROUP BY CONCAT(song,\' by \',artist) ORDER BY COUNT(*) DESC LIMIT 3',
					function select(error, results, fields) {
						var response = 'The songs I\'ve heard the most from you: ';
						for (i in results) {
							response += results[i]['TRACK'] + ': '
								+ results[i]['COUNT'] + ' plays.  ';
						}
						bot.speak(response);
				});
			}
			break;

		//Returns the user's three most-awesomed songs (aggregate)
		case 'mymostawesomed':
			if (config.useDatabase) {
				client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, SUM(up) AS SUM FROM '
					+ config.SONG_TABLE + ' WHERE (djid = \''+ data.userid +'\')'
					+ ' GROUP BY CONCAT(song,\' by \',artist) ORDER BY SUM DESC LIMIT 3',
					function select(error, results, fields) {
						var response = 'The most appreciated songs I\'ve heard from you: ';
						for (i in results) {
							response += results[i]['TRACK'] + ': '
								+ results[i]['SUM'] + ' awesomes.  ';
						}
						bot.speak(response);
				});
			}
			break;

		//Returns the user's three most-lamed songs (aggregate)
		case 'mymostlamed':
			if (config.useDatabase) {
				client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, SUM(down) AS SUM FROM '
					+ config.SONG_TABLE + ' WHERE (djid = \''+ data.userid +'\')'
					+ ' GROUP BY CONCAT(song,\' by \',artist) ORDER BY SUM DESC LIMIT 3',
					function select(error, results, fields) {
						var response = 'The most hated songs I\'ve heard from you: ';
						for (i in results) {
							response += results[i]['TRACK'] + ': '
								+ results[i]['SUM'] + ' lames.  ';
						}
						bot.speak(response);
				});
			}
			break;

		//For debugging/monitoring of db
		//Returns the number of songs logged and the size of the database in MB.
		case 'dbsize':
			if (config.useDatabase) {
				//var response = 'Songs logged';
				client.query('SELECT COUNT(STARTED) AS COUNT FROM ' + config.SONG_TABLE,
					function selectCb(error, results, fields) {
						bot.speak('Songs logged: ' + results[0]['COUNT'] + ' songs.');
				});
				setTimeout(function() {
					client.query('SELECT sum( data_length + index_length ) / 1024 / 1024 \'dbsize\''
						+ ' FROM information_schema.TABLES'
						+ ' WHERE (table_schema = \'' + config.DATABASE + '\')',
						function selectCb(error, results, fields) {
							bot.speak('Database size: ' + results[0]['dbsize'] + ' MB.');
					});
				}, 500);
			}
			break;

		//Bot freakout
		case 'reptar sucks':
			bot.speak('OH NO YOU DIDN\'T');
			setTimeout(function() {
				reptarCall();
			}, 1000);
			break;
			

		//--------------------------------------
		//ADMIN-ONLY COMMANDS
		//--------------------------------------

		//Tells bot to awesome the current song
		case '\.a':
			if (admincheck(data.userid)) {
				bot.vote('up');
			}
			break;

		//Tells bot to lame the current song
		case '\.l':
			if (admincheck(data.userid)) {
				bot.vote('down');
			}
			break;

		//Pulls a DJ after their song.
		case 'pulldj':
			if (admincheck(data.userid)) {
				if (!userstepped) {
					bot.remDj(usertostep);
				}
			}
			break;

		//Pulls the current dj.
		case 'pullcurrent':
			if (admincheck(data.userid)) {
				if(currentsong.djid != null) {
					bot.remDj(currentsong.djid);
				}
			}
			break;

		case 'Meow, go to reptar room':
			if (data.userid == config.MAINADMIN) {
				bot.roomDeregister();
				bot.roomRegister(config.ROOMID);
			}
			break;

		//Step up to DJ
		case 'meow, step up':
			if (admincheck(data.userid)) {
				bot.addDj();
			}
			break;

		//Step down if DJing
		case 'meow, step down':
			if (admincheck(data.userid)) {
				bot.remDj(config.USERID);
			}
			break;

		//Bot freakout
		case 'oh my god meow':
			if (admincheck(data.userid)) {
				reptarCall();
				setTimeout(function() {
					reptarCall();
				}, 1400);
				setTimeout(function() {
					reptarCall();
				}, 2800);
				setTimeout(function() {
					reptarCall();
				}, 4200);
				setTimeout(function() {
					reptarCall();
				}, 5600);
			}
			break;

		//Shuts down bot (only the main admin can run this)
		//Disconnects from room, exits process.
		case 'meow, shut down':
			if (data.userid == config.MAINADMIN) {
				bot.speak('Shutting down...');
				bot.roomDeregister();
				process.exit(0);
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
        	                var formatted = eval('(' + body + ')');
        	        	try {
						var loc = formatted.query.results.weather.rss.channel.location.city + ', '
        	            if (formatted.query.results.weather.rss.channel.location.region != '') {
        	            	loc += formatted.query.results.weather.rss.channel.location.region;
        	            } else {
        	            	loc += formatted.query.results.weather.rss.channel.location.country;
        	            }
        	        	var temp = formatted.query.results.weather.rss.channel.item.condition.temp;
        	        	var cond = formatted.query.results.weather.rss.channel.item.condition.text;
        	        	bot.speak('The weather in ' + loc + ' is ' + temp + 'ºF and ' + cond + '.');
                	} catch(e) {
				bot.speak('Sorry, I can\'t find that location.');
			}}
        });
	}
	
	if(text.match(/^.find/)) {
		var location = text.split(' ', 2);
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
						
						bot.speak(botresponse);
					} catch (e) {
						bot.speak('Sorry, no locations found.');
					}
				}
		});
	}

	//Returns a list of names a user has gone by
	//Usage: 'pastnames [username]'
	if (text.match(/^pastnames/)) {
		if (config.useDatabase) {
			client.query('SELECT djname FROM ' + config.SONG_TABLE
				+ ' WHERE (djid LIKE (SELECT djid FROM '
				+ config.SONG_TABLE + ' WHERE (djname like ?)'
				+ ' ORDER BY id DESC LIMIT 1)) GROUP BY djname',
				[text.substring(10)],
				function select(error, results, fields) {
						var response = 'Names I\'ve seen that user go by: ';
						for (i in results) {
							response += results[i]['djname'] + ', ';
						}
						bot.speak(response.substring(0,response.length-2));
			});
		}
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
	if (config.useDatabase) {
		addToDb();
	}

	//Used for room enforcement
	userstepped = false;
	usertostep = currentsong.djid;

	//Report song stats in chat
	if (config.reportSongStats) {
		bot.speak(currentsong.song + ' stats: awesomes: '
			+ currentsong.up + ' lames: ' + currentsong.down);
	}
});

//Runs when a new song is played
//Populates currentsong data, tells bot to step down if it just played a song,
//logs new song in console, auto-awesomes song
bot.on('newsong', function (data) {
	//Populate new song data in currentsong
	currentsong.artist = data.room.metadata.current_song.metadata.artist;
	currentsong.song = data.room.metadata.current_song.metadata.song;
	currentsong.djname = data.room.metadata.current_song.djname;
	currentsong.djid = data.room.metadata.current_song.djid;
	currentsong.up = data.room.metadata.upvotes;
	currentsong.down = data.room.metadata.downvotes;
	currentsong.listeners = data.room.metadata.listeners;
	currentsong.started = data.room.metadata.current_song.starttime;
	currentsong.snags = 0;

	//Check something
	if ((currentsong.artist.indexOf('Skrillex') != -1) || (currentsong.song.indexOf('Skrillex') != -1)) {
		bot.remDj(currentsong.djid);
		bot.speak('NO.');
	}

	//Enforce stepdown rules
	if (usertostep != null) {
		if (usertostep == config.USERID) {
			bot.remDj(config.USERID);
		} else if (config.oneDownEnforce) {
			enforceRoom();
		}
	}

	//Log in console
	if (config.logConsoleEvents) {
		console.log('Now Playing: '+currentsong.artist+' - '+currentsong.song);
	}

	//Auto-awesome
	if (config.autoAwesome) {
		var randomwait = Math.floor(Math.random() * 20) + 4;
		setTimeout(function() {
			bot.vote('up');
		}, randomwait * 1000);
	}
	
	//Reset bonus points
	bonusvote = false;
	if (config.voteBonus) {
		bonusvotepoints = getVoteTarget();
	} else {
		bonuspoints = new Array();
	}
	

	//SAIL!
	if((currentsong.artist == 'AWOLNATION') && (currentsong.song == 'Sail') && config.botSing) {
		setTimeout(function() {
			bot.speak('SAIL!');
		}, 34500);
	}

	//--------------------------------------
	// REPTAR SINGALONGS
	//--------------------------------------

	//CAN YOU FEEL IT?
	if(currentsong.song == 'Houseboat Babies' && config.botSing) {
		setTimeout(function() {
			bot.speak('CAN YOU FEEL IT?')	;
		}, 86000);
		setTimeout(function() {
			bot.speak('YES I CAN FEEL IT');
		}, 88500);
		setTimeout(function() {
			bot.speak('When I\'m at Jenny\'s house');
		}, 90000);
		setTimeout(function() {
			bot.speak('I look for bad ends');
		}, 93500);
		setTimeout(function() {
			bot.speak('Forget your parents!');
		}, 96000);
		setTimeout(function() {
			bot.speak('But it\'s just cat and mouse!');
		}, 98500);
	}
	
	if((currentsong.artist == 'Of Monsters And Men') && (currentsong.song == 'Little Talks')) {
	setTimeout(function() {
			bot.speak('Hey!')	;
		}, 63000);
		setTimeout(function() {
			bot.speak('Hey!')	;
		}, 67500);
		setTimeout(function() {
			bot.speak('Hey!')	;
		}, 72000);
	}

	if((currentsong.artist == 'Reptar') && (currentsong.song == 'Blastoff') && config.botSing) {
		setTimeout(function() {
			bot.speak('Well I won\'t call you!');
		}, 184000);
		setTimeout(function() {
			bot.speak('If you don\'t call me!');
		}, 186000);
		setTimeout(function() {
			bot.speak('No no I won\'t call you!');
		}, 188000);
		setTimeout(function() {
			bot.speak('If you don\'t call me!');
		}, 190000);
		setTimeout(function() {
			bot.speak('Yeah!');
		}, 192000);
	}
});

//Runs when a dj steps down
//Logs in console
bot.on('rem_dj', function (data) {
	//Log in console
	//console.log(data.user[0]);
	if (config.logConsoleEvents) {
		console.log('Stepped down: '+ data.user[0].name + ' [' + data.user[0].userid + ']');
	}

	//Adds user to 'step down' vars
	//Used by enforceRoom()
	if (usertostep == data.user[0].userid) {
		userstepped = true;
		usertostep = null;
	}

	//Remove from dj list
	for (i in djs) {
		if (djs[i] == data.user[0].userid) {
			delete djs[i];
		}
	}
});

//Runs when a dj steps up
//Logs in console
bot.on('add_dj', function(data) {
	//Log in console
	if (config.logConsoleEvents) {
		console.log('Stepped up: ' + data.user[0].name);
	}
	djs[djs.length] = data.user[0].userid;
});

bot.on('snagged', function(data) {
	currentsong.snags++;
	bonuspoints.push(usersList[data.userid].name);
	var target = getTarget();
	if((bonuspoints.length >= target) && !bonusvote && !config.voteBonus) {
		bot.speak('Bonus!');
		bot.vote('up');
		bot.snag();
		bonusvote = true;
	}	
});

bot.on('rem_moderator', function(data) {
	if(config.MAINADMIN == data.userid) {
		setTimeout(function() {
			bot.addModerator(config.MAINADMIN);
		}, 200);
	}
});

bot.on('booted_user', function(data) {
	//if the bot was booted, reboot
	if((config.USERID == data.userid) && config.autoRejoin) {
		setTimeout(function() {
			bot.roomRegister(config.ROOMID);
		}, 25000);
		setTimeout(function() {
			bot.speak('Please do not boot the room bot.');
		}, 27000);
	}
});