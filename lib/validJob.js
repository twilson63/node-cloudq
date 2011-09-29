(function() {
  module.exports = function() {
    return function(req, res, next) {
      var send_response;
      send_response = function(status, message) {
        return res.end(JSON.stringify({
          status: status,
          message: message
        }));
      };
      if ((req.body != null) && req.method === 'POST') {
        if (req.body.job == null) {
          return send_response('error', 'job object required');
        }
        if (req.body.job.klass == null) {
          return send_response('error', 'klass key required');
        }
        if (req.body.job.args == null) {
          return send_response('error', 'args key required');
        }
      }
      return next();
    };
  };
}).call(this);
