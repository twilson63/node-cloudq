queue = require '../lib/queue'

sleep = (milliSeconds) ->
  while new Date().getTime() < startTime + milliSeconds
    startTime = new Date().getTime()

queue_batch = ->
  for x in [0..10]
    queue.queueJob 'bar11', klass: 'foo', args: []
  
  x = ->
    queue.reserveJob 'bar11', (err, job) -> 
      console.log err
      console.log job
    
  setInterval(x, 1000)
        
# currently requires couch to locally be running....
describe 'queue', ->
  queue.init()
  it '#init', ->
    expect(queue.db).toBeDefined()
    #expect(queue.jobs).toBeDefined()
  it 'should queue job', ->
    queue.queueJob 'foo', klass: 'foo', args: [], (err, resp) -> 
      expect(resp).toBeDefined()
      asyncSpecDone()
    asyncSpecWait()
  it 'should reserve job', ->
    queue.reserveJob 'foo', (err, resp) ->
      expect(resp).toBeDefined()
      asyncSpecDone()
    asyncSpecWait()
    
  it 'should return empty if no jobs', ->
    queue.reserveJob 'nojob', (err, resp) ->
      expect(resp).toBeNull()
      asyncSpecDone()
    asyncSpecWait()
    
  it 'should remove all reserved jobs', ->
    #queue_batch()
    queue.removeAll 'bar11', (err, resp) ->
      expect(resp.ok).toEqual(true)
      asyncSpecDone()
    asyncSpecWait()
  it 'should group jobs', ->
    queue.groupJobs (err, res) ->
      console.log res
    
    
    