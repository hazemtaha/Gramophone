

var messengerSend = require('messengerSend');
var firebase = require('firebase');

// ------------------------------------------------------------
// Actions

var actions = {
  send: send,
  fetchWeather: fetchWeather,
  sendWeatherBubble: sendWeatherBubble,
  detectMode: detectMode,
  fetchSong: fetchSong,
  fetchSongByMode: fetchSongByMode,
  clearContext: clearContext,
  fetchSongByArtist: fetchSongByArtist,
};

function send(request, response) {

  var message = {};
  if (response.text) {
    message.text = response.text;
  }
  if (response.quickreplies) {
    message.quick_replies = response.quickreplies.map(
      function(reply) {
        return {
          content_type: 'text',
          title: reply,
          payload: reply,
        };
      }
    )
  }
  messengerSend({
    recipient: {id: request.fbid},
    message: message,
  });
}

// Example of an asynchronous function, using promises
function fetchWeather(request) {
  var context = request.context;
  var entities = request.entities;
  var location = firstEntityValue(entities, 'location');

  delete context.forecast;
  delete context.missingLocation;
  delete context.location;

  if (location) {
    context.location = location;
    return fetch(
      'https://api.apixu.com/v1/forecast.json?' +
      'key=8d1bc0ace03d457ca9b164802162808' +
      '&q=' + location
    )
    .then(function(response) { return response.json(); })
    .then(function(responseJSON) {
      context.forecast = responseJSON.current.temp_f + ' F';
      return context;
    });
  } else {
    context.missingLocation = true;
    return context;
  }
}

var WEATHER_IMAGE_URL = 'http://www.marciholliday.com/briefcase/115574_826201413016PM90056.png';

// Example of a synchronous function, not using promises for simplicity
function sendWeatherBubble(request) {
  var context = request.context;
  var fbid = request.fbid;
  messengerSend({
    recipient: {id: fbid},
    message: {
      attachment: {
        type: 'template',
        payload: {
          template_type: 'generic',
          elements: [{
            title: 'Weather in ' + context.location,
            image_url: WEATHER_IMAGE_URL,
            "subtitle": context.forecast,
          }]
        }
      }
    }
  });
  return context;
}



// Example of an asynchronous function, using promises
function fetchSong(request) {
  var context = request.context;
  var entities = request.entities;
  var genre = firstEntityValue(entities, 'genre');
  console.log(genre);
    return fetch(
      'https://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&tag='+ genre +'&api_key=44ee108d9a89d2d1ec9b62f9330d5c53&format=json'
    )
    .then(function(response) { return response.json(); })
    .then(function(responseJSON) {

      var index = Math.round(Math.random() * responseJSON.tracks.track.length-1);
      context.song = responseJSON.tracks.track[index].name + " By "+ responseJSON.tracks.track[index].artist.name;

      return context;
    });

}


// Example of an asynchronous function, using promises
function fetchSongByMode(request) {
  var context = request.context;
  var mode;

  context.positive ? mode = 'sad' : mode = 'happy';

  delete context.positive;
  delete context.negative;

    return fetch(
      'https://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&tag='+mode+'&api_key=44ee108d9a89d2d1ec9b62f9330d5c53&format=json'
    )
    .then(function(response) { return response.json(); })
    .then(function(responseJSON) {

      var index = Math.round(Math.random() * responseJSON.tracks.track.length-1);
      context.song = responseJSON.tracks.track[index].name + " By "+ responseJSON.tracks.track[index].artist.name;

      return context;
    });

}


function fetchSongByArtist(request) {
    var context = request.context;
  var entities = request.entities;
  var artist = firstEntityValue(entities, 'name');

    return fetch(
      'https://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&artist='+artist+'&api_key=44ee108d9a89d2d1ec9b62f9330d5c53&format=json'
    )
    .then(function(response) { return response.json(); })
    .then(function(responseJSON) {

      var index = Math.round(Math.random() * responseJSON.toptracks.track.length-1);
      context.song = responseJSON.toptracks.track[index].name;

      return context;
    });
}

function clearContext(request) {
  return {};
}

function detectMode(request) {
  var context = request.context;
  var entities = request.entities;
  var mode = firstEntityValue(entities, 'sentiment');

  mode == 'negative'?context.negative = mode : context.positive = mode;

return context;
}




// ------------------------------------------------------------
// Helpers

function firstEntityValue(entities, name) {
  var val = entities && entities[name] &&
    Array.isArray(entities[name]) &&
    entities[name].length > 0 &&
    entities[name][0].value
  ;
  if (!val) {
    return null;
  }
  return typeof val === 'object' ? val.value : val;
}
