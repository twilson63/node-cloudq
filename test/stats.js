var req = require('supertest');
var nock = require('nock');
var app = require('../app');

var couchdb = nock('http://localhost:5984')
  .get('/cloudq/_design/queues/_view/all?group=true&reduce=true')
  .reply(200, {"rows":[
    {"key":{},"value":12},
    {"key":{"type":"foo"},"value":10},
    {"key":{"type":"foo","state":"complete"},"value":1},
    {"key":{"type":"foo","state":"consumed"},"value":1},
    {"key":{"type":"foo","state":"published"},"value":1},
    {"key":{"type":"bar","state":"complete"},"value":3},
    {"key":{"type":"bar","state":"consumed"},"value":5},
    {"key":{"type":"bar","state":"published"},"value":9},
    {"key":{"type":"job"},"value":17}
  ]});

describe('Cloudq#stats', function() {
  it('should aggregate queues', function(done) {
    req(app)
      .get('/stats')
      .expect(200, done);
  });
});