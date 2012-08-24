var cluster = require('cluster'),
    mongodb = require('mongodb'),
    metric  = require('./metric'),
    tiers   = require('./tiers'),
    util    = require('util');

module.exports = function(options){
  var db, mongo, calculate_metric, boards, tier;
  
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
      var stop  = new Date(),
          start = tier.step(tier.floor(new Date(stop - options.metrics.horizons.calculation)));
      
      util.log('Warming: ' + JSON.stringify(metric) + ' for ' + start + ' to ' + stop);
        
      // fake metrics request
      calculate_metric({ step: tier.key, expression: metric.query, start: start, stop: stop }, function(){});
    });
    setTimeout(function(){ fetch_metrics(process_metrics); }, options.warmer.interval);
  }
  
  return {
    start: function(){
      mongo   = new mongodb.Server(options.mongo.host, options.mongo.port);
      db      = new mongodb.Db(options.mongo.database, mongo),
      tier    = tiers[options.warmer.tier.toString()];

      if(typeof tier === "undefined") throw new Error("Undefined warmer tier configured: " + options.warmer.tier);
      
      db.open(function(error) { 
        if (error) throw error;
        calculate_metric = metric.getter(db);
        fetch_metrics(process_metrics);
      });
    }
  };
}