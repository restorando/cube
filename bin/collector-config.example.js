// Default configuration for development.
module.exports = {
  "mongo": {
    "host": "127.0.0.1",
    "port": 27017,
    "database": "dashpot_development"
  },
  "server": {
    "port": 1080,
    "authenticate": false
  },
  "collections": {
    "metrics": { "ephemeral": true },
    "events": { "capped": 1e7 }
  },
  "metrics": {
    "horizons": {
      "calculation":  1000 * 60 * 60 * 2, // 2 hours
      "invalidation": 1000 * 60 * 60 * 1  // 1 hour
    }
  }
};
