var expect = require('expect.js');
var auth = require('../../lib/auth');

describe('auth middleware', function() {
  it('should return empty function when no credentials supplied', function() {
    expect(auth().toString()).to.be('function (req, res, next) { next() }');
  });
  it('should not return empty function when uid and pwd is supplied', function() {
    expect(auth('foo', 'bar').toString()).to.not.be('function (req, res, next) { next() }');
  });
  it('should return empty function when only user credentials supplied', function() {
    expect(auth('foo').toString()).to.be('function (req, res, next) { next() }');
  });

});