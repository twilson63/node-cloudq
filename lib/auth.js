var express = require('express');

module.exports = function(setUser, setPwd) {
  var auth = function(req, res, next) { next() };
  if (setUser && setPwd) {
    auth = express.basicAuth(function(user, pass) {
     return user === setUser && pass === setPwd;
    });
  }
  return auth;
}