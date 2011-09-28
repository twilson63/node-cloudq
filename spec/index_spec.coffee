#app = require '../index'
request = require('request')

#root_uri = 'http://localhost:8000'
root_uri = 'http://nodecq.herokuapp.com'
job_id = ''

describe 'Successful Integration Tests', ->
  it 'POST /queue with no body fail', ->
    request.post
      uri: "#{root_uri}/foobar"
      json: true
      (err, resp, body) -> 
        expect(body.status).toEqual('error')
        asyncSpecDone()
    asyncSpecWait()
    
  it 'POST /queue', ->
    request.post
      uri: "#{root_uri}/foobar"
      json: { job: { klass:'Jasmine', args: ['Rocks2'] }}
      (err, resp, body) -> 
        expect(body.status).toEqual('success')
        asyncSpecDone()
    asyncSpecWait()

  it 'GET /queue', ->
    request
      uri: "#{root_uri}/foobar"
      json: true
      (err, resp, body) ->
        job_id = body.id
        expect(body.workflow_state).toEqual('reserved')
        asyncSpecDone()
    asyncSpecWait()

  it 'DELETE /queue/:id', ->
    request.del
      uri: "#{root_uri}/foobar/#{job_id}"
      json: true
      (err, resp, body) -> 
        expect(body.status).toEqual('success')
        asyncSpecDone()
    asyncSpecWait()
