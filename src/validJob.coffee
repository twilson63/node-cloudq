# # validJob
#
# Validation Middleware to validate that the 
# post to the queue is indeed a job with a klass key and args key.
# ---
# TODO:
# may need to validate further that klass is a string
# and args is either an array or object. (MAYBE?)
module.exports = ->
  (req, res, next) ->
    send_response = (status, message) ->
      res.end JSON.stringify({ status: status, message: message })
    if req.body? and req.method is 'POST' # validate job
      return send_response 'error', 'job object required' unless req.body.job?
      return send_response 'error', 'klass key required' unless req.body.job.klass?
      return send_response 'error', 'args key required' unless req.body.job.args?
    next()
