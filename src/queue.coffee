cradle = require 'cradle'
_ = require 'underscore'

cradle.setup
  host: process.env.COUCHSVR or 'localhost'
  port: 5984
  cache: false
  raw: false

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
    @db = new(cradle.Connection)().database('cloudq') 
    #@jobs = @db.collection(collection_name)
    @db.exists (err, exists) ->
      if err
        console.log "error", err
      else if exists
        console.log "the force is with you."
      else
        console.log "database does not exists."
        db.create()
    # init views and updaters
    @db.save '_design/jobs', 
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
      # updates: 
      #   reserve: (doc, req) ->
      #     doc.queue_state = 'reserved' if doc.queue_state == 'queued'
      #     return [doc, 'success']
  
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
    #@jobs.insert job, cb
    @db.save job, (err, res) ->
      cb(err, res.ok) if cb?
    
  # reserve job for processing
  # ---
  # param: name    - Name of Queue
  # param: cb      - Callback
  reserveJob: (name, cb) ->
    # Need to call
    @db.view 'jobs/queued', key: name, limit: 1, (err, res) =>
      if res.length == 1
        job = res[0].value
        @db.merge res[0].id, queue_state: 'reserved', (err, res) =>
          if cb? 
            if err? then cb(err, null) else cb(err, job)
      else
        if cb? then cb(null, null)
    # update doc

  # remove job
  # ---
  # param: job_id    - id of job to remove
  # param: cb        - callback  
  removeJob: (job_id, cb) -> 
    #@jobs.removeById job_id, cb
    @db.remove job_id, cb
    
  # remove all jobs
  removeAll: (name, cb) -> 
    # Need to call a update view that deletes all completed
    # documents for a given queue
    #@db.remove queue: name, cb
    @db.view 'jobs/reserved', key: name, (err, res) => 
      for doc in res
        @db.remove doc.id, doc.value._rev
      cb(null, ok: true) if cb?
    
  # jobs by queue by state
  # ---
  # param: cb        - callback
  groupJobs: (cb) ->
    @db.view 'jobs/groups', group: true, cb