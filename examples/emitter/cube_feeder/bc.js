var util = require("util"),
    emitter = require("../../../lib/cube/server/emitter"),
    options = require("./bc-config");

// Connect to websocket.
util.log("starting websocket client");
var client = emitter().open(options["http-host"], options["http-port"]);

var begin_date  = new Date();
var begin_time  = begin_date.getTime();

// Emit stock data.
readline(function(line, i) {
  if (i) {
    var t_now = new Date();
    try {
      var data       = JSON.parse(line);
      data.ts        = Number(data.ts);
      data.http_code = Number(data.http_code);
    } catch(e) {
      console.log("Bad line:\t" + line);
    } 

    var res = {
      type: "stock",
      time: (new Date()),
      data: data
    };
    
    // console.log(res);
    client.send(res);
  }
});

function readline(callback) {
  var stdin = process.openStdin(), line = "", i = -1;
  stdin.setEncoding("utf8");
  stdin.on("data", function(string) {
    var lines = string.split("\n");
    lines[0] = line + lines[0];
    line = lines.pop();
    lines.forEach(function(line) { callback(line, ++i); });
  });
  stdin.on("end", function() {
    util.log("stopping websocket client");
    client.close();
  });
}
