request = require 'request'
assert = require 'assert'
nock = require 'nock'
request = require 'request'

#nock.recorder.rec()
describe 'cloudq', ->
  it 'with auth should pass to couchdb', (done) ->
    nock('http://localhost:5984')
      .filteringRequestBody( -> '*')
      .post('/cloudq', "*")
      .reply(200, JSON.stringify({foo: 'bar'}))
    
    request.post 'http://localhost:3000/users/new', 
      json: 
        name: 'bar2'
        password: '1234'
        bulk: true
        views: []
        queues: []
      (e,r,b) ->
        assert.deepEqual(b, { status: 'success' });
        done()