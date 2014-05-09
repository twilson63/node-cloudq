var req = require('supertest');
var nock = require('nock');
var app = require('../app');

var couchdb = nock('http://localhost:5984/cloudq')
  .post('/cloudq')
  .reply(201, { ok: true});

describe('Cloudq#publishJob', function() {
  it('should post successfully and return ok', function(done) {
    req(app)
      .post('/foo')
      .set('Accept', 'application/json')
      .send({priority: 1, job: { klass: 'foo', args: ['bar']}})
      .expect(200, {ok: true}, done);
  });
  it('should return 500', function(done) {
    req(app)
      .post('/foo')
      .expect(500, done);
  });
});
