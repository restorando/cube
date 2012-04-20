//
// Collector -- listens for incoming metrics and dispatches them to the right
// handler
//

var endpoint = require("./endpoint"),
    util = require("util");

// Register Collector listeners at their appropriate paths:
//
// * putter,   handles each isolated event -- see event.js
// * poster,   an HTTP listener -- see below
// * collectd, a collectd listener -- see collectd.js
//
exports.register = function(db, endpoints) {
  var putter = require("./event").putter(db),
      poster = post(putter);
  endpoints.ws.push(
    endpoint.exact("/1.0/event/put", putter)
  );
  endpoints.http.push(
    endpoint.exact("POST", "/1.0/event", poster),
    endpoint.exact("POST", "/1.0/event/put", poster),
    endpoint.exact("POST", "/collectd", require("./collectd").putter(putter))
  );
};

//
// Construct an HTTP listener
//
// * aggregate content into a complete request
// * JSON-parse the request body
// * dispatch each metric as an event to the putter
//
function post(putter) {
  return function(request, response) {
    var content = "";
    request.on("data", function(chunk) {
      content += chunk;
    });
    request.on("end", function() {
      try {
        JSON.parse(content).forEach(putter);
      } catch (e) {
        util.log(e);
        response.writeHead(400, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        });
        return response.end("{\"status\":400}");
      }
      response.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      });
      response.end("{\"status\":200}");
    });
  };
}
