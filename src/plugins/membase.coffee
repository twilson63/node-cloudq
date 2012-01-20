# 
module.exports = 
  name: 'q-membase'
  # establish db connection
  # ---
  # param: db                -  Database Connection URL 
  # param: collection_name   -  Name of Cloudq Collection (Defaults cloudq.jobs)

  init: (done) ->
    # TODO: Implement connection
    done()
    
  attach: (options) ->
    # ## enqueue Job
    # ---
    # param: name   - Name of Queue
    # param: job    - Job Object
    # param: cb     - callback 
    @queueJob = (name, job, cb) ->
      # TODO: Implement enqueue

    # ## dequeue or reserve job for processing
    # ---
    # param: name    - Name of Queue
    # param: cb      - Callback
    @reserveJob = (name, cb) ->
      # TODO: Implement dequeue

    # remove job
    # ---
    # param: job_id    - id of job to remove
    # param: cb        - callback  
    @removeJob = (job_id, cb) ->
      # TODO: Implement remove

    # remove all jobs
    @removeAll = (name, cb) -> 
      # TODO: Remove all Reserved Jobs

    # jobs by queue by state
    # ---
    # param: cb        - callback
    @groupJobs = (cb) ->
      # TODO: Aggregate view of all group jobs
