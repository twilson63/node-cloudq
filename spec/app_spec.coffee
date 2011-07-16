app = require('../app.js')
request = require('request')

root_uri = 'http://localhost:8000'

describe 'APP Routes', ->
  it 'GET /', ->
    request uri: "#{root_uri}/", (req, resp) ->
      expect(resp.statusCode).toEqual(200)
      asyncSpecDone()
    asyncSpecWait()
  it 'POST /awesome', ->
    request.post
      uri: "#{root_uri}/awesome"
      json: { job: { klass:'Jasmine', args: ['Rocks2'] }}
      (err, resp, body) ->  
        expect(body).toEqual(JSON.stringify({status: 'success'}))
        asyncSpecDone()
    asyncSpecWait()
  it 'GET /awesome', ->
    request uri: "#{root_uri}/awesome", (err, resp, body) ->
      expect(JSON.parse(body).klass).toEqual('Jasmine')
      asyncSpecDone()
    asyncSpecWait()
    
  # it 'DELETE /awesome/1', ->
  #   request.del uri: "#{root_uri}/awesome/1", (err, resp, body) ->
  #     expect(body).toEqual("Hello")
  #     asyncSpecDone()
  #   asyncSpecWait()