var req = require('request');
var expect = require('expect.js');
var nock = require('nock');
var app = require('../app');

var foo = 'http://localhost:3000/';
var couchdb = nock('http://localhost:5984')
  .get('/cloudq/_design/queues/_view/all?group=true&reduce=true')
  .reply(200, {"rows":[
    {"key":{},"value":12},
    {"key":{"type":"foo"},"value":10},
    {"key":{"type":"foo","state":"complete"},"value":1},
    {"key":{"type":"foo","state":"consumed"},"value":1},
    {"key":{"type":"foo","state":"reserved"},"value":1},
    {"key":{"type":"job"},"value":17}
  ]});

describe('Cloudq#stats', function() {
  it('should aggregate queues', function(done) {
    req.get(foo, { json: true}, function(e, r, b) {
      expect(r.statusCode).to.be(200);
      expect(b.length).to.be(3);
      done();
    });
  });
});