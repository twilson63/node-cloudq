# Require libs
fs = require 'fs'
#cloudq = require('./lib/cloudq').cloudq
express = require 'express'
app = express.createServer express.logger()

# Add Logging Support
#meryl.p connect.logger()
# Add Basic Auth
# meryl.p connect.basicAuth(process.env.APIKEY,process.env.SECRETKEY) if process.env.APIKEY? and process.env.SECRETKEY
# Create Web Server
app
  .get '/', (req, resp) ->
    resp.end 'Welcome to Cloudq'

  # .post '/:queue', (req, resp) ->
  #   cloudq.queue req.params.queue, JSON.parse(req.postdata.toString()).job, (status) ->
  #     resp.end JSON.stringify({ status: status })
  # 
  # .get '/:queue', (req, resp) ->
  #   cloudq.reserve req.params.queue, (job) ->
  #     resp.end JSON.stringify(job)
  # 
  # .delete '/:queue/:id', (req, resp) ->
  #   cloudq.remove req.params.id, (status) ->
  #     resp.end JSON.stringify({ status: status})

app.listen Number(process.env.PORT || process.env.VMC_APP_PORT) || 8000, ->
  console.log 'Listening...'
