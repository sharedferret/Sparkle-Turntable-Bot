#Sparkle Turntable Bot

A customizable Turntable.fm bot.

This is still early in development, and some features are developed for/catered to the Indie/Classic Alt room, and may not apply to all rooms.

## Installation

To run the bot, you'll need the following installed:

* node.js (http://nodejs.org/)
* ttapi module for node.js (npm install ttapi)
* request module for node.js (npm install request)
* (Optional) mysql module for node.js (npm install mysql)
* (Optional) mysql server instance (http://www.mysql.com/)

## Run

* Fill out the config.json file (instructions [here](Sparkle-Turntable-Bot/blob/master/CONFIG.md)) with your bot account's user ID, auth code, target room ID, admin ID info, and other options
  - If you do not plan to use the database features or do not want to install mysql, set database.usedb to FALSE
  - If you want your bot to enforce room rules, fill out the enforcement section; otherwise, set enforcement.enforceroom to FALSE
* If you plan on using a database, create new tables using the .sql files provided (the songlist, userlist, and chatlog tables will be created for you)

Finally, run your bot using the following command in a console/terminal/command prompt:

	node sparkle.js

Use this command to run your bot in the background:

	nohup node sparkle.js &

A keepalive shell script is included to allow the bot to run permanently. (Note: if you use this, do watch the nohup.out file to ensure the bot is continuing to work properly)

	nohup ./sparkle.sh &
	

## Features

The bot can: 

* Respond to a set of commands in chat and through turntable's new PM system
* Awesome songs based on various systems
* Log vote, chat, song, room events in the console
* Report song stats in chat after each song
* Welcome users to the room
* Enforce room rules regarding song limits and timeouts before a person can DJ again
* Log song statistics and chat entries in a mysql database
* Receive and respond to instructions via TCP

### Song Awesoming

The bot can awesome songs based on one of four modes. These modes can be set in the config.js file prior to running the bot.

* NONE: The bot will never awesome
* VOTE: The bot awesomes when a vote threshold is met (# of awesomes)
* CHAT: The bot awesomes when enough people say a bonus phrase
* DICE: The bot awesomes if the current DJ rolls a 4 or higher using /roll
* AUTO: The bot auto-awesomes

### Room enforcement

The bot can enforce a variety of room rules, including:

* How many songs a DJ can play before they must step down
* How long a DJ must wait (songs or time) before stepping up again
* Whether those DJs can step up again if multiple DJ spots are open
* Whether those DJs can step up again if a spot is open for a certain amount of time

### Database

The bot uses a mysql database to log/retrieve some information. The bot can log song data, user information (id/name), and keep a chatlog.
This project includes several .sql files (currently, these files contain a list of cat facts and holidays). If you enable the useDatabase flag, be sure to create new tables in your bot's database using these .sql files.

### Planned

* A waitlist implementation
* DJ timers for AFK monitoring
* Graphical frontend to set config options
* Fixing time-based wait-to-step-up rules so they actually work

## Commands

The bot will respond to these commands in chat in a Turntable.fm room.

### User commands

* .sparklecommands - Displays a list of commands supported by this bot.

* help, commands - Displays a list of commands available in the Indie/Classic Alt 1+Done room	

* meow, pm me - The bot will send you a Private Message so you can send private requests to it

* bonus - Adds a bonus point to a song (if enabled). When a song has enough bonus points, the bot will awesome.
          Other phrases that add a bonus point: tromboner, meow, /bonus, good song, great song, nice pick,
          good pick, great pick, dance, /dance

* points - Displays what is needed for the bot to awesome the song (number of awesomes, points, etc).

* /roll - Dice roll

* CAN YOU FEEL IT!? - Bot responds with "YES I CAN FEEL IT!"

* I enjoy that band. - Bot responds with "Me too!"

* .owner - Outputs a bot owner response configurable in config.js

* .source - Provides a link to this GitHub project

* ping - Responds to the issuing user that they are still in the room.

* reptar - Responds with a variant of "rawr!"

* rules - Displays the room rules (defaults to Indie/Classic Alt 1 & Done room rules).

* hugs meow - Hugs the issuing user back in chat.

* platforms - Lists the number of users on each platform (PC/Mac/Linux/iPhone/Chrome) in the room.

* songinfo - Displays mid-song stats (awesomes, lames, snags). Useful for iPhone users.

* .similar - Gives three similar songs to the one playing using last.fm's database.

* .similarartists - Gives four similar artists to the one playing using last.fm's database.

* platforms - Returns the number of each type of computer (pc, linux, mac, chrome, iPhone) in the room.

### Room enforcement commands

* waitdjs - Displays a list of DJs that must wait before stepping up again, and how long they must wait.

* .remaining, songsremaining - Shows a DJ how many songs they have remaining before they must step down.

* djinfo - Displays a list of current DJs and how many songs they have remaining before they must step down.

* any spots opening soon?, anyone stepping down soon? - Displays the next DJ to step down, and how many songs they have remaining.

### User database queries

* stats - Gives overall room statistics (number of songs played, number of awesomes/lames, averages).

* past24hours - Displays the 3 most-awesomed DJs in the past 24 hours in the room.

* mypast24hours - Displays your stats in the room over the past 24 hours.

* bestplays - Returns the three song plays with the most awesomes logged by the bot.

* bestdjs - Returns the three DJs with the most awesomes logged by the bot.

* worstdjs - Returns the three DJs with the most lames logged by the bot.

* mostplayed - Returns the three most-played songs logged by the bot.

* mostsnagged - Returns the three songs with the most cumulative snags.

* mostawesomed - Returns the three most awesomed (cumulative) songs logged by the bot.

* mostlamed - Returns the three most lamed (cumulative) songs logged by the bot.

* mystats - Returns the user's stats in the room (songs played, awesomes, lames, averages)

* mymostplayed - Returns the user's three most played songs.

* mymostawesomed - Returns the user's three most awesomed (cumulative) songs logged by the bot.

* mymostlamed - Returns the user's three most lamed (cumulative) songs logged by the bot.

* dbsize - Returns the number of songs logged in the database.

* catfact, .catfact, catfacts - Returns a cat fact!

### Commands with parameters

* .weather [zip] - Returns the current weather conditions at the specified zip code. This call uses the Yahoo! YQL service.
	Note: This service is rate-limited to 1,000 calls per hour.

* .find [zip] [thing] - Returns the nearest location of a matching business to the zip code. This call uses the Yahoo! YQL service.
        Note: This service is rate-limited to 1,000 calls per hour.

* pastnames [name] - Returns all names that the given user has gone by.
	Note: Currently, this call only registers names used by DJs that have played a song in the room.

## Admin Commands

These commands can only be performed by admins of the bot.

* .a - Tells the bot to awesome the current song.

* .l - Tells the bot to lame the current song.

* pulldj - Pulls a DJ off stage after their song.

* pullcurrent - Pulls the current DJ off stage during their song.

* meow, step up - The bot steps up to DJ.

* meow, step down - The bot steps down from the decks.

* meow, shut down - The bot shuts down, terminating the process.

* meow, restart - If running through the .sh script, the bot will restart. Otherwise, the bot will shut down.

## TCP Commands

These commands can be performed via TCP access to the bot.

* speak [text] - The bot speaks the text in chat.

* boot [userid] - Boots a user from the room.

* help - Displays a list of commands.

* online - Displays the number of people in the room.

* .a - The bot will awesome the current song.

* .l - The bot will lame the current song.

* step up - The bot will step up to DJ.

* step down - The bot will step down from the decks.

* pulldj - If a user has played a song and has not yet stepped down, this command will remove them from the decks.

* exit - Ends the TCP connection.

* shutdown - Initiates the bot's shutdown sequence.

## Help

If you have a nontrivial question (please don't ask me how to install node.js or the MySQL community server, for example), feel free to contact me. I'm usually hanging out in the [Indie/Classic Alt 1+Done room](http://turntable.fm/indieclassic_alternative_1_done) on Turntable.