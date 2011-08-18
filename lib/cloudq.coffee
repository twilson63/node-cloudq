mongo = require 'mongoskin'

class Cloudq
  VERSION: '0.0.1'
  QUEUED: 'queued'
  RESERVED: 'reserved'
  DELETED: 'deleted'
  EMPTY: 'empty'
  SUCCESS: 'success'
  ERROR: 'error'

  constructor: (db = 'localhost:27017/cloudq', collection_name = 'cloudq.jobs') ->
    # Init MongoDb
    @db = mongo.db(db)
    @jobs = @db.collection(collection_name)

  queue: (name, job, callback) ->
    job.queue = name
    job.workflow_state = @QUEUED
    @jobs.insert job, (err) =>
      callback if err? then @ERROR else @SUCCESS

  reserve: (queue, callback) ->
    @jobs.findOne {queue: queue, workflow_state: @QUEUED }, (err, job) =>
      result = { status: @EMPTY }
      if job
        job.workflow_state = @RESERVED
        @jobs.updateById job._id.toString(), job, (err) =>
          job.id = job._id
          result = if err? @ERROR else job
      callback result

  remove: (id, callback) ->
    @jobs.removeById id, (err, job) =>
      result = if err? then @ERROR else @SUCCESS
      callback result

  delete_all: (callback) ->
    @jobs.remove {workflow_state: @DELETED}
    callback if err? then @ERROR else @SUCCESS

exports.cloudq = new Cloudq(process.env.MONGODB_URL || process.env.MONGOHQ_URL ||'localhost:27017/cloudq')
