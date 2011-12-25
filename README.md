#Sparkle Turntable Bot

A customizable Turntable.fm bot.

## Installation

To run the bot, you'll need the following installed:

* node.js (http://nodejs.org/)
* ttapi module for node.js
	npm install ttapi
* mysql module for node.js
	npm install mysql
* mysql (http://www.mysql.com/)

## Run

Before running, make sure the config.js file is filled out with your bot account's userid, auth code, the target room id, as well as the admin id info (the admins array can be scaled up or down depending on the number of admins you want to have full control of the bot). Additionally, ensure that a mysql server instance is running on your machine.

	node sparkle.js
