// Default configuration for development.

module.exports = {
  "http-host": "127.0.0.1",
  "http-port": 6000,
  "twitter"  : {
    "username": process.env.TWITTER_USERNAME || "USERNAME",
    "password": process.env.TWITTER_PASSWORD || "PASSWORD"
  },
  "randomize_time": [0, 1000 * 60 * 60 * 24]
};
