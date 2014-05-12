var req = require('supertest');
var nock = require('nock');
var app = require('../app');

nock('http://localhost:5984')
 .put('/cloudq/_design/complete/_update/id/d23bf9199f0b7b171d2be391cf01d954')
 .reply(200, 'success');
nock('http://localhost:5984')
 .put('/cloudq/_design/complete/_update/id/fail')
 .reply(500, {error: 'foo', reason: 'bar'});

describe('Cloudq#complete', function() {
  it('should get doc successfully', function(done) {
    req(app)
      .del('/foo/d23bf9199f0b7b171d2be391cf01d954')
      .expect(200, { status: 'success'}, done);
  });
  it('should return empty', function(done) {
    req(app)
      .del('/foo/fail')
      .expect(500, done);
  });
});
