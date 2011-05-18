# Require libs
fs = require 'fs'
connect = require 'connect'
meryl = require 'meryl'
cloudq = require('./lib/cloudq').cloudq

# Add Basic Auth
meryl.p connect.basicAuth(process.env.APIKEY,process.env.SECRETKEY)
# Create Web Server
meryl
  .get '/', (req, resp) ->
    resp.end 'Welcome to Cloudq'
  .post '/{queue}', (req, resp) ->
    cloudq.queue req.params.queue, JSON.parse(req.postdata.toString()).job, (status) ->
      resp.end JSON.stringify({ status: status })

  .get '/{queue}', (req, resp) ->
    cloudq.reserve req.params.queue, (job) ->
      resp.end JSON.stringify(job)

  .h 'DELETE /{queue}/{id}', (req, resp) ->
    cloudq.remove req.params.id, (status) ->
      resp.end JSON.stringify({ status: status})

  .run({ port: Number(process.env.VMC_APP_PORT) || 8000})
#options = 
#  key: fs.readFileSync('privatekey.pem')
#  cert: fs.readFileSync('certificate.pem')

#server = (require 'https').createServer(options, meryl.cgi())
#  .listen Number(process.env.VMC_APP_PORT) || 8000
