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

#nock.recorder.rec()
describe 'cloudq', ->
  server = 'http://localhost:3000'

  before (done) ->
    require('../server')
    done()
  it 'del job from foo queue', (done) ->
    nock('http://localhost:5984')
      .filteringRequestBody( -> '*')
      .put('/cloudq/_design/complete/_update/id/1', "*")
      .reply(200, JSON.stringify({foo: 'bar'}))
    request.del server + '/foo/1', json: true, (e,r,b) ->
      assert.deepEqual b, { status: 'success' }
      done()
  it 'post job to foo queue', (done) ->
    nock('http://localhost:5984')
      .filteringRequestBody( -> '*')
      .post('/cloudq', "*")
      .reply(200, JSON.stringify({_id: 1, _rev: 1}))
    request.post server + '/foo', json: { job: { klass: 'foo', args: [ 'bar', 'baz' ]}}, (e,r,b) ->
      assert.deepEqual b, { _id: 1, _rev: 1}
      done()
  it 'post no job to bar queue', (done) ->
    request.post server + '/bar', json: { }, (e,r,b) ->
      assert.deepEqual b, {"error":"Job Object is required!"}
      done()
  it 'get job from foo queue should return empty', (done) ->
    nock('http://localhost:5984')
      .get('/cloudq/_design/queued/_view/name?keys=[%22foo%22]&limit=1', "")
      .reply(200, "{\"total_rows\":0,\"offset\":0,\"rows\":[]}\n")
    request server + '/foo', json: true, (e,r,b) ->
      assert(b.status,'empty')
      done()
  it 'get job from bar queue should return job', (done) ->
    nock('http://localhost:5984')
      .get('/cloudq/_design/queued/_view/name?keys=[%22bar%22]&limit=1', "")
      .reply(200, JSON.stringify({
        total_rows: 1,
        offset: 0,
        rows: [{
          id: "9166ef4c39ef55e154f22990ba050140",
          key: "bar",
          value: { klass: 'bar', args: [ 'bar', 'baz' ]}
        }]
      }))
    nock('http://localhost:5984')
      .put('/cloudq/_design/dequeue/_update/id/9166ef4c39ef55e154f22990ba050140')
      .reply(200)
    request server + '/bar', json: true, (e,r,b) ->
      assert.deepEqual b, { klass: 'bar', args: [ 'bar', 'baz' ], id: '9166ef4c39ef55e154f22990ba050140' }
      done()
    