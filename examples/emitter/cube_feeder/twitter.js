var util = require("util"),
    emitter = require("../../../lib/cube/server/emitter"),
    options = require("./config"),
    https = require('https');

// Connect to websocket.
util.log("starting websocket client");

var request = {
      host: 'stream.twitter.com',
      path: '/1/statuses/sample.json',
      auth: [
        options.twitter.username,
        options.twitter.password].join(':'),
      headers:{connection: 'keep-alive'}
    };
    https.request(request, function(response) {
      response.setEncoding('utf8');
      response.on('data', process);
    }).on('error', function(e) {
      console.log('problem with request: ' + e.message);
    }).end(),
    websocket = emitter().open(options["http-host"], options["http-port"]);
    
function process(line){
  //console.log(line);
  if (line) {
    try {
      var data       = JSON.parse(line);
    } catch(e) {
      util.log("Bad line:\t" + line);
    }
    if(!data.text) return;

    if(data.retweeted_status){ 
      emit({type: "retweet", time: new Date(data.created_at), data: data});
      emit({type: "tweet",   time: new Date(data.retweeted_status.created_at), data: data.retweeted_status});
    } else {
      emit({type: "tweet", time: new Date(data.created_at), data: data});
    }
    emit({type: "twitter_user", time: new Date(data.created_at), data: data.user});
  }
}

// Emit twitter data.
function emit(data) {
  websocket.send(data);
}