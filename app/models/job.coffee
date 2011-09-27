# # Job Model
# 
# This is the base Model for the Cloudq, its all about jobs.
class Job
  VERSION: '0.1.0'
  # Job Status
  QUEUED: 'queued'
  RESERVED: 'reserved'

  # Return Codes
  EMPTY: 'empty'
  SUCCESS: 'success'
  ERROR: 'error'

  # todo
  todo: { name: 'TODO', message: 'This method must be overwritten!' }

  # methods
  queue: -> throw @todo
  reserve: -> throw @todo
  remove: -> throw @todo
