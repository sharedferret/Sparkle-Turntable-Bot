#Sparkle Turntable Bot

A customizable Turntable.fm bot written in node.js utilizing [ttapi](https://github.com/alaingilbert/Turntable-API).

This project is still maintained, but I don't have a lot of time for development (so updates will probably be slow). If you have new features or bugfixes, please submit a pull request.

## Installation

    npm install sparklebot

Check out the [Get Started guide](https://github.com/sharedferret/Sparkle-Turntable-Bot/wiki/Get-Started) over on the project's [Wiki page](https://github.com/sharedferret/Sparkle-Turntable-Bot/wiki) for detailed installation instructions.

## Features

This bot is written in Node.JS and utilizes Alain Gilbert's Turntable API.

The bot can: 

* Respond to a set of commands in chat and through turntable's PM system
* Awesome songs based on various systems
* Log vote, chat, song, and room events in the console
* Report song stats in chat after each song
* Welcome users to the room via chat and PM
* Enforce room rules regarding song limits and timeouts before a person can DJ again
* Log song statistics and chat entries in a MySQL database
* Receive and respond to commands via a HTTP RESTful API
* Manage a waitlist/queue for a room
