# const
COMPLETE_UPDATE = "/_design/complete/_update/id/"
DEQUEUE_UPDATE = "/_design/dequeue/_update/id/"
QUEUE_VIEW = "/_design/queued/_view/name"

# dependencies
request = require 'request'
http = require 'http'
es = require 'event-stream'

# database
db = process.env.DB_URL or 'http://localhost:5984/gmms_cloudq'

module.exports = ->
  http.createServer((req, res) ->
    # TODO: Validate Basic Auth
    [req.root, req.queue, req.queueId ] = req.url.split('/')
    if req.method is 'POST'
      queueJob req, res
    else if req.method is 'DELETE'
      completeJob req, res
    else if req.method is 'GET'
      dequeueJob req, res
    else
      status(res, 'Feature Not Implemented')
  ).listen(process.env.PORT or 3000)

# queues job in datastore
queueJob = (req, res) ->
  # attached queue name and state to req
  jobify = (data, cb) ->
    json = JSON.parse(data.toString())
    json.queue = req.queue
    json.queue_state = 'queued'
    json.priority ?= 1
    cb null, JSON.stringify(json)

  req.pipe(es.pipe(es.map(jobify),request.post(db, json: true))).pipe(res)

# sets job state to reserved in datastore if queued
dequeueJob = (req, res) ->
  view = QUEUE_VIEW + "?key=%22#{req.queue}%22&limit=1"
  request db + view, json: true, (e, r, b) ->
    if b?.rows?[0]?.id?
      request.put { uri: db + DEQUEUE_UPDATE + b.rows[0].id, json: true }, (err) ->
        return status(res, err.message) if err?
        return job(res, b.rows[0].value)
    else
      status(res 'empty')

# sets job to complete in datastore
completeJob = (req, res) ->
  request.put { uri: db + COMPLETE_UPDATE + req.queueId, json: true }, (err) -> 
    status res, 'complete'

# writes status to response
status = (res, msg) ->
  res.writeHead 200, 'content-type': 'application/json'
  res.end JSON.stringify(status: msg)

# writes job to response
job = (res, job) ->
  res.writeHead 200, 'content-type': 'application/json'
  res.end JSON.stringify(job)