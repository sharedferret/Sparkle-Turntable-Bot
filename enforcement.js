// roomenforcement.js
// This file will be used to set rules for room enforcement

exports.multipleSpotFFA = true; //Free-for-all when more than one spot is open
exports.timerFFA        = true; //Free-for-all if a spot is open for a while
exports.timerFFATimeout = 10;   //How long that spot needs to be open for FFA
exports.songsToPlay     = 1;    //How many songs a user can play before stepping down

exports.waitToStepUp    = true; //Does a user need to wait to step up again?
exports.waitType        = 'SONGS'; //or 'MINUTES'
exports.wait            = 4;    //Amount of time/minutes to wait

exports.waitlist        = false;

exports.rulesLink       = 'http://tinyurl.com/63hr2jl'; //Link to rules
exports.rules           = 'No queue, fastest finger, play one song and step down';
                                //Short description of rules
                                