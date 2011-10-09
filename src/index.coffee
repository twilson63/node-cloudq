# # Cloudq 
# 
# A workman like queue, this queue is built for distribution
# allows you to run workers anywhere.
express = require 'express'
jade = require 'jade'
queue = require './queue'


# Middleware to validate cloudq job
validJob = require './validJob'

VERSION = "0.0.5"
#
app = express.createServer() 

app.configure ->
  app.use express.logger() 
  app.use express.bodyParser() 
  # Setup View Engine as Jade
  app.set 'views', __dirname + '/../views'
  app.register '.jade', jade
  app.set 'view engine', 'jade'

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
  express.basicAuth(process.env.APIKEY,process.env.SECRETKEY) if process.env.APIKEY?

app.admin_auth = ->
  express.basicAuth('jackhq',process.env.ADMINKEY) if process.env.ADMINKEY?

# Get Homepage...
app.get '/', (req, resp) ->
  app.queue.groupJobs (err, results) ->
    resp.render 'index', queues: results
    #resp.send if err then "No Results..." else JSON.stringify(results) 

# Upsert New Queue and insert a job
app.post '/:queue', app.auth(), (req, resp) ->
  resp.json if req.body? and req.body.job?  
    app.queue.queueJob req.params.queue, req.body.job
    status: 'success'
  else
    status: 'error'

# Reserve Job from Queue
app.get '/:queue', app.auth(), (req, resp) ->
  app.queue.reserveJob req.params.queue, (err, job) ->
    resp.json if job
      job.id = job._id
      job
    else
      status: 'empty'

# remove from queue
app.del '/:queue/:id', app.auth(), (req, resp) ->
  app.queue.removeJob req.params.id
  resp.json status: 'success'

app.get '/:queue/clear', app.admin_auth(), (req, resp) ->
  app.queue.removeAll req.params.queue
  resp.redirect '/'

# listen for transactions
app.listen Number(process.env.PORT) || 8000, ->
  # init connection to database
  app.queue.init process.env.MONGOHQ_URL ||'localhost:27017/cloudq'
  console.log 'Listening...'

module.exports = app