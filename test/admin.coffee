request = require 'request'
assert = require 'assert'
nock = require 'nock'
request = require 'request'

#nock.recorder.rec()
# describe 'cloudq', ->
#   server = 'http://admin:pass@localhost:3000'
#   it 'with auth should pass to couchdb', (done) ->
#     request.post 'http://admin:pass@localhost:3000/users/new', 
#       json: 
#         username: 'foo'
#         password: '1234'
#         bulk: true
#         views: []
#         queues: []
#       (e,r,b) ->
#         console.log b
#         done()