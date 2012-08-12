request = require 'request'
assert = require 'assert'
nock = require('nock')

# nock('http://localhost:5984')
#   .filteringRequestBody( -> '*')
#   .get('/cloudq/_design/users/_view/active', "*")
#   .reply(200, JSON.stringify({ rows: [{key: 'guest', value: {
#     _id: 'user:guest',
#     type: 'guest',
#     password: 'guest',
#     bulk: true,
#     views: [],
#     queues: []
#     }
#   }]}))
# 
describe 'cloudq view', ->
  server = 'http://localhost:3000'

  before (done) ->
    require('../server')
    done()
  it 'should return rows', (done) ->
    nock('http://localhost:5984')
      .filteringRequestBody( -> '*')
      .get('/cloudq/_design/expired/_view/today', "*")
      .reply(200, JSON.stringify({ rows: [{key: 'foo', value: 'bar'}]}))
    request.get server + '/view/expired/today', json: true, (e,r,b) ->
      assert.deepEqual b, [{"key":"foo","value":"bar"}]
      done()
  it 'should return empty array', (done) ->
    nock('http://localhost:5984')
      .filteringRequestBody( -> '*')
      .get('/cloudq/_design/expired/_view/today', "*")
      .reply(200, JSON.stringify({ rows: []}))
    request.get server + '/view/expired/today', json: true, (e,r,b) ->
      assert.deepEqual b, []
      done()
