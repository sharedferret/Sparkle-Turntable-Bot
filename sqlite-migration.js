// Migration script from MySQL to SQLite
// author: sharedferret
// Usage: node sqlite-migration.js [mysql username] [mysql password] [database name] [mysql host]
// eg: node sqlite-migration.js root test sparkle-treehouse localhost
//
// After running, move the output file to db/sparkle.sqlite

var args = process.argv;

var fs = require('fs');
var sqlite3 = require('sqlite3').verbose();

var mysql = require('mysql');
var client = mysql.createConnection(
	{user:args[2], password:args[3], database:args[4], host:args[5]});

// Create new SQLite table
fs.openSync('sparkle.out.sqlite', 'w');
var db = new sqlite3.Database("sparkle.out.sqlite");

// Create tables in SQLite
//song table
db.run('CREATE TABLE IF NOT EXISTS songlist'
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
db.run('CREATE TABLE IF NOT EXISTS chatlog'
        + ' (id INTEGER PRIMARY KEY AUTOINCREMENT,'
        + ' userid VARCHAR(255),'
        + ' chat VARCHAR(255),'
        + ' time DATETIME)');
        
//user table
db.run('CREATE TABLE IF NOT EXISTS users'
        + ' (userid VARCHAR(255) PRIMARY KEY, '
        + 'username VARCHAR(255), '
        + 'lastseen DATETIME)');

//pastuser table
db.run('CREATE TABLE IF NOT EXISTS pastnames'
		+ ' (userid VARCHAR(255) PRIMARY KEY, '
		+ 'username VARCHAR(255), '
		+ 'lastseen DATETIME)');
	
//banned table
db.run('CREATE TABLE IF NOT EXISTS bannedusers'
        + ' (id INTEGER PRIMARY KEY AUTOINCREMENT, '
        + 'userid VARCHAR(255), '
        + 'banned_by VARCHAR(255), '
        + 'timestamp DATETIME)');

// CATFACTS table
db.run('CREATE TABLE IF NOT EXISTS CATFACTS'
		+ ' (id INTEGER PRIMARY KEY AUTOINCREMENT, '
		+ 'fact VARCHAR(255))');

// HOLIDAY_GREETINGS table
db.run('CREATE TABLE IF NOT EXISTS HOLIDAY_GREETINGS'
		+ ' (date DATETIME PRIMARY KEY, '
		+ 'greeting VARCHAR(255))');

// SCOTT_PILGRIM table
db.run('CREATE TABLE IF NOT EXISTS SCOTT_PILGRIM'
		+ ' (id INTEGER PRIMARY KEY AUTOINCREMENT, '
		+ 'quote VARCHAR(255))');

// Migrate each table
// songlist, chatlog, users, bannedusers, pastnames, CATFACTS,
// HOLIDAY_GREETINGS, SCOTT_PILGRIM

// SONGLIST
client.query('SELECT * FROM SONGLIST',
	function(error, results) {
	for (i in results) {
		db.run('INSERT INTO songlist (id, artist, song, djid, up, down, '
			+ 'listeners, started, snags, bonus) VALUES '
			+ '(?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
			[results[i]['id'], results[i]['artist'], results[i]['song'], results[i]['djid'], results[i]['up'],
			results[i]['down'], results[i]['listeners'], results[i]['started'], results[i]['snags'], results[i]['bonus']],
			function(err) {
				console.log(i + ' // ' + err);
		});
	}
});

// CHATLOG
client.query('SELECT * FROM CHATLOG',
	function(error, results) {
		for (i in results) {
			db.run('INSERT INTO chatlog (id, userid, chat, time) VALUES (?, ?, ?, ?)',
			[results[i]['id'], results[i]['userid'], results[i]['chat'], results[i]['time']],
				function(err) {
					console.log(i + ' // ' + err);
			});
		}
});

// PASTNAMES
client.query('SELECT * FROM USERS',
	function(error, results) {
		for (i in results) {
			db.run('INSERT INTO pastnames (userid, username, lastseen) VALUES (?, ?, ?)',
			[results[i]['userid'], results[i]['username'], results[i]['lastseen']],
				function(err) {
					console.log(i + ' // ' + err);
			});
		}
});

// BANNEDUSERS
client.query('SELECT * FROM BANNEDUSERS',
	function(error, results) {
		for (i in results) {
			db.run('INSERT INTO pastnames (id, userid, banned_by, timestamp) VALUES (?, ?, ?, ?)',
			[results[i]['id'], results[i]['userid'], results[i]['banned_by'], results[i]['timestamp']],
				function(err) {
					console.log(i + ' // ' + err);
			});
		}
});

// CATFACTS
client.query('SELECT * FROM CATFACTS',
	function(error, results) {
		for (i in results) {
			db.run('INSERT INTO CATFACTS (id, fact) VALUES (?, ?)',
			[results[i]['id'], results[i]['fact']],
				function(err) {
					console.log(i + ' // ' + err);
			});
		}
});

// HOLIDAY_GREETINGS
client.query('SELECT * FROM HOLIDAY_GREETINGS',
	function(error, results) {
		for (i in results) {
			db.run('INSERT INTO HOLIDAY_GREETINGS (date, greeting) VALUES (?, ?)',
			[results[i]['date'], results[i]['greeting']],
				function(err) {
					console.log(i + ' // ' + err);
			});
		}
});

// SCOTT_PILGRIM
client.query('SELECT * FROM SCOTT_PILGRIM',
	function(error, results) {
		for (i in results) {
			db.run('INSERT INTO SCOTT_PILGRIM (id, quote) VALUES (?, ?)',
			[results[i]['id'], results[i]['quote']],
				function(err) {
					console.log(i + ' // ' + err);
			});
		}
});

// USERS
client.query('SELECT * FROM USERS ORDER BY LASTSEEN ASC',
	function(error, results) {
		for (i in results) {
			db.run('REPLACE INTO users (userid, username, lastseen) VALUES (?, ?, ?)',
			[results[i]['userid'], results[i]['username'], results[i]['lastseen']],
				function(err) {
					console.log(i + ' // ' + err);
			});
		}
});
