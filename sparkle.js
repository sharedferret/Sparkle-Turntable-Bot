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
var args = process.argv;
global.package = require('./package.json');

global.fs = require('fs');
global.url = require('url'); 
global.async = require('async');

global.sqlite3;
global.memdb;
global.db;

global.Bot;
global.bot;
global.config;
global.request;
global.parser;
global.singalong;
global.uptime = new Date();
global.commands = new Array();              //Array of command handlers
global.httpcommands = new Array();          //Array of HTTP handlers
global.events = require('./events.js');     //Event handlers

initializeModules();

//Room information
global.usersList = { };                     //A list of users in the room
global.djs = new Array();                   //A list of current DJs
global.partialdjs = new Array();            //A list of DJs who have stepped down before their
                                            //allotted # of songs

//Room enforcement variables
global.usertostep = null;                     //The userid of the DJ to step down
global.userstepped = false;            //A flag denoting if that user has stepped down
global.enforcementtimeout = new Date();//The time that the user stepped down
global.ffa = false;                    //A flag denoting if free-for-all mode is active
global.legalstepdown = true;           //A flag denoting if a user stepped up legally
global.pastdjs = new Array();          //An array of the past 4 DJs
global.waitlist = new Array();
global.moderators = new Array();

//Used for bonus awesoming
global.bonuspoints = new Array();      //An array of DJs wanting the bot to bonus
global.bonusvote = false;              //A flag denoting if the bot has bonus'd a song
global.bonusvotepoints = 0;            //The number of awesomes needed for the bot to awesome

//Current song info
global.currentsong = {
    artist: null,
    song: null,
    djname: null,
    djid: null,
    up: 0,
    down: 0,
    listeners: 0,
    snags: 0,
    id: null };
    
// Event listeners

bot.on('ready', events.readyEventHandler);

bot.on('roomChanged', events.roomChangedEventHandler);

bot.on('update_votes', events.updateVoteEventHandler);

bot.on('registered', events.registeredEventHandler);

bot.on('deregistered', events.deregisteredEventHandler);

bot.on('speak', events.speakEventHandler);

bot.on('nosong', events.noSongEventHandler);

bot.on('endsong', events.endSongEventHandler);

bot.on('newsong', events.newSongEventHandler);

bot.on('rem_dj', events.remDjEventHandler);

bot.on('add_dj', events.addDjEventHandler);

bot.on('snagged', events.snagEventHandler);

bot.on('booted_user', events.bootedUserEventHandler);

bot.on('pmmed', events.pmEventHandler); 

bot.on('update_user', events.updateUserEventHandler);

bot.on('new_moderator', events.newModeratorEventHandler);

bot.on('rem_moderator', events.removeModeratorEventHandler);

bot.on('httpRequest', events.httpRequestEventHandler);

process.on('message', function(data) {
    if (data.deliverCommand != null) {
        bot.speak(data.deliverCommand);
    }
});

// Functions

