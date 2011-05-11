mongo = require 'mongoskin'

class Cloudq
  QUEUED: 'queued'
  RESERVED: 'reserved'
  DELETED: 'deleted'
  EMPTY: 'empty'
  SUCCESS: 'success'

  constructor: (db = 'localhost:27017/cloudq', collection_name = 'cloudq.jobs') ->
    # Init MongoDb
    @db = mongo.db(db)
    @jobs = @db.collection(collection_name)

  queue: (name, job) ->
    job.queue = name
    job.workflow_state = @QUEUED
    @jobs.insert job

  reserve: (queue, callback) ->
    @jobs.findOne {queue: queue, workflow_state: @QUEUED }, (err, job) =>
      result = { status: @EMPTY }
      if job
        job.workflow_state = @RESERVED
        @jobs.updateById job._id, job
        result = job
      callback result

  remove: (id, callback) ->
    @jobs.findById id, (err, job) =>
      result = { status: @EMPTY }
      if job
        job.workflow_state = @DELETED
        @jobs.updateById job._id, job
        result = { status: @SUCCESS }
      callback result


exports.cloudq = new Cloudq()
