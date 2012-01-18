# # Cloudq
#
# A workman like queue, this queue is built for distribution
# allows you to run workers anywhere.
express = require 'express'
queue = require './queue'

# Middleware to validate cloudq job
validJob = require './validJob'

VERSION = "0.0.5"
#
app = express.createServer()

app.configure ->
  app.use express.logger()
  app.use express.bodyParser()

  # use basic auth
#  app.use express.basicAuth(process.env.APIKEY,process.env.SECRETKEY) if process.env.APIKEY? and process.env.SECRETKEY

  app.use app.router

  app.use express.static __dirname + '/../public'

  # validate job middleware
  app.use validJob()

# jobs
# -----------------------------------------
app.queue = queue

app.auth = ->
  if process.env.APIKEY?
    express.basicAuth(process.env.APIKEY,process.env.SECRETKEY) 
  else
    (req, resp, next) -> next()
    
app.admin_auth = ->
  express.basicAuth('jackhq',process.env.ADMINKEY || 'nosoup') 

# Blitz IO
app.get '/mu-8a96bb28-3144ff61-26ebfcaf-2d0f9b36', (req, resp) ->
  resp.writeHead 200, 'Content-Type': 'text/plain'
  resp.end '42'
# Get Homepage...
app.get '/', (req, resp) ->
  app.queue.groupJobs (err, results) ->
    #resp.render 'index', queues: results
    resp.json if err then results: [] else results

# Upsert New Queue and insert a job
app.post '/:queue', app.auth(), (req, resp) ->
  console.log req.body
  if req.body? and req.body.job?
    app.queue.queueJob req.params.queue, req.body.job
    resp.json status: 'success'
  else
    resp.json status: 'error'

# Reserve Job from Queue
app.get '/:queue', app.auth(), (req, resp) ->
  app.queue.reserveJob req.params.queue, (err, job) ->
    if job
      job.id = job._id
      resp.json job
    else
      resp.json status: 'empty'

# remove from queue
app.del '/:queue/:id', app.auth(), (req, resp) ->
  app.queue.removeJob req.params.id
  resp.json status: 'success'

app.get '/:queue/clear', app.admin_auth(), (req, resp) ->
  app.queue.removeAll req.params.queue
  resp.redirect '/'

# listen for transactions
app.listen Number(process.env.VMC_APP_PORT) || 8000, ->
  # init connection to database
  app.queue.init()
  console.log 'Listening...'

module.exports = app