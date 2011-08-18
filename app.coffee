# Require libs
fs = require 'fs'
cloudq = require('./lib/cloudq').cloudq
express = require 'express'
connect = require 'connect'
if process.env.APIKEY? and process.env.SECRETKEY
  app = express.createServer express.logger(), express.bodyParser(), express.basicAuth(process.env.APIKEY,process.env.SECRETKEY) 
else
  app = express.createServer express.logger(), express.bodyParser()

app.get '/', (req, resp) ->
  resp.end 'Welcome to Cloudq'

app.get '/mu-8a96bb28-3144ff61-26ebfcaf-2d0f9b36', (req, resp) ->
  resp.end '42'

app.post '/:queue', (req, resp) ->
  cloudq.queue req.params.queue, req.body.job, (status) ->
    resp.end JSON.stringify({ status: status })

app.get '/:queue', (req, resp) ->
  cloudq.reserve req.params.queue, (job) ->
    resp.end JSON.stringify(job)

app.delete '/:queue/:id', (req, resp) ->
  cloudq.remove req.params.id, (status) ->
    resp.end JSON.stringify({ status: status})

app.listen Number(process.env.PORT || process.env.VMC_APP_PORT) || 8000, ->
  console.log 'Listening...'
