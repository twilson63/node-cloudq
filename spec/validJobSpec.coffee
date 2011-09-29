validJob = require '../lib/validJob'

# mock req object
req = { body: {}, method: 'POST'}
result = {}
# mock resp object
resp = { end: (body) -> 
  result = body 
}
# mock next fn
next = -> console.log 'next called'

describe 'validJob', ->
  it 'return error if no job object in body', ->
    validJob()(req, resp, next)
    expect(result).toEqual('{"status":"error","message":"job object required"}')
  it 'return error if no klass object in job', ->
    req.body.job = {}
    validJob()(req, resp, next)
    expect(result).toEqual('{"status":"error","message":"klass key required"}')
  it 'return error if no args object in job', ->
    req.body.job = {klass: 'Hello'}
    validJob()(req, resp, next)
    expect(result).toEqual('{"status":"error","message":"args key required"}')
