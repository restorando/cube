var cluster = require('cluster'),
    mongodb = require("mongodb"),
    metric  = require('./metric');

module.exports = function(options){
  var db, mongo, calculate_metric, boards;
  
  function fetch_metrics(callback){
    var metrics = [];
    
    if(!boards){
      db.collection("boards", function(error, collection) { boards = collection; fetch_metrics(callback); });
      return;
    }
    
    boards.find({}, {pieces: 1}, function(error, cursor) {
      if (error) throw error;
      cursor.each(function(error, row) {
        if (error) throw error;
        if (row) {
          metrics.splice.apply(metrics, [0, 0].concat(row.pieces.map(function(piece){
            return piece.metric;
          }).filter(Boolean)));
        } else {
          callback(metrics);
        }
      });
    });
  }
  
  function process_metrics(metrics){
    metrics.forEach(function(metric){
      console.log('Warming: ' + JSON.stringify(metric));
      
      // fake metrics request
      calculate_metric({ step: 1000 * 60 * 60 * 24, expression: metric.query, start: new Date(2009, 0, 1), stop: new Date() + 1000 * 60 * 60 * 24 }, function(){});
    });
    setTimeout(function(){ fetch_metrics(process_metrics); }, options.warmer.interval);
  }
  
  return {
    start: function(){
      mongo   = new mongodb.Server(options.mongo.host, options.mongo.port);
      db      = new mongodb.Db(options.mongo.database, mongo);
      db.open(function(error) { 
        if (error) throw error;
        calculate_metric = metric.getter(db);
        fetch_metrics(process_metrics);
      });
    }
  };
}