mongo = require 'mongoskin'

class Cloudq
  constructor: ->
    # Init MongoDb
    @db = mongo.db('localhost:27017/cloudq')
    @jobs = @db.collection('jobs')

  queue: (name, job) ->
    job.queue = name
    job.workflow_state = 'queued'
    @jobs.insert job

  reserve: (queue, callback) ->
    @jobs.findOne {queue: queue, workflow_state: 'queued'}, (err, job) =>
      result = { status: "empty" }
      if job
        job.workflow_state = 'reserved'
        @jobs.updateById job._id, job
        result = { job: job }
      callback result

  remove: (id, callback) ->
    @jobs.findById id, (err, job) =>
      result = { status: "empty" }
      if job
        job.workflow_state = 'deleted'
        @jobs.updateById job._id, job
        result = { status: "success" }
      callback result


exports.cloudq = new Cloudq()
