cloudq = require('../lib/cloudq').cloudq
describe 'cloudq', ->
  it 'version should be 0.0.1', ->
    expect(cloudq.VERSION).toEqual('0.0.1')
  # Test Success Queue
  it 'successfully queues job', ->
    cloudq.queue 'jasmine', {klass:'Jasmine', args: ['Rocks']}, (result) ->
      expect(result).toEqual('success')
      cloudq.reserve 'jasmine', (job) ->
        console.log job._id
        cloudq.remove job._id, (result) ->
          asyncSpecDone()

    asyncSpecWait()


  # Test Reserve
  it 'successfully reserves job', ->
    cloudq.queue 'jasmine', {klass:'Jasmine', args: ['Rocks2']}, (result) ->
      cloudq.reserve 'jasmine', (job) ->
        console.log job._id
        expect(job._id?).toEqual(true)
        cloudq.remove job._id, (result) ->
          asyncSpecDone()
    asyncSpecWait()

  # Test Remove
  it 'successfully removes job', ->
    cloudq.queue 'jasmine', {klass:'Jasmine', args: ['Rocks2']}, (result) ->
      cloudq.reserve 'jasmine', (job) ->
        console.log require('sys').inspect(job)
        cloudq.remove job._id, (result) ->
          expect(result).toEqual('success')
          asyncSpecDone()
    asyncSpecWait()

  # Test delete all processed
  it 'successfully deletes the messages', ->
    cloudq.queue 'jasmine', {klass:'Jasmine', args: ['Rocks2']}, (result) ->
      cloudq.reserve 'jasmine', (job) ->
        console.log require('sys').inspect(job)
        cloudq.remove job._id, (result) ->
          cloudq.delete_all (status) ->
            expect(result).toEqual('success')
            asyncSpecDone()
    asyncSpecWait()
