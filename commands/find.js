exports.name = '.find';
exports.hidden = false;
exports.enabled = true;
exports.matchStart = true;
exports.handler = function(data) {
    var location = data.text.split(' ', 2);
    if (location[1] != null) {
		var thingToFind = data.text.substring(7 + location[1].length);
		request('http://query.yahooapis.com/v1/public/yql?q=select%20*%20from%20local.search'
			+'%20where%20zip%3D\'' + encodeURIComponent(location[1]) + '\'%20and%20query%3D\''
			+ encodeURIComponent(thingToFind) + '\'%20limit%201&format=json',
			function cbfunc(error, response, body) {
				if (!error && response.statusCode == 200) {
					var formatted = eval('(' + body + ')');
					try {
						var botresponse = 'Nearest ' + thingToFind + ' location to ' + location[1] + ': ';
							botresponse += formatted.query.results.Result.Title + ' ('
								+ formatted.query.results.Result.Rating.AverageRating + ' ☆) '
								+ formatted.query.results.Result.Address + ', ' 
								+ formatted.query.results.Result.City + ' ('
								+ formatted.query.results.Result.Distance + ' miles).  ';
						
						output({text: botresponse, destination: data.source, userid: data.userid});
					} catch (e) {
						var response = ('Sorry, no locations found.');
                        output({text: response, destination: data.source, userid: data.userid});
					}
				}
		});
    }
}