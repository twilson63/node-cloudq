# # WorkMan
fs = require 'fs'
express = require 'express'
connect = require 'connect'
mongo = require 'mongoskin'

VERSION = "0.0.5"
#
app = express.createServer() 

#app.use express.logger() 
app.use express.bodyParser() 
app.use express.basicAuth(process.env.APIKEY,process.env.SECRETKEY) if process.env.APIKEY? and process.env.SECRETKEY

# jobs
# -----------------------------------------
app.workman =
  QUEUED: 'queued'
  RESERVED: 'reserved'

  # establish db connection
  init: (db = 'localhost:27017/cloudq', collection_name = 'cloudq.jobs') ->
    # Init MongoDb
    @db = mongo.db(db)
    @jobs = @db.collection(collection_name)

  # queue job
  queue: (name, job) ->
    job.queue = name
    job.workflow_state = @QUEUED
    job.inserted_at = new Date()
    @jobs.insert job

  # reserve job for processing
  reserve: (queue, callback) ->
    @jobs.findAndModify(
      {queue: queue, workflow_state: @QUEUED }, 
      [['inserted_at', 'ascending']], 
      {$set: {workflow_state: @RESERVED, updated_at: new Date() }}, 
      {new: true }, callback
    )

  # remove job
  remove: (id) -> @jobs.removeById id

app.respond_with = (resp, status) ->
  resp.end JSON.stringify({ status: status })

# Get Homepage...
app.get '/', (req, resp) ->
  resp.end 'Welcome to Workman'

# Upsert New Queue
app.post '/:queue', (req, resp) ->
  app.workman.queue req.params.queue, req.body.job
  app.respond_with resp, 'success'

# Reserve Job from Queue
app.get '/:queue', (req, resp) ->
  app.workman.reserve req.params.queue, (err, job) ->
    if job
      job.id = job._id
      resp.end JSON.stringify(job)
    else
      app.respond_with resp, 'empty'

app.del '/:queue/:id', (req, resp) ->
  app.workman.remove req.params.id
  app.respond_with resp, 'success'

# listen for transactions
app.listen Number(process.env.PORT) || 8000, ->
  app.workman.init process.env.MONGOHQ_URL ||'localhost:27017/cloudq'
  console.log 'Listening...'

module.exports = app