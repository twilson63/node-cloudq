# Require libs
meryl = require 'meryl'
cloudq = require('./lib/cloudq').cloudq

# Create Web Server
meryl
  .post '/{queue}', (req, resp) ->
    cloudq.queue req.params.queue, JSON.parse(req.postdata.toString()).job, (status) ->
      resp.end JSON.stringify({ status: status })

  .get '/{queue}', (req, resp) ->
    cloudq.reserve req.params.queue, (job) ->
      resp.end JSON.stringify(job)

  .h 'DELETE /{queue}/{id}', (req, resp) ->
    cloudq.remove req.params.id, (status) ->
      resp.end JSON.stringify({ status: status})

  .run()