module.exports = {
  //
  //Shared configuration
  //
  "common": {
    "mongo-host": "127.0.0.1",
    "mongo-port": 27017,
    "mongo-database": "dashpot_development",
    "mongo-username": null,
    "mongo-password": null,
    "mongo-server_options": {auto_reconnect: true, poolSize: 8, socketOptions: { noDelay: true }},

    "mongo-metrics":  {autoIndexId: true, capped: false            },
    "mongo-events":   {autoIndexId: true, capped: true,  size: 1e9 },

    "separate-events-database": true,

    "horizons": {
      "calculation":                 1000 * 60 * 60 * 2, // 2 hours
      "invalidation":                1000 * 60 * 60 * 1, // 1 hour
      "forced_metric_expiration":    1000 * 60 * 60 * 24 * 7, // 7 days
    }
  },

  //
  // Collector configuration
  //
  "collector": {
    "http-port": 1080,
    "udp-port": 1180,
    "authenticator": "allow_all"
  },

  //
  // Evaluator configuration
  //
  "evaluator": {
    "http-port": 1091,
    // "authenticator":  "mongo_cookie"
    "authenticator": "allow_all"
  },

  //
  // Warmer configuration
  //
  "warmer": {
    "warmer-interval": 1000 * 30,
    "warmer-tier":     1000 * 10
  }

}
