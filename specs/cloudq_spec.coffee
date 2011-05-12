cloudq = require('../lib/cloudq').cloudq
describe 'cloudq', ->
  it 'version should be 0.0.1', ->
    expect(cloudq.VERSION).toEqual('0.0.1')
  # Test Success Queue
  it 'successfully queues job', ->
    cloudq.queue 'jasmine', {klass:'Jasmine', args: ['Rocks']}, (result) ->
      expect(result).toEqual('success')
      asyncSpecDone()

    asyncSpecWait()

  # it 'fails at queueing job', ->
  #   cloudq.queue 'jasmine', null, (result) ->
  #     expect(result).toEqual('error')
  #     asyncSpecDone()
  #   asyncSpecWait()

  # Test Reserve
  it 'successfully reserves job', ->
    cloudq.queue 'jasmine', {klass:'Jasmine', args: ['Rocks']}, (result) ->
      cloudq.reserve 'jasmine', (job) ->
        expect(job._id?).toEqual(true)
        asyncSpecDone()
    asyncSpecWait()

  # Test Remove
  it 'successfully removes job', ->
    cloudq.queue 'jasmine', {klass:'Jasmine', args: ['Rocks']}, (result) ->
      cloudq.reserve 'jasmine', (job) ->
        cloudq.remove job._id, (result) ->
          expect(result).toEqual('success')
          asyncSpecDone()
    asyncSpecWait()


