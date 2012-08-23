// Default configuration for development.
module.exports = {
  "mongo": {
    "host":     "127.0.0.1",
    "port":     27017,
    "database": "dashpot_development"
  },
  "server": {
    "port":         1081,
    "authenticate": true
  },
  "warmer": {
    "interval": 30 * 1000 // 30 seconds
  }
};
