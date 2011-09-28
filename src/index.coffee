# # Cloudq 
# 
# A workman like queue, this queue is built for distribution
# allows you to run workers anywhere.
fs = require 'fs'
express = require 'express'
connect = require 'connect'
queue = require './queue'

VERSION = "0.0.5"
#
app = express.createServer() 

app.use express.logger() 
app.use express.bodyParser() 
app.use express.basicAuth(process.env.APIKEY,process.env.SECRETKEY) if process.env.APIKEY? and process.env.SECRETKEY

# jobs
# -----------------------------------------
app.queue = queue

app.respond_with = (resp, status) ->
  resp.end JSON.stringify({ status: status })

# Get Homepage...
app.get '/', (req, resp) ->
  app.queue.groupJobs (err, results) ->
    resp.end if err then "No Results..." else JSON.stringify(results) 

# Upsert New Queue
app.post '/:queue', (req, resp) ->
  if req.body? and req.body.job?
    app.queue.queueJob req.params.queue, req.body.job
    app.respond_with resp, 'success'
  else
    app.respond_with resp, 'error'

# Reserve Job from Queue
app.get '/:queue', (req, resp) ->
  app.queue.reserveJob req.params.queue, (err, job) ->
    if job
      job.id = job._id
      resp.end JSON.stringify(job)
    else
      app.respond_with resp, 'empty'

# remove from queue
app.del '/:queue/:id', (req, resp) ->
  app.queue.removeJob req.params.id
  app.respond_with resp, 'success'

# listen for transactions
app.listen Number(process.env.PORT) || 8000, ->
  app.queue.init process.env.MONGOHQ_URL ||'localhost:27017/cloudq'
  console.log 'Listening...'

module.exports = app