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
    },
    randomize_time = options.randomize_time,
    buffer = '';
    https.request(request, function(response) {
      response.setEncoding('utf8');
      response.on('data', function(chunk){
        buffer += chunk;
        var lines = buffer.split(/\n/);
        buffer = lines.pop();
        lines.forEach(process);
      });
    }).on('error', function(e) {
      console.log('problem with request: ' + e.message);
    }).end(),
    websocket = emitter().open(options["http-host"], options["http-port"]);
    
function process(line){
  if (line) {
    try {
      var data = JSON.parse(line);
    } catch(e) {
      util.log("Bad line:\t" + line); return;
    }
    if(!data.text) return;
    // turn the tweet into the thing you would send to cube if you got to design a tweet for dashboard display.
    // some possibly foolish ideas include:
    // * source -> top 5 or 'other'
    // * hashtag count
    // * 10**((log10(followers_count) / 3.0).round)
    
    if(randomize_time){
      var time_offset = Math.floor(Math.random() * (randomize_time[1] - randomize_time[0])) + randomize_time[0]; 
    } else { var time_offset = 0; }
    var time = new Date(new Date(data.created_at) - time_offset);
    if(data.retweeted_status){ 
      emit({type: "retweet", time: time, data: data});
    } else {
      emit({type: "tweet", time: time, data: data});
    }
    //emit({type: "twitter_user", time: new Date(data.user.created_at), data: data.user});
  }
}

// Emit twitter data.
function emit(data) {
  websocket.send(data);
}