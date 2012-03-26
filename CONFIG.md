# config.json Setup

The config.js and enforcement.js files have been replaced with config.json. This new format allows 
the config file to quickly be retrieved and updated by the bot and helper applications. The description
section below explains each part of the new file.

Remember to rename your config file to config.json before running your bot!

##Description

	botinfo
		auth: Your bot's auth code.
		userid: Your bot's user id.
		botname: Your bot's short name (for commands like [name], pm me)
		To find your auth/userid: http://alaingilbert.github.com/Turntable-API/bookmarklet.html
	roomid: The room you want your bot to be placed in.
	admin: Your user id.
	database
		usedb: Set to true if you want to use a database, false otherwise.
		logchat: Set to true if you want to log chat, false otherwise.
		dbname: The name of your mysql database.
		tablenames
			song: The name of your song table.
			chat: The name of your chatlog table (name this even if you have logchat set to false)
			user: The name of your userlist table.
			holiday: The name of your holiday greeting table
		login
			user: Your bot's mysql login
			password: Your bot's mysql login password
	lastfm
		useapi: Set to true to use the last.fm service, false otherwise.
		lastfmkey: Your last.fm api key.
		Obtain an API key at http://www.last.fm/api/ or disable under Flags
	http
		usehttp: Set to true to enable HTTP connections, false otherwise.
		port: The port you want to listen on.
		host: The host you want to listen on (Use your computer's internal IP
			if you want to listen to external connections, localhost otherwise)
	tcp
		usetcp: Set to true to enable TCP connections, false otherwise.
		port: The port you want to listen on.
		host: The host you want to listen on (Use your computer's internal IP
			if you want to listen to external connections, localhost otherwise)
	responses
		respond: Set to true to have the bot respond to chat commands in chat, false otherwise
		reportsongstats: Set true to report song stats in chat after each song
		welcomeusers: Set true to welcome users as they join
		greeting: The greeting to display to joining users
		ownerresponse: The response to ".owner"
		sing: Have the bot sing portions of certain songs (add them in singalong.js)
		rules
			description: A description of your room's rules
			link: A link to your room's rules
	consolelog: Have the bot log events in the console
	bonusvote: The bot can awesome songs in one of five modes: NONE, VOTE, CHAT, DICE, AUTO.
	enforcement
		enforceroom: Set to true to have the bot enforce room rules
		waitlist: Set to true to have the bot enforce a waitlist/queue
		songstoplay: How many songs a user can play before they must step down
		stepuprules
			waittostepup: Toggles this section on/off
			waittype: MINUTES or SONGS
			length: How many minutes/songs a user must wait before stepping up again
		ffarules
			multiplespotffa: Make all spots free-for-all if there are 2+ DJ spots open
			timerffa: Make a spot free-for-all after a certain period of time
			timeout: The timer for timerffa in seconds
	maintenance
		autorejoin: Have the bot rejoin if booted