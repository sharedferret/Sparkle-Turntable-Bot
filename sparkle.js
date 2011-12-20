/**
 *  sparkle.js
 *  Author: sharedferret
 *  Version: [dev] 2011.12.19
 *  
 *  A Turntable.fm bot for the Indie/Classic Alternative 1 + Done room.
 *  Based on bot implementations by alaingilbert, anamorphism, and heatvision
 *  Uses node.js with modules ttapi, node_mysql
 * 
 *  Run: 'node sparkle.js'
 *  
 *  Make sure parameters in config.js are set before running.
 *
 *  Currently assumes DATABASE, SONG_TABLE, and CHAT_TABLE exist.
*/

var Bot    = require('ttapi');
var config = require('./config.js');

//Database
//Caution: assumes database and tables already created
//TODO: add catch for db/table not found to create them
var mysql = require('mysql');
var client = mysql.createClient(config.DBLOGIN);
client.query('USE '+ config.DATABASE);

//Creates the bot and initializes global vars
var bot = new Bot(config.AUTH, config.USERID);
var usersList = { };

var curdj;
var usertostep;
var userstepped = false;

var currentsong = {
	artist: null,
	song: null,
	djname: null,
	djid: null,
	up: 0,
	down: 0,
	listeners: 0,
	started: 0};

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
//TODO: pull this out to a db
function reptarCall() {
	var rand = Math.random();
	if (rand < 0.05) {
		bot.speak('That band is pretty awesome.');
	} else if (rand < 0.10) {
		bot.speak('Good morning!');
	} else if (rand < 0.18) {
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
		+ 'SET artist = ?,song = ?, djname = ?, djid = ?, up = ?, down = ?, listeners = ?, started = ?',
		[currentsong.artist, 
		currentsong.song, 
		currentsong.djname, 
		currentsong.djid, 
		currentsong.up, 
		currentsong.down, 
		currentsong.listeners, 
		currentsong.started]);
}

//When the bot is ready, this makes it join the primary room (ROOMID)
bot.on('ready', function (data) {
	bot.roomRegister(config.ROOMID);
});

//Runs when the room is changed.
//Updates the currentsong array and users array with new room data.
bot.on('roomChanged', function(data) {
	currentsong.artist = data.room.metadata.current_song.metadata.artist;
	currentsong.song = data.room.metadata.current_song.metadata.song;
	currentsong.djname = data.room.metadata.current_song.djname;
	currentsong.djid = data.room.metadata.current_song.djid;
	currentsong.up = data.room.metadata.upvotes;
	currentsong.down = data.room.metadata.downvotes;
	currentsong.listeners = data.room.metadata.listeners;
	currentsong.started = data.room.metadata.current_song.starttime;

	//Repopulates usersList array.
	var users = data.users;
	for (i in users) {
		var user = users[i];
		usersList[user.userid] = user;
	}
});

//Runs when a user updates their vote
//Updates current song data and logs vote in console
bot.on('update_votes', function (data) {
	//Update vote and listener count
	currentsong.up = data.room.metadata.upvotes;
	currentsong.down = data.room.metadata.downvotes;
	currentsong.listeners = data.room.metadata.listeners;

	//Log vote in console
	//Note: Username only displayed for upvotes, since TT doesn't broadcast
	//      username for downvote events.
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
});

//Runs when a user joins
//Adds user to userlist, logs in console, and greets user in chat.
bot.on('registered',   function (data) {
	//Log event in console
	console.log('Joined room: ' + data.user[0].name);

	//Add user to usersList
	var user = data.user[0];
	usersList[user.userid] = user;

	//Greet user
	//Displays custom greetings for certain members
	if(config.welcomeUsers) {
		if (!user.name.match(/^ttdashboard/)) {
			switch(user.name) {
				case 'overlordnyaldee':
					bot.speak('Meow!');
					setTimeout(function() {
						bot.speak('hugs overlordnyaldee');
					}, 2000);
					break;
				case 'sharedferret':
					bot.speak('Hi ferret!');
					setTimeout(function() {
						bot.speak('hugs sharedferret');
					}, 2000);
					break;
				default:
					bot.speak(config.welcomeGreeting + user.name + '!');
			}
		}
	}
});

//Runs when a user leaves the room
//Removes user from usersList, logs in console
bot.on('deregistered', function (data) {
	console.log('Left room: ' + data.user[0].name);
	var user = data.user[0];
	delete usersList[user.userid];
});

