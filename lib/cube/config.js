'use strict';

var path = require('path'),
    metalog = require('./metalog'),
    defaultConfigs = {};

//
//Shared configuration
//
defaultConfigs.common = {
  "mongo-host": "127.0.0.1",
  "mongo-port": 27017,
  "mongo-database": "dashpot_development",
  "mongo-username": null,
  "mongo-password": null,
  "mongo-server_options": {auto_reconnect: true, poolSize: 8, socketOptions: { noDelay: true }, safe: true},
  "mongo-db_options": {native_parser: true, safe: true},

  "mongo-metrics":  {autoIndexId: true, capped: false            },
  "mongo-events":   {autoIndexId: true, capped: true,  size: 1e9 },

  "separate-events-database": true,

  "metalog-send-events": false,

  "horizons": {
    "calculation":                 1000 * 60 * 60 * 2, // 2 hours
    "invalidation":                1000 * 60 * 60 * 1, // 1 hour
    "forced_metric_expiration":    1000 * 60 * 60 * 24 * 7, // 7 days
  }
};

//
// Collector configuration
//
defaultConfigs.collector = {
  "http-port": 1080,
  "udp-port": 1180,
  "authenticator": "allow_all"
};

//
// Evaluator configuration
//
defaultConfigs.evaluator = {
  "http-port": 1081,
  // "authenticator":  "mongo_cookie"
  "authenticator": "allow_all"
};

//
// Warmer configuration
//
defaultConfigs.warmer = {
  "warmer-interval": 1000 * 30,
  "warmer-tier":     1000 * 10
};


function extend() {
  var dst = arguments[0], src;

  for (var i = 1; i < arguments.length; i++) {
    src = arguments[i];
    for (var prop in src) {
      if (src.hasOwnProperty(prop)) {
        dst[prop] = src[prop];
      }
    }
  }

  return dst;
}

module.exports = {
  load: function(filename, app) {
    var cfg;

    if (filename) {
      var loaded = require(path.resolve(filename)),
          commonCfg = extend({}, defaultConfigs.common, loaded.common || {}),
          appCfg = extend({}, defaultConfigs[app] || {}, loaded[app] || {});

      cfg = extend(commonCfg, appCfg);
    } else {
      cfg = extend({}, defaultConfigs.common, defaultConfigs[app]);
    }

    if ('metalog-send-events' in cfg) {
      metalog.send_events = cfg['metalog-send-events'];
    }

    return cfg;
  }
};

