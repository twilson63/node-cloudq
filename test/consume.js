var req = require('request');
var expect = require('expect.js');
var nock = require('nock');
var app = require('../app');

var foo = 'http://localhost:3000/foo';
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
    req.get(foo, { json: true }, function(e, r, b) {
      console.log(b);
      expect(r.statusCode).to.be(201);
      expect(b.ok).to.be(true);
      done();
    });
  });
  it('should return empty', function(done) {
    req.get(foo + '2', { json: true}, function(e,r,b) {
      expect(r.statusCode).to.be(200);
      expect(b.status).to.be('empty');
      done();
    });
  });
});