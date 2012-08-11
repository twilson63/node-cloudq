request = require 'request'
assert = require 'assert'
nock = require('nock')

#nock.recorder.rec();

describe 'cloudq web', ->
  server = 'http://localhost:3000'

  before (done) ->
    require('../server')
    done()
  it 'should return rows', (done) ->
    nock('http://localhost:5984')
      .get('/cloudq/_design/queues/_view/all?group=true')
      .reply(200, "{\"rows\":[\r\n{\"key\":\"foo-completed\",\"value\":1},\r\n{\"key\":\"foo-reserved\",\"value\":10},\r\n{\"key\":\"foo-undefined\",\"value\":2},\r\n{\"key\":\"undefined-undefined\",\"value\":5}\r\n]}\n")
    request.get server + '/', { 'Content-type': 'text/html'}, (e,r,b) ->
      assert.deepEqual b.match('foo')?, true
      done()