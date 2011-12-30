#Sparkle Turntable Bot

A customizable Turntable.fm bot.

This is still early in development, and some features are developed for/catered to the Indie/Classic Alt room, and may not apply to all rooms.

## Installation

To run the bot, you'll need the following installed:

* node.js (http://nodejs.org/)
* ttapi module for node.js (npm install ttapi)
* mysql module for node.js (npm install mysql)
* request module for node.js (npm install request)
* mysql (http://www.mysql.com/)

## Run

Before running, make sure the config.js file is filled out with your bot account's userid, auth code, the target room id, as well as the admin id info (the admins array can be scaled up or down depending on the number of admins you want to have full control of the bot). Additionally, ensure that a mysql server instance is running on your machine.

	node sparkle.js

## Features

The bot can: 

* Respond to a set of commands
* Auto-awesome songs
* Log vote, chat, song, room events in the console
* Report song stats in chat after each song
* Welcome users to the room
* Enforce a "one and down" room policy
* Log song statistics and chat entries in a mysql database

## Commands

* .sparklecommands
	Displays a list of commands supported by this bot.

* help
* commands
	Displays a list of commands available in the Indie/Classic Alt 1+Done room
	

* .users
	Displays a list of users in the room.

* CAN YOU FEEL IT!?
	Bot responds with "YES I CAN FEEL IT!"

* I enjoy that band.
	Bot responds with "Me too!"

* .owner
	Outputs a bot owner response configurable in config.js

* .source
	Provides a link to this GitHub project

* ping
	Responds to the issuing user that they are still in the room.

* reptar
	Responds with a variant of "rawr!"

* rules
	Displays the room rules (defaults to Indie/Classic Alt 1 & Done room rules).

* hugs xxMEOWxx
* hugs meow
	Hugs the issuing user back in chat.

* .similar
	Gives three similar songs to the one playing using last.fm's database.

* .similarartists
	Gives four similar artists to the one playing using last.fm's database.

* totalawesomes
	Returns the total number of awesomes logged by the bot.

* bestplays
	Returns the three song plays with the most awesomes logged by the bot.

* bestdjs
	Returns the three DJs with the most awesomes logged by the bot.

* worstdjs
	Returns the three DJs with the most lames logged by the bot.

* mostplayed
	Returns the three most-played songs logged by the bot.

* mostawesomed
	Returns the three most awesomed (cumulative) songs logged by the bot.

* mostlamed
	Returns the three most lamed (cumulative) songs logged by the bot.

* mymostplayed
	Returns the user's three most played songs.

* mymostawesomed
	Returns the user's three most awesomed (cumulative) songs logged by the bot.

* mymostlamed
	Returns the user's three most lamed (cumulative) songs logged by the bot.

* dbsize
	Returns the number of songs logged in the database and the size of the database.

* .weather [zip]
	Returns the current weather conditions at the specified zip code. This call uses the Yahoo! YQL service.
	Note: This service is rate-limited to 1,000 calls per hour.

* pastnames [name]
	Returns all names that the given user has gone by.
	Note: Currently, this call only registers names used by DJs that have played a song in the room.

## Admin Commands

These commands can only be performed by admins of the bot.

* .a
* awesome
	Tells the bot to awesome the current song.

* .l
* lame
	Tells the bot to lame the current song.

* pulldj
	Pulls a DJ off stage after their song.

* pullcurrent
	Pulls the current DJ off stage during their song.

* Meow, step up
	The bot steps up to DJ.

* Meow, step down
	The bot steps down from the decks.

* Meow, shut down
	The bot shuts down, terminating the process.