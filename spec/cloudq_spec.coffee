cloudq = require('../lib/cloudq').cloudq
describe 'cloudq', ->
  it 'version should be 0.0.1', ->
    expect(cloudq.VERSION).toEqual('0.0.1')
  # Test Success Queue
  it 'successfully queues job', ->
    cloudq.queue 'jasmine', {klass:'Jasmine', args: ['Rocks']}, (result) ->
      expect(result).toEqual('success')
      cloudq.reserve 'jasmine', (job) ->
        cloudq.remove job._id.toString(), (result) ->
          asyncSpecDone()
  
    asyncSpecWait()


  # Test Reserve
  it 'successfully reserves job', ->
    cloudq.queue 'jasmine', {klass:'Jasmine', args: ['Rocks2']}, (result) ->
      cloudq.reserve 'jasmine', (job) ->
        expect(job._id?).toEqual(true)
        cloudq.remove job._id.toString(), (result) ->
          asyncSpecDone()
    asyncSpecWait()
  # 
  # # Test Remove
  it 'successfully removes job', ->
    cloudq.queue 'jasmine', {klass:'Jasmine', args: ['Rocks2']}, (result) ->
      cloudq.reserve 'jasmine', (job) ->
        cloudq.remove job._id.toString(), (result) ->
          expect(result).toEqual('success')
          asyncSpecDone()
    asyncSpecWait()

  # # Test delete all processed
  it 'successfully deletes the messages', ->
    cloudq.queue 'jasmine', {klass:'Jasmine', args: ['Rocks2']}, (result) ->
      cloudq.reserve 'jasmine', (job) ->
        cloudq.remove job._id.toString(), (result) ->
          cloudq.delete_all (status) ->
            expect(result).toEqual('success')
            asyncSpecDone()
    asyncSpecWait()
