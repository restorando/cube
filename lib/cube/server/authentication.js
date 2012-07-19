var util     = require("util"),
    mongodb  = require("mongodb"),
    cookies  = require("cookies"),
    bcrypt   = require("bcrypt");
    

module.exports = function(db){
  var users;
  
  db.collection("users", function(error, collection){
    if(error) throw(error);
    users = collection;
  });
  
  return function(request, callback){
    var cookie       = (new cookies(request)).get('_cube_session'),
        token        = decodeURIComponent(cookie).split('--'), // token[0] = token uid, token[1] = token secret
        token_uid    = new Buffer(token[0] + '', 'base64').toString('utf8'),
        token_secret = new Buffer(token[1] + '', 'base64').toString('utf8');
    
    if(!token && token_uid && token_secret){
      callback(false);
      return;
    }
    
    query({"tokens.uid": token_uid}, callback);
    
    function query(query, callback){
      // Asynchronously load the requested user.
      users.findOne(query, function(error, user) {
        if(!error && user) {
          var tokens = user.tokens.filter(function(t){ return t.uid === token_uid; });
          if(tokens.length === 1){
            bcrypt.compare(token_secret, tokens[0].hashed_secret, function(err, res) {
              if(!err && res === true ){ callback(tokens[0]); }
              else { callback(false); }
            });
          } else { callback(false); }
        } else { callback(false) };
      });
    }
  }
}