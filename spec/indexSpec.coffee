app = require '../server'
request = require('request')

root_uri = 'http://localhost:8000'
#root_uri = 'http://nodecq.herokuapp.com'
job_id = ''

post_job = (cb) ->
  request.post
    uri: "#{root_uri}/foobar"
    json: { job: { klass:'Jasmine', args: ['Rocks2'] }}
    cb

reserve_job = (cb) ->
  request
    uri: "#{root_uri}/foobar"
    json: true
    cb
    

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
        expect(body).toBeDefined()
        asyncSpecDone()
    asyncSpecWait()

  it 'DELETE /queue/:id', ->
    post_job ->
      reserve_job (err, resp, body) -> 
        request.del
          uri: "#{root_uri}/foobar/#{body.id}"
          json: true
          (err, resp, body) -> 
            expect(body.status).toEqual('success')
            asyncSpecDone()
    asyncSpecWait()
