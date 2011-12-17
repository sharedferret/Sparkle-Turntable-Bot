var Bot    = require('ttapi');
var AUTH   = '#####';
var USERID = '#####';
//Room code for Indie/Classic Alt 1 + Done
var ROOMID = '4e9d6e14a3f75112a202cb1d';
//Room code for indie and such.
var IASROOMID = '4e08878c14169c0199001082';
var ADMINID = '#####';
var ALTADMINID = '#####';

var bot = new Bot(AUTH, USERID);
var usersList = { };
var djs = { };



function wait(msecs)
{
	var start = new Date().getTime();
	var cur = start
	while(cur - start < msecs)
	{
		cur = new Date().getTime();
	}	
} 

bot.on('ready', function (data) {
	bot.roomRegister(ROOMID);
});

bot.on('roomChanged', function(data) {
	usersList = { };
	//console.log('Joined', data);

	djs = data.room.metadata.djs;
	//for (i in djs) {
	//	console.log(djs[i]);
	//}
	var users = data.users;
	for (i in users) {
		var user = users[i];
		usersList[user.userid] = user;
	}
});

//Runs when a user updates their vote
bot.on('update_votes', function (data) {
	if (data.room.metadata.votelog[0][1] == 'up') {
	var voteduser = usersList[data.room.metadata.votelog[0][0]];
	console.log('Vote: [+'
		+ data.room.metadata.upvotes
		+ ' -'
		+ data.room.metadata.downvotes
		+ '] ['
		+ data.room.metadata.votelog[0][0]
		+ '] '
		+ voteduser.name
		+ ': '
		+ data.room.metadata.votelog[0][1]);
	} else {
	console.log('Vote: [+'
		+ data.room.metadata.upvotes
		+ ' -'
		+ data.room.metadata.downvotes
		+ ']');
	}
});

//Runs when a user joins
bot.on('registered',   function (data) {
	console.log('Joined room: ' + data.user[0].name);
	var user = data.user[0];
	usersList[user.userid] = user;
	switch(user.name) {
		case 'overlordnyaldee':
			bot.speak('Meow!');
			break;
		default:
			bot.speak('Welcome, '+user.name+'!');
	}
});

bot.on('deregistered', function (data) {
   var user = data.user[0];
   delete usersList[user.userid];
});

//Runs when something is said in chat
bot.on('speak', function (data) {
	// Get the data
	var name = data.name;
	var text = data.text;

	// debugging
	console.log('Chat ['+data.userid+'] '+text);
	
	switch(text) {
		//Command Lists
		case '.sparklecommands':
			bot.speak('commands: .users, .owner, ping, reptar');
			break;

		case 'commands':
			bot.speak('commands: .ad, ping, reptar, merica, .random, .facebook, .twitter, .rules, .users, .owner');
			break;

		//USER COMMANDS

		//Displays a list of users in the room
		case '\.users':
			var output = 'Users in room: ';
			for (var i in usersList) {
				output += (usersList[i].name) + ', ';
			}
			bot.speak(output.substring(0,output.length - 2));
			break;

		//Boots user 'thisiskirby'
		case 'antiquing':
			bot.boot('4e1c82d24fe7d0313f0be9a7');
			break;

		//Responds to call
		case 'CAN YOU FEEL IT!?':
			wait(1200);
			bot.speak('YES I CAN FEEL IT!');
			break;

		//Responds to call
		case 'I enjoy that band.':
			wait(1200);
			bot.speak('Me too!');
			break;

		//Outputs bot owner
		case '\.owner':
			bot.speak('sharedferret is my mistress.');
			break;

		//Ping to bot
		case 'ping':
			var rand = Math.random();
			if (rand < 0.5) {
				bot.speak('You\'re still here, '+name+'!');
			} else {
				bot.speak('Still here, '+name+'!');
			}
			break;

		//Reptar call!
		//Picks from one of 6 responses.
		case 'reptar':
			var rand = Math.random();
			if (rand < 0.1) {
				bot.speak('That band is pretty awesome.');
			} else if (rand < 0.2) {
				bot.speak('rawr!');
			} else if (rand < 0.4) {
				bot.speak('RAWR!');
			} else if (rand < 0.6) {
				bot.speak('rawr.');
			} else if (rand < 0.8) {
				bot.speak('RAWR!!!');
			} else {
				bot.speak('.reptar');
			}
			break;

		//Rules rehash since xxRAWRxx only responds to .rules
		case 'rules':
			bot.speak('You can view the rules here: http://tinyurl.com/63hr2jl');
			wait(700);
			bot.speak('No queue, fastest finger, play one song and step down');
			break;

		//ADMIN-ONLY COMMANDS

		//Tells bot to awesome the current song
		case '\.a':
		case 'awesome':
			if ((data.userid == ADMINID) || (data.userid == ALTADMINID)) {
				bot.vote('up');
			}
			break;

		//Tells bot to lame the current song
		case '\.l':
		case 'lame':
			if ((data.userid == ADMINID) || (data.userid == ALTADMINID)) {
				bot.vote('down');
			}
			break;

		//Removes the leftmost DJ
		case 'pulldj':
			if ((data.userid == ADMINID) || (data.userid == ALTADMINID)) {
				bot.remDj(djs[0]);
			}
			break;

		//Outputs first chorus of Reptar - Houseboat Babies
		case 'CAN YOU FEEL IT?':
			if ((data.userid == ADMINID) || (data.userid == ALTADMINID)) {
				bot.speak('YES I CAN FEEL IT');
				wait(2800);
				bot.speak('When I\'m at Jenny\'s house');
				wait(3200);
				bot.speak('I look for bad ends');
				wait(2000);
				bot.speak('Forget your parents!');
				wait(2500);
				bot.speak('But it\'s just cat and mouse!');
   			}
			break;

		//Changes room
		case 'Sparkle, go to IAS':
			if ((data.userid == ADMINID) || (data.userid == ALTADMINID)) {
				bot.roomDeregister();
				bot.roomRegister(IASROOMID);
			}
			break;
		case 'Sparkle, go to Reptar Room':
			if ((data.userid == ADMINID) || (data.userid == ALTADMINID)) {
				bot.roomDeregister();
				bot.roomRegister(ROOMID);
			}
			break;

		//Pull everyone and play a song
		case 'cb4':
			if (data.userid == ADMINID) {
				bot.speak('Awwwwww yeah');
				wait(2000);
				for (i in djs) {
					bot.remDj(djs[i]);
				}
				bot.addDj();
			}
			break;
	}

});

//Runs when a new song is played
//see if there's a better api call for song data
bot.on('newsong', function (data) {
	var artist = data.room.metadata.current_song.metadata.artist;
	var song = data.room.metadata.current_song.metadata.song;

	//remove bot if current dj
	if (djs[0] == USERID) {
		bot.remDj(djs[0]);
	}
	
	//update dj list
	djs = data.room.metadata.djs;

	//debugging
	//console.log(data.room.metadata);
	console.log('Now Playing: '+artist+' - '+song);

	wait(5000);
	bot.vote('up');
});

bot.on('rem_dj', function (data) {
	console.log('Stepped down: '+ data.user[0].name);
});

bot.on('add_dj', function(data) {
	console.log('Stepped up: ' + data.user[0].name);
});
