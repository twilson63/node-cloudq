var req = require('supertest');
var nock = require('nock');
var app = require('../app');


nock('http://localhost:5984')
 .get('/cloudq/_design/queue/_view/next?startkey=%5B%22foo%22%2C1%5D&endkey=%5B%22foo%22%2C100%5D&limit=1')
 .reply(200, { rows: [{ id: 1, key: ["foo", 1], value: { klass: "foo", args: ["bar"]}}]});

nock('http://localhost:5984')
 .put('/cloudq/_design/dequeue/_update/id/1')
 .reply(201, 'success');

 nock('http://localhost:5984')
  .get('/cloudq/_design/queue/_view/next?startkey=%5B%22foo2%22%2C1%5D&endkey=%5B%22foo2%22%2C100%5D&limit=1')
  .reply(200, { rows: []});

describe('Cloudq#consume', function() {
  it('should get doc successfully', function(done) {
    req(app)
      .get('/foo')
      .expect(200)
      .expect({ klass: 'foo', args: [ 'bar' ], id: 1, ok: true })
      .end(done);
  });
  it('should return empty', function(done) {
    req(app)
      .get('/foo2')
      .expect(200, { status: 'empty' }, done);
  });
});
