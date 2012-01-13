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

Before running, make sure the config.js file is filled out with your bot account's userid, auth code, the target room id, as well as the admin id info (the admins array can be scaled up or down depending on the number of admins you want to have full control of the bot). Additionally, ensure that a mysql server instance is running on your machine.

	node sparkle.js

## Features

The bot can: 

* Respond to a set of commands
* Awesome songs based on a "bonus point" system
* Log vote, chat, song, room events in the console
* Report song stats in chat after each song
* Welcome users to the room
* Enforce a "one and down" room policy
* Log song statistics and chat entries in a mysql database
* Receive instructions via TCP

## Commands

The bot will respond to these commands in chat in a Turntable.fm room.

* .sparklecommands - Displays a list of commands supported by this bot.

* help, commands - Displays a list of commands available in the Indie/Classic Alt 1+Done room	

* bonus - Adds a bonus point to a song. When a song has enough bonus points, the bot will awesome.
          Other phrases that add a bonus point: tromboner, meow, /bonus, good song, great song, nice pick,
          good pick, great pick, dance, /dance

* .users - Displays a list of users in the room.

* CAN YOU FEEL IT!? - Bot responds with "YES I CAN FEEL IT!"

* I enjoy that band. - Bot responds with "Me too!"

* .owner - Outputs a bot owner response configurable in config.js

* .source - Provides a link to this GitHub project

* ping - Responds to the issuing user that they are still in the room.

* reptar - Responds with a variant of "rawr!"

* rules - Displays the room rules (defaults to Indie/Classic Alt 1 & Done room rules).

* hugs meow - Hugs the issuing user back in chat.

* .similar - Gives three similar songs to the one playing using last.fm's database.

* .similarartists - Gives four similar artists to the one playing using last.fm's database.

* platforms - Returns the number of each type of computer (pc, linux, mac, chrome, iPhone) in the room.

* stats - Gives overall room statistics (number of songs played, number of awesomes/lames, averages).

* past24hours - Displays the 3 most-awesomed DJs in the past 24 hours in the room.

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

* .weather [zip] - Returns the current weather conditions at the specified zip code. This call uses the Yahoo! YQL service.
	Note: This service is rate-limited to 1,000 calls per hour.

* .find [zip] [thing] - Returns the nearest location of a matching business to the zip code. This call uses the Yahoo! YQL service.
        Note: This service is rate-limited to 1,000 calls per hour.

* pastnames [name] - Returns all names that the given user has gone by.
	Note: Currently, this call only registers names used by DJs that have played a song in the room.

## Admin Commands

These commands can only be performed by admins of the bot.

* .a
* awesome - Tells the bot to awesome the current song.

* .l
* lame - Tells the bot to lame the current song.

* pulldj - Pulls a DJ off stage after their song.

* pullcurrent - Pulls the current DJ off stage during their song.

* Meow, step up - The bot steps up to DJ.

* Meow, step down - The bot steps down from the decks.

* Meow, shut down - The bot shuts down, terminating the process.

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
