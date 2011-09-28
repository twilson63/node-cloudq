mongo = require 'mongoskin'
_ = require 'underscore'

module.exports =
  QUEUED: 'queued'
  RESERVED: 'reserved'

  # establish db connection
  init: (db = 'localhost:27017/cloudq', collection_name = 'cloudq.jobs') ->
    # Init MongoDb
    @db = mongo.db(db)
    @jobs = @db.collection(collection_name)

  # queue job
  queueJob: (name, job, cb) ->
    _.extend job, 
      queue: name
      queue_state: @QUEUED
      inserted_at: new Date()
      
    # job.queue = name
    # job.queue_state = @QUEUED
    # job.inserted_at = new Date()
    @jobs.insert job, cb

  # reserve job for processing
  reserveJob: (queue, cb) ->
    @jobs.findAndModify(
      {queue: queue, queue_state: @QUEUED }
      , [['inserted_at', 'ascending']]
      , {$set: {queue_state: @RESERVED, updated_at: new Date() }}
      , {new: true }
      cb
    )

  # remove job
  removeJob: (id, cb) -> @jobs.removeById id, cb
  
  # jobs by queue by state
  groupJobs: (cb) ->
    @jobs.group ['queue','queue_state'], {}, {"count":0}, "function(obj,prev){ prev.count++; }", true, cb