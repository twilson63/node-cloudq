couchUrl = process.env.COUCHDB or 'http://localhost:5984'
nano = require('nano')(couchUrl)
_ = require 'underscore'
request = require 'request'
# # Queue
# 
# This object allows the server to queue, reserve, remove and group Jobs.
module.exports =
  QUEUED: 'queued'
  RESERVED: 'reserved'

  # establish db connection
  # ---
  # param: db                -  Database Connection URL 
  # param: collection_name   -  Name of Cloudq Collection (Defaults cloudq.jobs)
  init: () ->
    # Init MongoDb
    @db = nano.use('cloudq') 
    # init views and updaters
    jobs = 
      updates:
        dequeue: (doc, req) ->
          doc.queue_state = req.query.state
          message = "set queue_state to #{doc.queue_state}"
          [doc, message]
      views: 
        queued: 
          map: (doc) ->
            if doc.queue_state == 'queued'
              emit doc.queue, doc
            true
            
        reserved:
          map: (doc) ->
            if doc.queue_state == 'reserved'
              emit doc.queue, doc
            true
        groups:
          map: (doc) ->
            emit "#{doc.queue}-#{doc.queue_state}", 1
            true
          reduce: (keys, values) ->
            sum values
            
    request.put
      uri: couchUrl + "/cloudq/_design/jobs"
      json: jobs
  
  # queue job
  # ---
  # param: name   - Name of Queue
  # param: job    - Job Object
  # param: cb     - callback 
  queueJob: (name, job, cb) ->
    _.extend job, 
      queue: name
      queue_state: @QUEUED
      inserted_at: new Date()
    @db.insert job, (err, res, h) ->
      cb(err, res.ok) if cb?

  # reserve job for processing
  # ---
  # param: name    - Name of Queue
  # param: cb      - Callback
  reserveJob: (name, cb) ->
    # Need to call
    @db.view 'jobs', 'queued', key: name, limit: 1, (err, res) =>
      if res?.rows?.length == 1
        request.put
          uri: couchUrl + "/cloudq/_design/jobs/_update/dequeue/#{res.rows[0].id}?state=reserved"
          json: true
          (e, r, b) ->
            if cb?
              if err? then cb(err, null) else cb(null, res.rows[0].value)
      else
        if cb? then cb(null, null)
    # update doc

  # remove job
  # ---
  # param: job_id    - id of job to remove
  # param: cb        - callback  
  removeJob: (job_id, cb) ->
    @db.destroy job_id, cb

  # remove all jobs
  removeAll: (name, cb) -> 
    # Need to call a update view that deletes all completed
    # documents for a given queue
    @db.view 'jobs', 'reserved', key: name, (err, res) => 
      for doc in res.rows
        @db.destroy doc.id, doc.value._rev, (e, b) ->
      cb(null, ok: true) if cb?

  # jobs by queue by state
  # ---
  # param: cb        - callback
  groupJobs: (cb) ->
    @db.view 'jobs', 'groups', group: true, cb