//d23bf9199f0b7b171d2be391cf01d954

var req = require('request');
var expect = require('expect.js');
var nock = require('nock');
var app = require('../app');

var foo = 'http://localhost:3000/foo/d23bf9199f0b7b171d2be391cf01d954';
nock('http://localhost:5984')
 .put('/cloudq/_design/complete/_update/id/d23bf9199f0b7b171d2be391cf01d954')
 .reply(200, 'success');
nock('http://localhost:5984')
 .put('/cloudq/_design/complete/_update/id/fail')
 .reply(500, {error: 'foo', reason: 'bar'});

describe('Cloudq#complete', function() {
  it('should get doc successfully', function(done) {
    req.del(foo, { json: true }, function(e, r, b) {
      expect(r.statusCode).to.be(200);
      expect(b.status).to.be('success');
      done();
    });
  });
  it('should return empty', function(done) {
    req.del('http://localhost:3000/foo/fail', { json: true}, function(e,r,b) {
      expect(r.statusCode).to.be(500);
      expect(b.error).to.be('foo');
      done();
    });
  });
});