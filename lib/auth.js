var jwt = require('jwt-simple');
var log = require('../logger').child({origin: 'auth'});


//process.env.TOKEN = process.env.SECRET = 'test';

// some internal functions
function error () {
  var err = new Error('Authentication required');
  log.error(err);
  return {message: err.message, statusCode: 401};
}


// auth class
var auth = {
  _user: process.env.TOKEN,
  _pwd: process.env.SECRET,
  _jwtHash: 'HS256'
};

auth.generateToken = function (cb) {
  if (!this._user || !this._pwd) return cb(new Error('Must provide a payload and a secret!'));
  return cb(null, {token: jwt.encode({username: this._user},  this._pwd)}, this._jwtHash);
};

auth.checkCredentials = function (credential) {
  return credential && (this._user === credential.user && this._pwd === credential.pwd);
};

auth.parseBasicAuth = function (auth) {
  if (!auth) return null;

  var header = auth.split(' ');
  // malformed
  if ('basic' !== header[0].toLowerCase() || !header[1]) return null;

  var credentials = new Buffer(header[1], 'base64').toString().split(':');
  if (!credentials) return null;

  return {user: credentials[0], pwd: credentials[1]};
};

// supporting tokens authorization and basic auth per request
// want to use tokens must inform the server
// if is a http client then use `/token` route to get a token
// if is a ws client then send as a parameter in the query string
// `?tokens_authorization=ok`

auth.ws = function (req, cb) {
  // websockets
  if (req.headers.connection && req.headers.connection.toLowerCase() === 'upgrade') {
    // if the process envs are not initialized lets jump over the auth step,
    // this is good for dev and testing environment
    if (!req.headers.authorization) {
      if (process.env.TOKEN && process.env.SECRET)
        return cb(error());

      log.info(req.headers, 'client authorized');
      return cb();
    }

    // chech auth
    var crd = auth.parseBasicAuth(req.headers.authorization);
    if (!auth.checkCredentials(crd)) return cb(error());

    log.info(req.headers, 'client authorized');
    return cb();
  }
};

auth.http = function (req, res, next) {
  // for the paths `/` and `/stats` don't use auth
  if (['/', '/stats'].indexOf(req.path) > -1) return next();

  // tokens authorization
  if (req.headers.token) {
    console.log('TOKENS');
  }

  // client can continue to use only basic auth

  // if the process envs are not initialized lets jump over the auth step
  // this is good for dev and testing environment
  if (!req.headers.authorization) {
    if (process.env.TOKEN && process.env.SECRET)
      return res.send(error().statusCode);

    log.info(req.headers, 'client authorized');
    return next();
  }

  // chech auth
  var crd = auth.parseBasicAuth(req.headers.authorization);
  if (!auth.checkCredentials(crd)) return res.send(error().statusCode);

  log.info(req.headers, 'client authorized');
  return next();
};

module.exports = auth;
