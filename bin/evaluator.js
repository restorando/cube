var cluster = require('cluster'),
    options = require("./evaluator-config"),
    cube    = require("../")
    server  = cube.server(options),
    warmer  = cube.warmer(options);

if(cluster.isMaster){
  server.register = function(db, endpoints) {
    cube.evaluator.register(db, endpoints);
    cube.visualizer.register(db, endpoints);
  };
  server.start();
  cluster.fork();
} else {
  warmer.start();
}