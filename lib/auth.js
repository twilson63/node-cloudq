var express = require('express');

module.exports = function(setUser, setPwd, setPwd2) {
  var auth = function(req, res, next) { next() };
  if (setUser && setPwd) {
    auth = express.basicAuth(function(user, pass) {
     return user === setUser && (pass === setPwd || pass === setPwd2);
    });
  }
  return auth;
}