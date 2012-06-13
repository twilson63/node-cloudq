request = require 'request'
assert = require 'assert'

describe 'happy path', ->
  server = 'http://localhost:3000'
  queue = server + '/fooq'
  id = ""

  before (done) ->
    # start server
    require('../lib') -> done()
  it 'should queue job', (done) ->
    request.post queue,
      json: { klass: 'foo', args: ["bar","baz"] }
      (err, r, b) ->
        assert(b.ok, true)
        done()
  it 'should dequeue job', (done) ->
    request.get queue, { json: true }, (err, r, b) ->
        assert(b._id?, true)
        id = b._id
        done()
  it 'should complete job', (done) ->
    request.del { uri: queue + '/' + id, json: true}, (err, r, b) ->
      assert b.status, 'complete'
      done()
