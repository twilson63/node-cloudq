var req = require('request');
var expect = require('expect.js');
var nock = require('nock');
var app = require('../app');

var foo = 'http://localhost:3000/foo';
var couchdb = nock('http://localhost:5984/cloudq')
  .post('/cloudq')
  .reply(201, { ok: true})

describe('Cloudq#publishJob', function() {
  it('should post successfully and return ok', function(done) {
    req.post(foo, { json: { priority: 1, job: { klass: 'foo', args: ['bar']}}}, function(e, r, b) {
      expect(r.statusCode).to.be(201);
      expect(b.ok).to.be(true);
      done();
    });
  });
  it('should return 500', function(done) {
    req.post(foo, { json: { bar: "foo"}}, function(e,r,b) {
      expect(r.statusCode).to.be(500);
      done();
    });
  });
});