request = require 'request'
assert = require 'assert'
nock = require('nock')

describe 'cloudq bulk', ->
  server = 'http://localhost:3000'

  before (done) ->
    require('../server')
    done()
  it 'should return rows', (done) ->
    nock('http://localhost:5984')
      .filteringRequestBody( -> '*')
      .put('/cloudq/_bulk_docs', "*")
      .reply(200, JSON.stringify({ ok: true }))
    request.put server + '/bulk', json: [{"_id":"1","_rev":"1", "_deleted": true}], (e,r,b) ->
      assert.deepEqual b, { ok: true }
      done()
