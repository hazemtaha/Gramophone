var messengerSend = require('messengerSend');
var firebase = require('firebase');

// ------------------------------------------------------------
// Actions

var actions = {
    send: send,
    detectMode: detectMode,
    fetchSong: fetchSong,
    fetchSongByMode: fetchSongByMode,
    clearContext: clearContext,
    fetchSongByArtist: fetchSongByArtist,
    fetchSimilarSongs: fetchSimilarSongs,
    fetchRandomSong: fetchRandomSong,
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
        recipient: {
            id: request.fbid
        },
        message: message,
    });
}

function fetchRandomSong(request) {
    var context = request.context;
    return fetch(
            'https://ws.audioscrobbler.com/2.0/?method=chart.gettoptracks&api_key=44ee108d9a89d2d1ec9b62f9330d5c53&format=json'
        )
        .then(function(response) {
            return response.json();
        })
        .then(function(responseJSON) {

            var index = Math.round(Math.random() * responseJSON.tracks.track.length - 1);
            context.song = responseJSON.tracks.track[index].name + " By " + responseJSON.tracks.track[index].artist.name;

            return context;
        });

}


// Example of an asynchronous function, using promises
function fetchSong(request) {
    var context = request.context;
    var entities = request.entities;
    var genre = firstEntityValue(entities, 'genre');
    console.log(genre);
    return fetch(
            'https://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&tag=' + genre + '&api_key=44ee108d9a89d2d1ec9b62f9330d5c53&format=json'
        )
        .then(function(response) {
            return response.json();
        })
        .then(function(responseJSON) {

            var index = Math.round(Math.random() * responseJSON.tracks.track.length - 1);
            context.song = responseJSON.tracks.track[index].name + " By " + responseJSON.tracks.track[index].artist.name;

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
            'https://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&tag=' + mode + '&api_key=44ee108d9a89d2d1ec9b62f9330d5c53&format=json'
        )
        .then(function(response) {
            return response.json();
        })
        .then(function(responseJSON) {

            var index = Math.round(Math.random() * responseJSON.tracks.track.length - 1);
            context.song = responseJSON.tracks.track[index].name + " By " + responseJSON.tracks.track[index].artist.name;

            return context;
        });

}


function fetchSongByArtist(request) {
    var context = request.context;
    var entities = request.entities;
    var artist = firstEntityValue(entities, 'name');

    delete context.artist;

    return fetch(
            'https://ws.audioscrobbler.com/2.0/?method=artist.gettoptracks&artist=' + artist + '&api_key=44ee108d9a89d2d1ec9b62f9330d5c53&format=json'
        )
        .then(function(response) {
            return response.json();
        })
        .then(function(responseJSON) {

            var index = Math.round(Math.random() * responseJSON.toptracks.track.length - 1);
            context.song = responseJSON.toptracks.track[index].name;

            return context;
        });
}

function fetchSimilarSongs(request) {
    var context = request.context;
    var entities = request.entities;
    var artist = firstEntityValue(entities, 'name');
    var track = firstEntityValue(entities, 'track') || context.track;

    if (artist && track) {

        delete context.track;
        delete context.missingArtist;

        var url = 'https://ws.audioscrobbler.com/2.0/?method=track.getsimilar&artist=' + artist + '&track=' + track + '&api_key=44ee108d9a89d2d1ec9b62f9330d5c53&format=json'

        return fetch(
                url
            )
            .then(function(response) {
                return response.json();
            })
            .then(function(responseJSON) {

                var index = Math.round(Math.random() * responseJSON.similartracks.track.length - 1);
                context.song = responseJSON.similartracks.track[index].name + " By " + responseJSON.similartracks.track[index].artist.name;

                return context;
            });
    } else {
      context.track = track;
      context.missingArtist = true;
    }
}

function clearContext(request) {
    return {};
}

function detectMode(request) {
    var context = request.context;
    var entities = request.entities;
    var mode = firstEntityValue(entities, 'sentiment');

    mode == 'negative' ? context.negative = mode : context.positive = mode;

    return context;
}




// ------------------------------------------------------------
// Helpers

function firstEntityValue(entities, name) {
    var val = entities && entities[name] &&
        Array.isArray(entities[name]) &&
        entities[name].length > 0 &&
        entities[name][0].value;
    if (!val) {
        return null;
    }
    return typeof val === 'object' ? val.value : val;
}
