var cluster = require('cluster'),
    mongodb = require("mongodb"),
    metric  = require('./metric'),
    parser  = require("./metric-expression");

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
  
  function earliest_event_time(type, callback){
    db.collection(type + "_events", function(error, collection){
      collection.findOne({}, {t: 1}, {sort:{t: 1}}, function(error, event){
        if(event) callback(event.t);
      });
    });
  }
  
  function process_metrics(metrics){
    metrics.forEach(function(metric){
      var type;
      try { type = parser.parse(metric.query).type; }
      catch (e) { return util.log("invalid expression: " + e), -1; }
      
      earliest_event_time(type, function(time){ 
        console.log('Warming: ' + JSON.stringify(metric) + ' for ' + time + ' to ' + new Date());
        
        // fake metrics request
        calculate_metric({ step: options.warmer.tier, expression: metric.query, start: time, stop: new Date() }, function(){});
      });

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