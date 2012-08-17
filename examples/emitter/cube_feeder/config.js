// Default configuration for development.

module.exports = {
  "http-host": "127.0.0.1",
  "http-port": 1080,
  "twitter"  : {
    "username": process.env.TWITTER_USERNAME || "USERNAME",
    "password": process.env.TWITTER_PASSWORD || "PASSWORD"
  }
};
