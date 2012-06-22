//
// 
// 
//

// TODO: report failures?
// TODO: include the event._id (and define a JSON encoding for ObjectId?)
// TODO: allow the event time to change when updating (fix invalidation)
// TODO: fix race condition between cache invalidation and metric computation

var util = require("util"),
    mongodb = require("mongodb"),
    parser = require("./event-expression"),
    tiers = require("./tiers"),
    types = require("./types");

var type_re = /^[a-z][a-zA-Z0-9_]+$/,
    invalidate = {$set: {i: true}},
    multi = {multi: true},
    event_options = {sort: {t: -1}, batchSize: 1000},
    type_options = {safe: true};

// Save the event and invalidate any cached metrics that might be impacted by
// the new value.
//
// @param request --
//   - id,   a unique ID (optional). If included, it will be used as the Mongo record's primary key -- if the collector receives that event multiple times, it will only be stored once. If omitted, Mongo will generate a unique ID for you.
//   - time, timestamp for the event (a date-formatted string)
//   - type, namespace for the events. A corresponding `foo_events` collection must exist in the DB -- /schema/schema-*.js illustrate how to set up a new event type.
//   - data, the event's payload
//
exports.putter = function(db) {
  var collection = types(db),
      eventsByType = {},
      flushInterval,
      flushTypes = {},
      flushDelay = 5000;

  function endpoint(request) {
    var time = new Date(request.time),
        type = request.type,
        events = eventsByType[type];

    // Validate the date and type.
    if (!type_re.test(type)) return util.log("invalid type: " + request.type);
    if (isNaN(time)) return util.log("invalid time: " + request.time);

    // If this is a known event type, save immediately.
    if (events) return save(events);
    
    // Otherwise, verify that the collection exists before saving.
    db.collection(type + "_events", type_options, function(error, events) {
      if (error) {
        db.createCollection(type + "_events", { safe: true, autoIndexId: true }, function(error, collection){
          if (error) return util.log("Error creating " + type +" events collection: " + error);
          collection.ensureIndex({t: 1}, {background: true}, function(error, indexName){
            if (error) return util.log("Error creating " + type +" events collection index: " + error);
            save(eventsByType[type] = collection);
          });
          collection.ensureIndex({l: "2d", t: 1}, {background: true}, function(error, indexName){
            if (error) return util.log("Error creating " + type +" events collection index: " + error);
          });
        });
        db.createCollection(type + "_metrics", { safe: true, autoIndexId: true, size: 1e7, capped: true }, function(error, collection){
          if (error) return util.log("Error creating " + type +" metrics collection: " + error);
          collection.ensureIndex({"i": 1, "_id.e": 1, "_id.l": 1, "_id.t": 1}, {background: true}, function(error, indexName){
            if (error) return util.log("Error creating " + type +" metrics collection index: " + error);
          });
          collection.ensureIndex({"i": 1, "_id.l": 1, "_id.t": 1}, {background: true}, function(error, indexName){
            if (error) return util.log("Error creating " + type +" metrics collection index: " + error);
          });
        });
      } else {
        save(eventsByType[type] = events);
      }
    });

    // Create and save the event object.
    function save(events) {
      request.location = [(Math.random()* 360) - 180, (Math.random()* 360) - 180];
      var event = {t: time, d: request.data, l: request.location};

      // If an id is specified, promote it to Mongo's primary key.
      if ("id" in request) event._id = request.id;

      events.save(event);

      // Queue invalidation of metrics for this type.
      var times = flushTypes[type] || (flushTypes[type] = [time, time]);
      if (time < times[0]) times[0] = time;
      if (time > times[1]) times[1] = time;
    }
  }

  // Invalidate cached metrics.
  endpoint.flush = function() {
    var types = [];
    for (var type in flushTypes) {
      var metrics = collection(type).metrics,
          times = flushTypes[type];
      types.push(type);
      for (var tier in tiers) {
        var floor = tiers[tier].floor;
        metrics.update({
          i: false,
          "_id.l": +tier,
          "_id.t": {
            $gte: floor(times[0]),
            $lte: floor(times[1])
          }
        }, invalidate, multi);
      }
    }
    if (types.length) util.log("flush " + types.join(", "));
    flushTypes = {};
  };

  flushInterval = setInterval(endpoint.flush, flushDelay);

  return endpoint;
};

//
// Subscribe to a type of event
//
// Will call `callback` on each event
//
// if `stop` is not given, does a streaming response, polling for results every
// `streamDelay` (5 seconds).
//
// if `stop` is given, return events from the given interval
//
// * convert the request expression and filters into a MongoDB-ready query
// * Issue the query;
// * if streaming, register the query to be run at a regular interval
//
exports.getter = function(db) {
  var collection = types(db),
      streamDelay = 5000;

  function getter(request, callback) {
    var stream = !("stop" in request),
        start = new Date(request.start),
        stop = stream ? new Date(Date.now() - streamDelay) : new Date(request.stop),
        bbox = request.bbox;

    // Validate the dates.
    if (isNaN(start)) return util.log("invalid start: " + request.start), -1;
    if (isNaN(stop)) return util.log("invalid stop: " + request.stop), -1;
    if (!("expression" in request)) return util.log("invalid expression: " + request.expression), -1;

    // Parse the expression.
    var expression;
    try {
      expression = parser.parse(request.expression);
    } catch (error) {
      return util.log("invalid expression: " + error), -1;
    }

    // Copy any expression filters into the query object.
    var filter = {t: {$gte: start, $lt: stop}};
    if(bbox){
      if(typeof bbox === "string") bbox = bbox.split(/,\s*/);
      if(bbox.length === 4)
        bbox = [[parseFloat(bbox[0]), parseFloat(bbox[1])],
                [parseFloat(bbox[2]), parseFloat(bbox[3])]];
      filter.l = {"$within" : {"$box" : bbox}};
    }

    expression.filter(filter);

    // Request any needed fields.
    var fields = {t: 1};
    if(bbox) fields.l = 1;

    expression.fields(fields);

    // Query for the desired events.
    function query() {
      collection(expression.type).events.find(filter, fields, event_options, function(error, cursor) {
        if (error) throw error;
        cursor.each(function(error, event) {
          if (callback.closed) return cursor.close();          
          if (error) throw error;
          if (event) {
            callback({
              time: event.t,
              location: event.l,
              data: event.d
            });
          } else {
            callback(false)
          }
        });
      });
    }

    query();

    // While streaming, periodically poll for new results.
    if (stream) {
      stream = setInterval(function() {
        if (callback.closed) return clearInterval(stream);
        filter.t.$gte = stop;
        filter.t.$lt = stop = new Date(Date.now() - streamDelay);
        query();
      }, streamDelay);
    }
  }

  getter.close = function(callback) {
    // query results or periodic calls may have already been set in motion, but
    // trigger in the future; this ensures they quit listening and drop further
    // results on the floor.
    callback.closed = true;
  };

  return getter;
};
