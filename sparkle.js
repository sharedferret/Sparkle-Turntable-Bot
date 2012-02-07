/**
 *  sparkle.js
 *  Author: sharedferret
 *  Version: [dev] 2012.03.06
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
var Bot;
var config;
var mysql;
var client;
var request;
var singalong;
var enforcement;

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

//Loads the room rules
try {
    enforcement = require('./enforcement.js');
} catch(e) {
    console.log(e);
    console.log('Ensure that enforcement.js is present in the directory.');
    config.roomEnforce = false;
}

//Loads bot singalongs
if (config.botSing) {
    try {
        singalong = require('./singalong.js');
    } catch (e) {
        console.log(e);
        console.log('Ensure that singalong.js is present in this directory,'
            + ' or disable the botSing flag in config.js');
        console.log('Starting bot without singalong functionality.');
        config.botSing = false;
    }
}

//Creates mysql db object
if (config.useDatabase) {
	try {
		mysql = require('mysql');
	} catch(e) {
		console.log(e);
		console.log('It is likely that you do not have the mysql node module installed.'
			+ '\nUse the command \'npm install mysql\' to install.');
        console.log('Starting bot without database functionality.');
		config.useDatabase = false;
	}

	//Connects to mysql server
	try {
		client = mysql.createClient(config.DBLOGIN);
	} catch(e) {
		console.log(e);
		console.log('Make sure that a mysql server instance is running and that the '
			+ 'username and password information in config.js are correct.');
        console.log('Starting bot without database functionality.');
		config.useDatabase = false;
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
		'INSERT INTO ' + config.DATABASE + '.' + config.SONG_TABLE +' '
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
			bot.speak(usersList[usertostep].name + ', please step down');
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
    if (enforcement.multipleSpotFFA && (djs.length < 4)) {
        return 'There\'s more than one spot open, so anyone can step up!';
    }
    
    //Case 3: Longer than FFA timeout
    if (enforcement.timerFFA && (djs.length < 5)
        && ((new Date()).getTime() - enforcementtimeout > (enforcement.timerFFATimeout * 1000))) {
        return 'It\'s been ' + enforcement.timerFFATimeout + ' seconds, so anyone can step up!';
    }
    
    //Case 4: DJ in queue
    //The bot will tell the user how much longer they must wait
    for (i in pastdjs) {
        if (pastdjs[i].id == userid) {
            if (enforcement.waitType == 'SONGS') {
                if (pastdjs[i].wait == 1) {
                    return (name + ', please wait one more song.');
                } else {
                    return (name + ', please wait another ' + pastdjs[i].wait + ' songs.');
                }
            } else if (enforcement.waitType == 'MINUTES') {
                var timeremaining = (enforcement.wait * 60000)
                    - (new Date().getTime() - pastdjs[i].wait.gettime());
                
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

//Handles chat commands
function handleCommand(name, userid, text) {

    switch(text) {
    //--------------------------------------
    // Command lists
    //--------------------------------------
    
    case '.sparklecommands':
        bot.speak('commands: .owner, .source, mystats, bonus, points, rules, ping, '
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
        if ((config.voteBonus == 'CHAT') && (bonuspoints.indexOf(name) == -1)) {
            bonuspoints.push(name);
            var target = getTarget();
            //If the target has been met, the bot will awesome
            if((bonuspoints.length >= target) && !bonusvote) {
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
        if (config.voteBonus == 'DICE' && !bonusvote && (currentsong.djid == userid)) {
            if (roll > 3) {
                bot.speak(name + ', you rolled a ' + roll + ', BONUS!');
                bot.vote('up');
            } else {
                bot.speak (name + ', you rolled a ' + roll +', bummer.');
            }
            bonusvote = true;
        } else {
            bot.speak(name + ', you rolled a ' + roll + '.');
        }
            
        break;
    
    //Checks the number of points cast for a song, as well as the number needed
    case 'points':
        if (config.voteBonus == 'VOTE') {
            bot.speak(bonusvotepoints + ' awesomes are needed for a bonus (currently '
                + currentsong.up + ').');
        } else if (config.voteBonus == 'CHAT') {
            var target = getTarget();
            bot.speak('Bonus points: ' + bonuspoints.length + '. Needed: ' + target + '.');
        } else if (config.voteBonus == 'DICE') {
            bot.speak('The DJ must roll a 4 or higher using /roll to get a bonus.');
        }
        break;
    
    //--------------------------------------
    // User commands
    //--------------------------------------
    
    //Outputs bot owner
    case '.owner':
        bot.speak(config.ownerResponse);
        break;
    
    //Outputs github url for xxMEOWxx
		case '.source':
        bot.speak('My source code is available at: http://git.io/meow');
        break;

    //Ping bot
    //Useful for users that use the iPhone app
    case 'ping':
        var rand = Math.random();
        if (rand < 0.5) {
            bot.speak('You\'re still here, ' + name + '!');
        } else {
            bot.speak('Still here, ' + name + '!');
        }
        break;
        
    //Reptar call!
    //Randomly picks a response in reptarCall()
    case 'reptar':
        reptarCall();
        break;
        
    //Bot freakout
    case 'reptar sucks':
        bot.speak('OH NO YOU DIDN\'T');
        setTimeout(function() {
            reptarCall();
        }, 1000);
        break;
        
    //Rules rehash since xxRAWRxx only responds to .rules
    //TODO: Generate rules based on bot options
		case 'rules':
			bot.speak('You can view the rules here: ' + enforcement.rulesLink);
			setTimeout(function() {
				bot.speak(enforcement.rules);
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
            bot.speak('hugs ' + name);
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
        
    //Returns information on the current song (for users without TT+)
    case 'songinfo':
        bot.speak(currentsong.song + ' (mid-song stats): Awesomes: ' + currentsong.up + '  Lames: '
            + currentsong.down + '  Snags: ' + currentsong.snags);
        break;
    
    //Lists the DJs that must wait before stepping up (as per room rules)
    case 'waitdjs':
        if (config.roomEnforce) {
            var pastdjnames = 'These DJs must wait before stepping up again: ';
            for (i in pastdjs) {
                if (usersList[pastdjs[i].id] != null) {
                    //TODO: Change to songs/minutes
                    pastdjnames += usersList[pastdjs[i].id].name
                        + ' (' + pastdjs[i].wait + ' songs), ';
                }
            }
            bot.speak(pastdjnames.substring(0, pastdjnames.length - 2));
        }
        break;
    
    //ICA inside joke
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
    
    //ICA inside joke
    case 'i enjoy that band.':
        setTimeout(function() {
            bot.speak('Me too!');
        }, 1200);
        break;
     
    //--------------------------------------
    // Queue/room enforcement commands
    //--------------------------------------   
    
    //Tells a DJ how many songs they have remaining
    case 'songsremaining':
    case '.remaining':
        if (config.roomEnforce) {
            var found = false;
            for (i in djs) {
                if (djs[i].id == userid) {
                    if (djs[i].remaining == 1) {
                        bot.speak(name + ', you have one song remaining.');
                    } else {
                        bot.speak(name + ', you have ' + djs[i].remaining + ' songs remaining.');
                    }
                    found = true;
                }
            }
        }
        if (!found) {
            bot.speak(name + ', you\'re not DJing...');
        }
        break;
        
    //Displays a list of how many songs each DJ has left
    case 'djinfo':
        if (config.roomEnforce) {
            var response = '';
            for (i in djs) {
                response += usersList[djs[i].id].name + ' (' + djs[i].remaining + ' songs left), ';
            }
            bot.speak(response.substring(0, response.length - 2));
        }
        break;
        
    //Tells a person who the next DJ to step down is
    case 'any spots opening soon?': 
    case 'anyone stepping down soon?':
        if (config.roomEnforce) {
            bot.speak('The next DJ to step down is ' + usersList[djs[0].id].name + ', who has '
                + djs[0].remaining + ' songs remaining.');
        }
        break;
    
        
    //--------------------------------------
    // Last.fm Queries
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
                        bot.speak(botstring.substring(0, botstring.length - 2));
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
        if (config.useDatabase) {
            client.query('SELECT @uniquesongs := count(*) FROM (select * from '
                + config.DATABASE + '.' + config.SONG_TABLE
                + ' group by concat(song, \' by \', artist)) as songtbl');
            client.query('SELECT @numdjs := count(*) FROM (select * from '
                + config.DATABASE + '.' + config.SONG_TABLE + ' group by djid) as djtable');
            client.query('SELECT @uniquesongs as uniquesongs, @numdjs as numdjs, '
                + 'count(*) as total, sum(up) as up, avg(up) as avgup, '
                + 'sum(down) as down, avg(down) as avgdown FROM ' + config.DATABASE
                + '.' + config.SONG_TABLE,
                function select(error, results, fields) {
                    bot.speak('In this room, '
                        + results[0]['total'] + ' songs ('
                        + results[0]['uniquesongs'] + ' unique) have been played by '
                        + results[0]['numdjs'] + ' DJs with a total of '
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
                + config.DATABASE + '.' + config.SONG_TABLE + ' ORDER BY UP DESC LIMIT 3',
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
            client.query('SELECT username, upvotes FROM (SELECT djid, sum(up) as upvotes '
                + 'FROM ' + config.DATABASE + '.' + config.SONG_TABLE
                + ' WHERE started > DATE_SUB(NOW(), INTERVAL '
                + '1 DAY) GROUP BY djid) a INNER JOIN (SELECT * FROM ' + config.DATABASE + '.' 
                + config.USER_TABLE
                + ' GROUP BY userid ORDER BY lastseen DESC) b ON a.djid = b.userid ORDER BY '
                + 'upvotes DESC LIMIT 3',
                function select(error, results, fields) {
                    var response = 'DJs with the most points in the last 24 hours: ';
                    for (i in results) {
                        response += results[i]['username'] + ': '
                            + results[i]['upvotes'] + ' awesomes.  ';
                    }
                    bot.speak(response);
            });
        }
        break;
    
    //Returns the three DJs with the most points logged in the songlist table
    case 'bestdjs':
        if (config.useDatabase) {
            client.query('SELECT username, upvotes FROM (SELECT djid, sum(up) AS upvotes '
                + 'FROM ' + config.DATABASE + '.' + config.SONG_TABLE
                + ' GROUP BY djid) a INNER JOIN (SELECT * '
                + 'FROM ' + config.DATABASE + '.' + config.USER_TABLE
                + ' GROUP BY userid ORDER BY lastseen DESC)'
                + ' b ON a.djid = b.userid ORDER BY upvotes DESC LIMIT 3',
                function select(error, results, fields) {
                    var response = 'The DJs with the most points accrued in this room: ';
                    for (i in results) {
                        response += results[i]['username'] + ': '
                            + results[i]['upvotes'] + ' points.  ';
                    }
                    bot.speak(response);
            });
        }
        break;
        
    //Returns the three DJs with the most points logged in the songlist table
    case 'worstdjs':
        if (config.useDatabase) {
            client.query('SELECT username, downvotes FROM (SELECT djid, sum(down) AS downvotes '
                + 'FROM ' + config.DATABASE + '.' + config.SONG_TABLE
                + ' GROUP BY djid) a INNER JOIN (SELECT * '
                + 'FROM ' + config.DATABASE + '.' + config.USER_TABLE
                + ' GROUP BY userid ORDER BY lastseen DESC)'
                + ' b ON a.djid = b.userid ORDER BY downvotes DESC LIMIT 3',
                function select(error, results, fields) {
                    var response = 'The DJs with the most lames accrued in this room: ';
                    for (i in results) {
                        response += results[i]['username'] + ': '
                            + results[i]['downvotes'] + ' lames.  ';
                    }
                    bot.speak(response);
            });
        }
        break;
        
    //Returns the three most-played songs in the songlist table
    case 'mostplayed':
        if (config.useDatabase) {
            client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, COUNT(*) AS COUNT FROM '
                + config.DATABASE + '.' + config.SONG_TABLE
                + ' GROUP BY CONCAT(song,\' by \',artist) ORDER BY COUNT(*) '
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
        
    //Returns the three most-snagged songs in the songlist table
    case 'mostsnagged':
        if (config.useDatabase) {
            client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, sum(snags) AS SNAGS FROM '
                + config.DATABASE + '.' + config.SONG_TABLE
                + ' GROUP BY CONCAT(song, \' by \', artist) ORDER BY SNAGS '
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
                + config.DATABASE + '.' + config.SONG_TABLE
                + ' GROUP BY CONCAT(song,\' by \',artist) ORDER BY SUM '
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
                + config.DATABASE + '.' + config.SONG_TABLE
                + ' GROUP BY CONCAT(song,\' by \',artist) ORDER BY SUM '
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
            //These two statements gets the user's rank (by awesomes) and sets it to @rank
            client.query('SET @rownum := 0');
            client.query('SELECT @rank := rank FROM (SELECT @rownum := @rownum + 1 AS '
                + 'rank, djid, POINTS FROM (SELECT djid, sum(up) as POINTS from '
                + config.DATABASE + '.' + config.SONG_TABLE
                + 'group by djid order by sum(up) desc) as test) as rank where '
                + 'djid like \'' + userid + '\'');
            //This statement grabs the rank from the previous query, and gets the total songs
            //played, total awesomes, lames, and averages
            client.query('SELECT @rank as rank, count(*) as total, sum(up) as up, avg(up) as avgup, '
                + 'sum(down) as down, avg(down) as avgdown '
                + 'FROM '+ config.DATABASE + '.' + config.SONG_TABLE + ' WHERE `djid` LIKE \''
                + userid + '\'',
                function select(error, results, fields) {
                    bot.speak (name + ', you have played ' + results[0]['total'] 
                        + ' songs in this room with a total of '
                        + results[0]['up'] + ' awesomes and ' + results[0]['down']
                        + ' lames (avg +' + new Number(results[0]['avgup']).toFixed(1) 
                        + '/-' + new Number(results[0]['avgdown']).toFixed(1)
                        + ') (Rank: ' + results[0]['rank'] + ')');
            });
        }
        break;
			
    //Returns the user's three most played songs
    case 'mymostplayed':
        if (config.useDatabase) {
            client.query('SELECT CONCAT(song,\' by \',artist) AS TRACK, COUNT(*) AS COUNT FROM '
                + config.DATABASE + '.' + config.SONG_TABLE + ' WHERE (djid = \''+ userid +'\')'
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
                + config.DATABASE + '.' + config.SONG_TABLE + ' WHERE (djid = \''+ userid +'\')'
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
                + config.DATABASE + '.' + config.SONG_TABLE + ' WHERE (djid = \''+ userid +'\')'
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
    //Returns the number of songs logged.
    case 'dbsize':
        if (config.useDatabase) {
            //var response = 'Songs logged';
            client.query('SELECT COUNT(STARTED) AS COUNT FROM ' + config.DATABASE + '.'
            + config.SONG_TABLE,
                function selectCb(error, results, fields) {
                    bot.speak('Songs logged: ' + results[0]['COUNT'] + ' songs.');
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
            bot.remDj(config.USERID);
        }
        break;

    //Bot freakout
    case 'oh my god meow':
        if (admincheck(userid)) {
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
        if (userid == config.MAINADMIN) {
            bot.speak('Shutting down...');
            bot.roomDeregister();
            process.exit(0);
        }
        
    }
    
    //--------------------------------------
    // Matching commands (regex)
    //--------------------------------------
    
    //Checks if a user can step up as per room rules or if they must wait
    if (text.toLowerCase().match(/^can i step up/) && config.roomEnforce) {
        bot.speak(canUserStep(name, userid));
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
	
    //Returns the nearest location for a specified business in a zip code.
    //Uses YQL
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
			client.query('SELECT username FROM ' + config.DATABASE + '.' + config.USER_TABLE
            + ' WHERE (userid like (SELECT '
                + 'userid FROM ' + config.DATABASE + '.' + config.USER_TABLE
                + ' WHERE username LIKE ? limit 1))',
                [text.substring(10)],
				function select(error, results, fields) {
						var response = 'Names I\'ve seen that user go by: ';
						for (i in results) {
							response += results[i]['username'] + ', ';
						}
						bot.speak(response.substring(0,response.length-2));
			});
		}
	}		
}

//Welcome message for TCP connection
bot.on('tcpConnect', function (socket) {
	socket.write('>> Welcome! Type a command or \'help\' to see a list of commands\n');
});

//TCP message handling
bot.on('tcpMessage', function (socket, msg) {
    console.log('TCP: \'' + msg + '\'');
    
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
    
    //Set config commands
    //Note: These do not permanently modify the config file and should only be
    //used for adjustments at runtime
    //TODO: Implement
    if (msg.toLowerCase().match(/^set /)) {
        msg = msg.substring(4);
        if (msg.match(/^logconsoleevents/)) {
            if (msg.substring(21) == 'true') {
                config.logconsoleevents = true;
                socket.write('>> Log Console Events: TRUE');
            } else {
                config.logconsoleevents = false;
                socket.write('>> Log Console Events: FALSE');
            }
        }
        if (msg.match(/^votebonus/)) {
            switch (msg.substring(14)) {
                case 'vote':
                    config.voteBonus = 'VOTE';
                    socket.write('>> Bonus mode: VOTE');
                    break;
                case 'dice':
                    config.votebonus = 'DICE';
                    socket.write('>> Bonus mode: DICE');
                    break;
                case 'chat':
                    config.voteBonus = 'CHAT';
                    socket.write('>> Bonus mode: CHAT');
                    break;
                case 'auto':
                    config.voteBonus = 'AUTO';
                    socket.write('>> Bonus mode: AUTO');
                    break;
                case 'none':
                    config.voteBonus = 'NONE';
                    socket.write('>> Bonus mode: NONE');
                    break;
            }
        }
        
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
        client.query('CREATE TABLE ' + config.USER_TABLE
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
	for (i in data.room.metadata.djs) {
        djs.push({id: data.room.metadata.djs[i], remaining: enforcement.songsToPlay});
    }
	
    //If the bonus flag is set to VOTE, find the number of awesomes needed for
    //the current song
	if (config.voteBonus == 'VOTE') {
		bonusvotepoints = getVoteTarget();
	}
    
    
	//Set bot's laptop type
	bot.modifyLaptop(config.LAPTOP);
	
	//Repopulates usersList array.
	var users = data.users;
	for (i in users) {
		var user = users[i];
		usersList[user.userid] = user;
	}
    
    //Adds all active users to the users table - updates lastseen if we've seen
    //them before, adds a new entry if they're new or have changed their username
    //since the last time we've seen them
    
    for (i in users) {
        client.query('INSERT INTO ' + config.DATABASE + '.' + config.USER_TABLE
        + ' (userid, username, lastseen)'
            + 'VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE lastseen = NOW()',
            [users[i].userid, users[i].name]);
    }
	
});

//Runs when a user updates their vote
//Updates current song data and logs vote in console
bot.on('update_votes', function (data) {
	//Update vote and listener count
	currentsong.up = data.room.metadata.upvotes;
	currentsong.down = data.room.metadata.downvotes;
	currentsong.listeners = data.room.metadata.listeners;
	
    //If the vote exceeds the bonus threshold and the bot's bonus mode
    //is set to VOTE, give a bonus point
	if ((config.voteBonus == 'VOTE') && !bonusvote) {
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
	
    //If the bonus flag is set to VOTE, find the number of awesomes needed
	if (config.voteBonus == 'VOTE') {
		bonusvotepoints = getVoteTarget();
	}

	//Greet user
	//Displays custom greetings for certain members
	if(config.welcomeUsers) {
        //Ignore ttdashboard bots
		if (!user.name.match(/^ttdashboard/)) {
			if (config.useDatabase) {
				client.query('SELECT greeting FROM ' + config.DATABASE + '.'
                    + config.HOLIDAY_TABLE + ' WHERE date LIKE CURDATE()',
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
    
    //Add user to user table
    client.query('INSERT INTO ' + config.DATABASE + '.' + config.USER_TABLE
    + ' (userid, username, lastseen)'
        + 'VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE lastseen = NOW()',
        [user.userid, user.name]);
});

//Runs when a user leaves the room
//Removes user from usersList, logs in console
bot.on('deregistered', function (data) {
	//Log in console
	if (config.logConsoleEvents) {
		console.log('Left room: ' + data.user[0].name);
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
	if (config.logConsoleEvents) {
		console.log('Chat [' + data.userid + ' ' + data.name +'] ' + data.text);
	}

	//Log in db (chatlog table)
	if (config.useDatabase) {
		client.query('INSERT INTO ' + config.DATABASE + '.' + config.CHAT_TABLE + ' '
			+ 'SET userid = ?, chat = ?, time = NOW()',
			[data.userid, data.text]);
	}

	//If it's a supported command, handle it	
    
    if (config.respond) {
        handleCommand(data.name, data.userid, data.text);
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

    //If a DJ that needed to step down hasn't by the end of the
    //next DJ's song, remove them immediately
    if (config.roomEnforce && !userstepped) {
        bot.remDj(usertostep);
    }
    
	//Used for room enforcement
    //Reduces the number of songs remaining for the current DJ by one
    if (config.roomEnforce) {
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
        if (enforcement.waitType == 'SONGS') {
            for (i in pastdjs) {
                pastdjs[i].wait--;
            }
        //If enforcement type is minutes, remove dj from pastdjs list if they can step up
        } else if (enforcement.waitType == 'MINUTES') {
            for (i in pastdjs) {
                //Checks if the user has waited long enough
                //enforcement.wait is converted from minutes to milliseconds
                if ((new Date().getTime() - pastdjs[i].wait.getTime()) > (enforcement.wait * 60000)) {
                    pastdjs.splice(i, 1);
                }
            }
        }
    }
    

	//Report song stats in chat
	if (config.reportSongStats) {
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
		} else if (config.roomEnforce) {
			enforceRoom();
		}
	}

	//Log in console
	if (config.logConsoleEvents) {
		console.log('Now Playing: '+currentsong.artist+' - '+currentsong.song);
	}
	
	//Reset bonus points
	bonusvote = false;
	bonuspoints = new Array();
	if (config.voteBonus == 'VOTE') {
		bonusvotepoints = getVoteTarget();
	} else if (config.voteBonus == 'AUTO') {
        var randomwait = Math.floor(Math.random() * 20) + 4;
        setTimeout(function() {
            bot.vote('up');
        }, randomwait * 1000);
    }
    
    //If the botSing is enabled, see if there are any lyrics for this song
    if (config.botSing) {
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
	if (config.logConsoleEvents) {
		console.log('Stepped down: '+ data.user[0].name + ' [' + data.user[0].userid + ']');
	}

	//Adds user to 'step down' vars
	//Used by enforceRoom()
	if (usertostep == data.user[0].userid) {
		userstepped = true;
		usertostep = null;
        
        if (config.roomEnforce) {
            //When a user steps, add them to the past djs array
            if (enforcement.waitType == 'SONGS') {
                pastdjs.push({id: data.user[0].userid, wait: enforcement.wait});
            } else if (enforcement.waitType == 'MINUTES') {
                pastdjs.push({id: data.user[0].userid, wait: new Date()});
            
            //If a DJ is now eligible to step up, remove them from the list
            for (i in pastdjs) {
                if (enforcement.waitType == 'SONGS') {
                    if (pastdjs[i].wait < 1) {
                        pastdjs.splice(i, 1);
                    }
                } else if (enforcement.waitType == 'MINUTES') {
                    if ((new Date().getTime() - pastdjs[i].wait.getTime()) > 
                        (enforcement.wait * 60000)) {
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
    if (config.roomEnforce && enforcement.multipleSpotFFA) {
        ffa = (djs.length < 4);
    }
});

//Runs when a dj steps up
//Logs in console
bot.on('add_dj', function(data) {
    
	//Log in console
	if (config.logConsoleEvents) {
		console.log('Stepped up: ' + data.user[0].name);
	}
    djs.push({id: data.user[0].userid, remaining: enforcement.songsToPlay});
    
    //See if this user is in the past djs list
    if (config.roomEnforce) {
    
        
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
            legalstepdown = ((waittime > (enforcement.timerFFATimeout * 1000))
                || (ffa && enforcement.multipleSpotFFA));
            
            if (legalstepdown) {
                for (i in pastdjs) {
                    if(pastdjs[i].id == data.user[0].userid) {
                        pastdjs.splice(i, 1);
                    }
                }
            } 
            else if ((enforcement.waitType == 'MINUTES') && (new Date().getTime() 
                - pastdjs[i].wait.getTime()) > (enforcement.wait * 60000)) {
                pastdjs.splice(i, 1);
            }
            else {
                //Remove DJ and warn
                bot.remDj(data.user[0].userid);
                for (i in pastdjs) {
                    if(pastdjs[i].id == data.user[0].userid) {
                        if (enforcement.waitType == 'SONGS') {
                        bot.speak(data.user[0].name + ', please wait ' + pastdjs[i].wait
                            + ' more songs or ' + (10 - Math.floor(waittime/1000))
                            + ' more seconds before DJing again.');
                        } else if (enforcement.waitType == 'MINUTES') {
                        var timeremaining = (enforcement.wait * 60000)
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
	if (config.voteBonus == 'CHAT') {
		bonuspoints.push(usersList[data.userid].name);
	}
	
	var target = getTarget();
	if((bonuspoints.length >= target) && !bonusvote && (config.voteBonus == 'CHAT')) {
		bot.speak('Bonus!');
		bot.vote('up');
		bot.snag();
		bonusvote = true;
	}	
});

bot.on('rem_moderator', function(data) {
    //If the bot admin was demodded, remod them
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
    
bot.on('update_user', function(data) {
    //Update user name in users table
    client.query('INSERT INTO ' + config.DATABASE + '.' + config.USER_TABLE
        + ' (userid, username, lastseen)'
            + 'VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE lastseen = NOW()',
            [data.userid, data.name]);
});