function initializeModules () {
    //Creates the bot listener
    try {
        Bot = require('ttapi');
    } catch(e) {
        console.log(e);
        console.log('It is likely that you do not have the ttapi node module installed.'
            + '\nUse the command \'npm install ttapi\' to install.');
        process.exit(33);
    }

    //Creates the config object
    try {
        if (args[2] == '-c' && args[3] != null) {
            config = JSON.parse(fs.readFileSync(args[3], 'ascii'));
        } else {
            config = JSON.parse(fs.readFileSync('config.json', 'ascii'));
        }
    } catch(e) {
        //todo: update error handling
        console.log(e);
        console.log('Error loading config.json. Check that your config file exists and is valid JSON.');
        process.exit(33);
    }
    
    bot = new Bot(config.botinfo.auth, config.botinfo.userid, config.roomid);

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

    //Creates sqlite db object
    if (config.database.usedb) {
        try {
			sqlite3 = require('sqlite3').verbose();
            db = new sqlite3.Database("db/sparkle.sqlite");
			memdb = new sqlite3.Database(":memory:");
        } catch(e) {
            console.log(e);
            console.log('It is likely that you do not have the sqlite3 node module installed.'
                + '\nUse the command \'npm install sqlite3\' to install.');
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
        process.exit(33);
    }
    
    try {
        xml2js = require('xml2js');
        parser = new xml2js.Parser();
    } catch(e) {
        console.log(e);
        console.log('It is likely that you do not have the xml2js node module installed.'
            + '\nUse the command \'npm install xml2js\' to install.');
        process.exit(33);
    }

    //Create HTTP listeners
    if (config.http.usehttp) {
        bot.listen(config.http.port, config.http.host);
    }
    
    //Load commands
    try {
        var filenames = fs.readdirSync('./commands');
        for (i in filenames) {
            var command = require('./commands/' + filenames[i]);
            commands.push({name: command.name, handler: command.handler, hidden: command.hidden,
                enabled: command.enabled, matchStart: command.matchStart});
        }
    } catch (e) {
        console.log('Unable to load command: ', e);
    }
    
    //Load http commands
    try {
        var filenames = fs.readdirSync('./api');
        for (i in filenames) {
            var command = require('./api/' + filenames[i]);
            httpcommands.push({name: command.name, handler: command.handler, hidden: command.hidden,
                enabled: command.enabled});
        }
    } catch (e) {
        //
    }
}

//Sets up the database
global.setUpDatabase = function() {

	//song table
	db.run('CREATE TABLE IF NOT EXISTS ' + config.database.tablenames.song
        + ' (id INTEGER PRIMARY KEY AUTOINCREMENT,'
        + ' artist VARCHAR(255),'
        + ' song VARCHAR(255),'
        + ' djid VARCHAR(255),'
        + ' up INTEGER,' 
		+ ' down INTEGER,'
        + ' listeners INTEGER,'
        + ' started DATETIME,'
        + ' snags INTEGER,'
        + ' bonus INTEGER)');

    //chat table
    db.run('CREATE TABLE IF NOT EXISTS ' + config.database.tablenames.chat
        + ' (id INTEGER PRIMARY KEY AUTOINCREMENT,'
        + ' userid VARCHAR(255),'
        + ' chat VARCHAR(255),'
        + ' time DATETIME)');
        
    //user table
    db.run('CREATE TABLE IF NOT EXISTS ' + config.database.tablenames.user
        + ' (userid VARCHAR(255) PRIMARY KEY, '
        + 'username VARCHAR(255), '
        + 'lastseen DATETIME)');

	//pastuser table
    db.run('CREATE TABLE IF NOT EXISTS ' + config.database.tablenames.pastuser
		+ ' (userid VARCHAR(255) PRIMARY KEY, '
		+ 'username VARCHAR(255))');
	
	//banned table
    db.run('CREATE TABLE IF NOT EXISTS ' + config.database.tablenames.banned
        + ' (id INTEGER PRIMARY KEY AUTOINCREMENT, '
        + 'userid VARCHAR(255), '
        + 'banned_by VARCHAR(255), '
        + 'timestamp DATETIME)');
}

global.populateSongData = function(data) {
    currentsong = data.room.metadata.current_song;
    currentsong.artist = data.room.metadata.current_song.metadata.artist;
    currentsong.song = data.room.metadata.current_song.metadata.song;
    currentsong.up = data.room.metadata.upvotes;
    currentsong.down = data.room.metadata.downvotes;
    currentsong.listeners = data.room.metadata.listeners;
    currentsong.started = data.room.metadata.current_song.starttime;
    currentsong.snags = 0;
}

//Format: output({text: [required], destination: [required],
//                userid: [required for PM], format: [optional]});
global.output = function (data) {
    if (data.destination == 'speak') {
        bot.speak(data.text);
    } else if (data.destination == 'pm') {
        bot.pm(data.text, data.userid);
    } else if (data.destination == 'http') {
        response.writeHead(200, {'Content-Type': 'text/plain'});
        if (data.format == 'json') {
            response.end(JSON.stringify(data.text));
        } else {
            response.end(data.text);
        }
    }
}

//Checks if the user id is present in the admin list. Authentication
//for admin-only privileges.
global.admincheck = function (userid) {
    return (userid === config.admin ||
        moderators.some(function(moderatorid) {
            return moderatorid === userid;
        }));
}

//TODO: Implement
global.checkAuth = function (givenKey) {
    return false;
}

global.checkAFK = function() {
    //
}

//The bot will respond to a Reptar call with a variant of 'rawr!' based on
//the result from a RNG.
global.reptarCall = function (source) {
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
global.addToDb = function (data) {
    db.run(
        'INSERT INTO ' + config.database.tablenames.song +' '
        + '(artist, song, djid, up, down, listeners, started, snags, bonus) '
		+ 'VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)',
        [currentsong.artist, 
        currentsong.song,  
        currentsong.djid, 
        currentsong.up, 
        currentsong.down, 
        currentsong.listeners,
        currentsong.snags,
        bonuspoints.length]);
}

global.welcomeUser = function (name, id) {
    //Ignore ttstats bots
    if (!name.match(/^ttstats/)) {
        if (id == '4f5628b9a3f7515810008122') {
            bot.speak(':cat: <3 :wolf:');
        }
        else if (id == '4df0443f4fe7d0631905d6a8') {
            bot.speak(':cat: <3 ' + name);
        }
        else if (config.database.usedb) {
            db.all('SELECT greeting, date(CURRENT_TIMESTAMP) as date FROM '
                + config.database.tablenames.holiday + ' WHERE date LIKE date(CURRENT_TIMESTAMP)',
                function cbfunc(error, results, fields) {
                    if (results != null && results[0] != null) {
                        bot.speak(results[0]['greeting'] + ', ' + name + '!');
                    } else {
                        bot.speak(config.responses.greeting + name + '!');
                    }
            });
        } else {
            bot.speak(config.responses.greeting + name + '!');
        }
    }
}

//Reminds a user that has just played a song to step down, and pulls them
//off stage if they do not step down.
global.enforceRoom = function () {
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

global.reducePastDJCounts = function (djid) {
    //First, decrement last DJ count by 1. Set to remove if they need to step down
    for (i in djs) {
        if (djs[i].id == djid) {
            djs[i].remaining--;
            if (djs[i].remaining <= 0) {
                userstepped = false;
                usertostep = djid;
            }
        }
    }
    
    //Reduces past DJ counts and removes from past dj list if necessary
    if (config.enforcement.stepuprules.waittostepup) {
    
        //Decrease count in pastdjs list by 1
        if (config.enforcement.stepuprules.waittype == 'SONGS') {
            for (i in pastdjs) {
                pastdjs[i].wait--;
            }
            
            //Remove if they're done waiting
            for (i in pastdjs) {
                if (pastdjs[i].wait < 1) {
                    pastdjs.splice(i, 1);
                }
            }
        }
        else if (config.enforcement.stepuprules.waittype == 'MINUTES') {
            //tbh nothing should be here
        }
    }
}

//Adds the user to the past DJ list
global.addToPastDJList = function (userid) {
    if (config.enforcement.stepuprules.waittype == 'SONGS') {
        pastdjs.push({id: userid, wait: config.enforcement.stepuprules.length});
    }
    else if (config.enforcement.stepuprules.waittype == 'MINUTES') {
        var pushdate = new Date();
        pastdjs.push({id: userid, wait: pushdate});
        
        //I don't think this works yet, but it's how i should remove people
        var fnc = function(y) {
        setTimeout(function() {
            for (i in pastdjs) {
                if ((new Date().getTime() - pastdjs[i].wait.getTime()) > 
                    (config.enforcement.stepuprules.length * 60000)
                    && (pushdate == pastdjs[i].wait)) {
                    pastdjs.splice(i, 1);
                }
            }
        }, config.enforcement.stepuprules.length * 60000);
        }(pushdate);
    }
}

global.addToWaitlist = function (userid, name, source) {
    //Case 1: User is DJing already
    for (i in djs) {
        if (djs[i].id == userid) {
            output({text: 'You\'re currently DJing!', destination: source, userid: userid});
            return false;
        }
    }
    
    //Case 2: User is already in the waitlist
    for (i in waitlist) {
        if (waitlist[i].id == userid) {
            output({text: 'You\'re already on the list, ' + name + '.', destination: source, 
                userid: userid});
            return false;
        }
    }
    
    //Otherwise, add to waitlist
    waitlist.push({name: name, id: userid});
    output({text: 'You\'ve been added to the queue. Your position is ' + waitlist.length + '.',
        destination: source, userid: userid});
    if (waitlist.length == 1 && djs.length < 5) {
        announceNextPersonOnWaitlist();
    }
    return true;
}

global.checkStepup = function (userid, name) {
    //Get time elapsed between previous dj stepping down and this dj stepping up
    var waittime = new Date().getTime() - enforcementtimeout.getTime();
    for (i in pastdjs) {
        if (pastdjs[i].id == userid) {
            //if the user waited longer than the FFA timeout or it's a free-for-all,
            //remove from list. Else, remove dj and warn
            
            if (config.enforcement.ffarules.multiplespotffa && ffa) {
                legalstepdown = true;
            }
            else if (config.enforcement.ffarules.timerffa) {
                legalstepdown = (waittime > (config.enforcement.ffarules.timeout * 1000));
            }
            else {
                legalstepdown = false;
            }
            
            if (legalstepdown) {
                for (i in pastdjs) {
                    if (pastdjs[i].id == userid) {
                        pastdjs.splice(i, 1);
                    }
                }
            }
            else {
                bot.remDj(userid);
                
                if (config.enforcement.stepuprules.waittype == 'SONGS') {
                    bot.speak(name + ', please wait ' + pastdjs[i].wait
                        + ' more songs or '
                        + (config.enforcement.ffarules.timeout - Math.floor(waittime/1000))
                        + ' more seconds before DJing again.');
                }
                else if (config.enforcement.stepuprules.waittype == 'MINUTES') {
                    var timeremaining = (config.enforcement.stepuprules.length * 60000)
                        - (new Date().getTime() - pastdjs[i].wait.getTime());
                    
                    bot.speak(name + ', please wait ' + Math.floor(timeremaining / 60000)
                        + ' minutes and ' + Math.floor((timeremaining % 60000) / 1000)
                        + ' seconds before DJing again.');
                }
            }       
        }
    }
}

global.checkWaitlist = function (userid, name) {
    if (waitlist.length > 0) {
        //If they're not first, remove/warn
        if (waitlist[0].id == userid) {
            waitlist.shift();
            if (djs.length < 5) {
                announceNextPersonOnWaitlist();
            }
            return true;
        }
        bot.remDj(userid);
        bot.speak(name + ', you\'re not next on the waitlist. Please let '
            + waitlist[0].name + ' up.');
        legalstepdown = false;
        return false;
    }
    return true;
}

global.announceNextPersonOnWaitlist = function () {
    if (waitlist.length > 0 && djs.length < 5) {
        bot.speak('The next spot is for @' + waitlist[0].name + '! You\'ve got 30 seconds to step up!');
        output({text: 'Hey! This spot is yours, so go ahead and step up!', destination: 'pm',
            userid: waitlist[0].id});
            
        
        var waitingfor = waitlist[0].id;
        setTimeout(function() {
            //See if user has stepped up, if not, call "next" function
            if (waitlist.length > 0 && waitlist[0].id == waitingfor) {
                waitlist.shift();
                announceNextPersonOnWaitlist();
            }
        }, 30000);
    }
}

//Calculates the target number of bonus votes needed for bot to awesome
global.getTarget = function() {
    if (currentsong.listeners < 11) {
        return 3;
    } else if (currentsong.listeners < 21) {
        return 4;
    }
    return 5 + Math.floor((currentsong.listeners - 20) / 20);
}

//Calculates the target number of awesomes needed for the bot to awesome
global.getVoteTarget = function() {
    if (currentsong.listeners <= 3) {
        return 2;
    }
    //Trendline on the average number of awesomes in the 1+Done room
    return Math.ceil(Math.pow(1.1383*(currentsong.listeners - 3), 0.6176));
}

//Checks if the user can step up
//TODO: Change this to support waitlists (when I implement them)
global.canUserStep = function (name, userid) {
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

//Handles chat commands
global.handleCommand = function (name, userid, text, source) {
    for (i in commands) {
        if (commands[i].matchStart && (text.indexOf(commands[i].name) == 0)) {
            commands[i].handler({name: name, userid: userid, text: text, source: source});
            break;
        } else if (commands[i].name == text) {
            commands[i].handler({name: name, userid: userid, text: text, source: source});
            break;
        }
    }
    
    //--------------------------------------
    // Matching commands (regex)
    //--------------------------------------
    
    //Shuts down bot (only the main admin can run this)
    //Disconnects from room, exits process.
    if (text.toLowerCase() == (config.botinfo.botname + ', shut down')) {
        if (userid == config.admin) {
            bot.speak('Shutting down...');
            bot.roomDeregister();
            process.exit(0);
        }
    }
    
    //Shuts down bot (only the main admin can run this)
    //Disconnects from room, exits process.
    if (text.toLowerCase() == (config.botinfo.botname + ', go away')) {
        if (userid == config.admin) {
            bot.speak('Shutting down...');
            bot.roomDeregister();
            process.exit(33);
        }
    }
    
    if (text.toLowerCase() == (config.botinfo.botname + ', come back later')) {
        if (userid == config.admin) {
            bot.speak('I\'ll be back in ten minutes!');
            bot.roomDeregister();
            process.exit(34);
        }
    }
    
    //Have the bot step up to DJ
    if (text.toLowerCase() == (config.botinfo.botname + ', step up')) {
        if (admincheck(userid)) {
            bot.addDj();
        }
    }
    
    //Have the bot jump off the decks
    if (text.toLowerCase() == (config.botinfo.botname + ', step down')) {
        if (admincheck(userid)) {
            bot.remDj(config.botinfo.userid);
        }
    }
    
    //Hug bot
    if (text.toLowerCase() == ('hugs ' + config.botinfo.botname) || text.toLowerCase() == 'hugs meow') {
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
    }
    
    //Sends a PM to the user
    if (text.toLowerCase() == (config.botinfo.botname + ', pm me')) {
        if (source == 'speak') {
            bot.pm('Hey there! Type "commands" for a list of commands.', userid);
        } else if (source == 'pm') {
            bot.pm('But... you PM\'d me that. Do you think I\'m stupid? >:T', userid);
        }
    }    
}
