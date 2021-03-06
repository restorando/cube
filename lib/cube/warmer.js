'use strict';

var cluster = require('cluster'),
    metric  = require('./metric'),
    tiers   = require('./tiers'),
    metalog = require('./metalog'),
    db      = new (require('./db'))();

module.exports = function(options){
  var calculate_metric, tier, timeout;

  function fetch_metrics(callback){
    var expressions = [];

    db.collection("boards", function(error, collection){
      collection.find({}, {pieces: 1}, function(error, cursor) {
        if (error) throw error;
        cursor.each(function(error, row) {
          if (error) throw error;
          if (row) {
            expressions.splice.apply(expressions, [0, 0].concat((row.pieces||[])
              .map(function(piece){ return piece.query; })
              .filter(function(expression){ return expression && !(expression in expressions); })
            ));
          } else {
            callback(expressions);
          }
        });
      });
    });
  }

  function process_metrics(expressions){
    expressions.forEach(function(expression){
      var stop  = new Date(),
          start = tier.step(tier.floor(new Date(stop - options.horizons.calculation)));

      metalog.info('cube_warm', {is: 'warm_metric', metric: {query: expressions}, start: start, stop: stop });

      // fake metrics request
      calculate_metric({ step: tier.key, expression: expression, start: start, stop: stop }, noop);
    });
    timeout = setTimeout(function(){ fetch_metrics(process_metrics); }, options['warmer-interval']);
  }

  function noop(){};

  return {
    start: function(){
      tier    = tiers[options['warmer-tier'].toString()];

      if(typeof tier === "undefined") throw new Error("Undefined warmer tier configured: " + options['warmer-tier']);

      metalog.event("cube_life", { is: 'start_warmer', options: options });

      db.open(options, function(error) {
        if (error) throw error;
        calculate_metric = metric.getter(db, options);
        fetch_metrics(process_metrics);
      });
    },

    stop: function(){
      metalog.event("cube_life", { is: 'stop_warmer' });
      clearTimeout(timeout);
    }
  };
};
