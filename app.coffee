# Require libs
sys = require 'sys'
meryl = require 'meryl'
cloudq = require('./lib/cloudq').cloudq

# Create Web Server
meryl
  .post '/{queue}', (req, resp) ->
    cloudq.queue req.params.queue, JSON.parse(req.postdata.toString()).job
    resp.end JSON.stringify({ status: "success" })

  .get '/{queue}', (req, resp) ->
    cloudq.reserve req.params.queue, (job) ->
      resp.end JSON.stringify(job)

  .h 'DELETE /{queue}/{id}', (req, resp) ->
    cloudq.remove req.params.id, (status) ->
      resp.end JSON.stringify(status)

  .run()