//Runs when something is said in chat
//Responds based on coded commands, logs in console, adds chat entry to chatlog table
//Commands are added under switch(text)
bot.on('speak', function (data) {
	//Get name/text data
	var name = data.name;
	var text = data.text;

	//Log in console
	console.log('Chat ['+data.userid+' ' +name+'] '+text);

	//Log in db (chatlog table)
	client.query('INSERT INTO ' + config.CHAT_TABLE + ' '
		+ 'SET user = ?, userid = ?, chat = ?',
		[data.name, data.userid, data.text]);

	//If it's a supported command, handle it	
	switch(text) {
		//--------------------------------------
		//COMMAND LISTS
		//--------------------------------------

		case '.sparklecommands':
			bot.speak('commands: .users, .owner, .source, rules, ping, reptar, '
				+ 'mostplayed, mostawesomed, mostlamed, mymostplayed, '
				+ 'mymostawesomed, mymostlamed, totalawesomes, dbsize');
			break;

		case 'help':
		case 'commands':
			bot.speak('commands: .ad, ping, reptar, merica, .random, .facebook, '
				+ '.twitter, .rules, .users, .owner, .source, mostplayed, '
				+ 'mostawesomed, mostlamed, mymostplayed, mymostawesomed, '
				+ 'mymostlamed, totalawesomes, dbsize');
			break;

		//--------------------------------------
		//USER COMMANDS
		//--------------------------------------

		//Displays a list of users in the room
		case '.users':
			var output = 'Users in room: ';
			for (var i in usersList) {
				output += (usersList[i].name) + ', ';
			}
			bot.speak(output.substring(0,output.length - 2));
			break;

		//Boots user 'thisiskirby'
		//Booted user changed by changing userid in bot.boot()
		case 'antiquing':
		case 'antiquing?':
			bot.speak('boom!');
			//bot.boot('4e1c82d24fe7d0313f0be9a7'); //boot kirby
			//bot.boot('4e3b6a804fe7d0578d003859', 'didn\'t awesome tpc'); //boot vic
			break;

		//Responds to reptar-related call
		case 'CAN YOU FEEL IT!?':
			setTimeout(function() {
				bot.speak('YES I CAN FEEL IT!');
			}, 1200);
			break;
		case 'I enjoy that band.':
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
		case 'hugs xxMEOWxx':
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

		//--------------------------------------
		//USER DATABASE COMMANDS
		//--------------------------------------

		//Returns the total number of awesomes logged in the songlist table
		case 'totalawesomes':
			client.query('SELECT SUM(UP) AS SUM FROM '
				+ config.SONG_TABLE,
				function selectCb(error, results, fields) {
					var awesomes = results[0]['SUM'];
					console.log(results[0]);
					bot.speak('Total awesomes in this room: ' + awesomes);					
				});
			break;

		//Returns the three most-played songs in the songlist table
		case 'mostplayed':
			client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, COUNT(*) AS COUNT'
			+' FROM SONGLIST GROUP BY CONCAT(song,\' by \',artist) ORDER BY COUNT(*) DESC LIMIT 3',
				function select(error, results, fields) {
					var response = 'The songs I\'ve heard the most: ';
					for (i in results) {
						response += results[i]['TRACK'] + ': '
							+ results[i]['COUNT'] + ' plays.  ';
					}
					bot.speak(response);
		});
			break;

		//Returns the three most-awesomed songs in the songlist table
		case 'mostawesomed':
			client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, SUM(up) AS SUM'
				+ ' FROM SONGLIST GROUP BY CONCAT(song,\' by \',artist) ORDER BY SUM DESC LIMIT 3',
				function select(error, results, fields) {
					var response = 'The most awesomed songs I\'ve heard: ';
					for (i in results) {
						response += results[i]['TRACK'] + ': '
							+ results[i]['SUM'] + ' awesomes.  ';
					}
					bot.speak(response);
			});
			break;

		//Returns the three most-lamed songs in the songlist table
		case 'mostlamed':
			client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, SUM(down) AS SUM'
				+ ' FROM SONGLIST GROUP BY CONCAT(song,\' by \',artist) ORDER BY SUM DESC LIMIT 3',
				function select(error, results, fields) {
					var response = 'The most lamed songs I\'ve heard: ';
					for (i in results) {
						response += results[i]['TRACK'] + ': '
							+ results[i]['SUM'] + ' lames.  ';
					}
					bot.speak(response);
			});
			break;
			
		//Returns the user's three most played songs
		case 'mymostplayed':
			client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, COUNT(*) AS COUNT '
				+ 'FROM SONGLIST WHERE (djid = \''+ data.userid +'\')'
				+ ' GROUP BY CONCAT(song,\' by \',artist) ORDER BY COUNT(*) DESC LIMIT 3',
				function select(error, results, fields) {
					var response = 'The songs I\'ve heard the most from you: ';
					for (i in results) {
						response += results[i]['TRACK'] + ': '
							+ results[i]['COUNT'] + ' plays.  ';
					}
					bot.speak(response);
			});
			break;

		//Returns the user's three most-awesomed songs (aggregate)
		case 'mymostawesomed':
			client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, SUM(up) AS SUM'
				+ ' FROM SONGLIST WHERE (djid = \''+ data.userid +'\')'
				+ ' GROUP BY CONCAT(song,\' by \',artist) ORDER BY SUM DESC LIMIT 3',
				function select(error, results, fields) {
					var response = 'The most appreciated songs I\'ve heard from you: ';
					for (i in results) {
						response += results[i]['TRACK'] + ': '
							+ results[i]['SUM'] + ' awesomes.  ';
					}
					bot.speak(response);
			});
			break;

		//Returns the user's three most-lamed songs (aggregate)
		case 'mymostlamed':
			client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, SUM(down) AS SUM'
				+ ' FROM SONGLIST WHERE (djid = \''+ data.userid +'\')'
				+ ' GROUP BY CONCAT(song,\' by \',artist) ORDER BY SUM DESC LIMIT 3',
				function select(error, results, fields) {
					var response = 'The most hated songs I\'ve heard from you: ';
					for (i in results) {
						response += results[i]['TRACK'] + ': '
							+ results[i]['SUM'] + ' lames.  ';
					}
					bot.speak(response);
			});
			break;

		//For debugging/monitoring of db
		//Returns the number of songs logged and the size of the database in MB.
		case 'dbsize':
			//var response = 'Songs logged';
			client.query('SELECT COUNT(STARTED) AS COUNT FROM SONGLIST',
				function selectCb(error, results, fields) {
					bot.speak('Songs logged: ' + results[0]['COUNT'] + ' songs.');
			});
			setTimeout(function() {
			client.query('SELECT sum( data_length + index_length ) / 1024 / 1024 \'dbsize\''
				+ ' FROM information_schema.TABLES'
				+ ' WHERE (table_schema = \'nodejs_mysql_sparkle\')',
				function selectCb(error, results, fields) {
					bot.speak('Database size: ' + results[0]['dbsize'] + ' MB.');
			});
			}, 500);
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
		case 'awesome':
			if (admincheck(data.userid)) {
				bot.vote('up');
			}
			break;

		//Tells bot to lame the current song
		case '\.l':
		case 'lame':
			if (admincheck(data.userid)) {
				bot.vote('down');
			}
			break;

		//Changes room
		case 'Meow, go to IAS':
			if (data.userid == config.MAINADMIN) {
				bot.roomDeregister();
				bot.roomRegister(config.IASROOMID);
			}
			break;
		case 'Meow, go to Reptar Room':
			if (data.userid == config.MAINADMIN) {
				bot.roomDeregister();
				bot.roomRegister(config.ROOMID);
			}
			break;

		//Step up to DJ
		case 'Meow, step up':
			if (admincheck(data.userid)) {
				bot.addDj();
			}
			break;

		//Step down if DJing
		case 'Meow, step down':
			if (admincheck(data.userid)) {
				bot.remDj(USERID);
			}
			break;

		//Bot freakout
		case 'OH MY GOD MEOW':
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
				setTimeout(function() {
					reptarCall();
				}, 7000);
			}
			break;

		//Shuts down bot (only the main admin can run this)
		//Disconnects from room, exits process.
		case 'Meow, shut down':
			if (data.userid == config.MAINADMIN) {
				bot.roomDeregister();
				process.exit(0);
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
	addToDb();

	//Used for room enforcement
	userstepped = false;
	usertostep = curdj;

	//Report song stats in chat
	console.log('song end', data);
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

	//Update current dj
	curdj = data.room.metadata.current_song.djid;

	//If bot just played a song, step down
	if (usertostep != null) {
		if (usertostep == config.USERID) {
			bot.remDj(config.USERID);
		}
	}

	//Log in console
	console.log('Now Playing: '+currentsong.artist+' - '+currentsong.song);

	//Auto-awesome
	setTimeout(function() {
		bot.vote('up');
	}, 5000);

	//SAIL!
	if((currentsong.artist == 'AWOLNATION') && (currentsong.song == 'Sail')) {
		setTimeout(function() {
			bot.speak('SAIL!');
		}, 34500);
	}

	//CAN YOU FEEL IT?
	if(currentsong.song == 'Houseboat Babies') {
		setTimeout(function() {
			bot.speak('CAN YOU FEEL IT?')	;
		}, 84500);
		setTimeout(function() {
			bot.speak('YES I CAN FEEL IT');
		}, 86500);
		setTimeout(function() {
			bot.speak('When I\'m at Jenny\'s house');
		}, 89500);
		setTimeout(function() {
			bot.speak('I look for bad ends');
		}, 93000);
		setTimeout(function() {
			bot.speak('Forget your parents!');
		}, 95200);
		setTimeout(function() {
			bot.speak('But it\'s just cat and mouse!');
		}, 97900);
	}
});

//Runs when a dj steps down
//Logs in console
bot.on('rem_dj', function (data) {
	console.log('Stepped down: '+ data.user[0].name + ' [' + data.user[0].userid + ']'
);
	//Not used yet
	if (usertostep == data.user[0].userid) {
		userstepped = true;
	}
	
	//Log in console
	console.log('Stepped up: ' + data.user[0].name);
});

//Runs when a dj steps up
//Logs in console
bot.on('add_dj', function(data) {
	console.log('Stepped up: ' + data.user[0].name);
});
