request = require 'request'
assert = require 'assert'
nock = require('nock')

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
      .get('/cloudq/_design/queued/_view/name?limit=1', "{\"startkey\":[\"foo\",1]}")
      .reply(200, "{\"total_rows\":0,\"offset\":0,\"rows\":[]}\n")
    request server + '/foo', json: true, (e,r,b) ->
      assert(b.status,'empty')
      done()
  it 'get job from bar queue should return job', (done) ->
    nock('http://localhost:5984')
      .get('/cloudq/_design/queued/_view/name?limit=1', "{\"startkey\":[\"bar\",1]}")
      .reply(200, "{\"total_rows\":1,\"offset\":0,\"rows\":[\r\n{\"id\":\"9166ef4c39ef55e154f22990ba050140\",\"key\":\"bar\",\"value\":{\"_id\":\"9166ef4c39ef55e154f22990ba050140\",\"_rev\":\"1-f5708c3521e9fb431e8b34807b650559\",\"job\":{\"klass\":\"bar\",\"args\":[\"bar\",\"baz\"]},\"queue\":\"cloudq2\",\"queue_state\":\"queued\",\"priority\":1,\"expires_in\":\"2012-06-20T02:25:09.765Z\"}}\r\n]}\n")
    nock('http://localhost:5984')
      .put('/cloudq/_design/dequeue/_update/id/9166ef4c39ef55e154f22990ba050140')
      .reply(200)
    request server + '/bar', json: true, (e,r,b) ->
      assert.deepEqual b, { klass: 'bar', args: [ 'bar', 'baz' ], id: '9166ef4c39ef55e154f22990ba050140' }
      done()
    