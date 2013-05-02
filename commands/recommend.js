//Ping bot
//Useful for users that use the iPhone app
var http  = require("http");

exports.name = 'recommend';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = true;

function encodeOptions(data) {
   var ret = [];
   for (var d in data)
      ret.push(encodeURIComponent(d) + "=" + encodeURIComponent(data[d]));
   return ret.join("&");
}

function makeRequestWithOptions(pathStr, options, callback) {
    var url = pathStr + "/?" + encodeOptions(options);
    console.log("Calling url " + url);
    var options = {
      hostname: 'api.beatport.com',
      port: 80,
      path: url,
      method: 'GET'
    };
    
    var req = http.request(options, function(res) {
        var result = '';
        res.on('data', function(d) {
            result += d;
          });
      
        res.on('end', function() {
            callback(result);
      });
    });
    req.end();
    req.on('error', function(e) {
      console.error(e);
    });
}

exports.handler = function(data) {
    var botSay = function(txt) {
        output({text: txt, destination: data.source, userid: data.userid});    
    }
    var processMostPopular = function(result) {
        try {
             var data = JSON.parse(result);
             var songs = data.results;
             // Random picker with a modified PDF to prefer songs at the top
             var N = songs.length ;
             var i = parseInt(Math.pow(Math.random(), 0.95) * N);
             var artists = songs[i].artists, artists2 = [];
             for (var j=0; j < artists.length; j++) {
                 artists2.push(artists[j].name);
             }
             var response = "I'd recommend '" + songs[i].title + "' by '" + artists2.join(", ") + "'. Checkout a sample here " + songs[i].sampleUrl;
             botSay(response);
         } catch(e) {
            console.log("Invalid JSON from beatport :(");
         }
    };
    
    
    var parts = data.text.split(" ");
    console.log("Parts are " + parts);
    var num = parseInt(parts[2]);
    if (isNaN(num)) {
        num = 10;
    } else {
        num = Math.min(num, 50);
    }
    console.log("Number is " + num);
    console.log(parts);
    var pathStr = '/catalog/3/most-popular'; 
    if (parts[1] && parts[1] != ".") {
        makeRequestWithOptions("/catalog/3/genres", {}, function(result) {
           var genreMaps = {}
           var genres = [];
           JSON.parse(result)['results'].forEach(function(g, i) {
             var genreId = g['id'],
                 genreName = g['slug'];
              genreMaps[genreName] = genreId;
              genres.push(genreName);
           });
           
           if (genreMaps[parts[1]]) {
               makeRequestWithOptions(pathStr + "/genre", {'perPage': num, 'id': genreMaps[parts[1]]}, processMostPopular);
           } else {
               botSay("Can't understand genre " + parts[1] + ". Try any from " +  genres.join(", "));
           }
        });
    } else {
        makeRequestWithOptions(pathStr, {'perPage': num}, processMostPopular);
    }    
}
