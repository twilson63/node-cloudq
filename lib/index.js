(function() {
  var VERSION, app, connect, express, fs, queue, validJob;
  fs = require('fs');
  express = require('express');
  connect = require('connect');
  queue = require('./queue');
  validJob = require('./validJob');
  VERSION = "0.0.5";
  app = express.createServer();
  app.use(express.logger());
  app.use(express.bodyParser());
  if ((process.env.APIKEY != null) && process.env.SECRETKEY) {
    app.use(express.basicAuth(process.env.APIKEY, process.env.SECRETKEY));
  }
  app.use(validJob());
  app.queue = queue;
  app.respond_with = function(resp, status) {
    return resp.end(JSON.stringify({
      status: status
    }));
  };
  app.get('/', function(req, resp) {
    return app.queue.groupJobs(function(err, results) {
      return resp.end(err ? "No Results..." : JSON.stringify(results));
    });
  });
  app.post('/:queue', function(req, resp) {
    if ((req.body != null) && (req.body.job != null)) {
      app.queue.queueJob(req.params.queue, req.body.job);
      return app.respond_with(resp, 'success');
    } else {
      return app.respond_with(resp, 'error');
    }
  });
  app.get('/:queue', function(req, resp) {
    return app.queue.reserveJob(req.params.queue, function(err, job) {
      if (job) {
        job.id = job._id;
        return resp.end(JSON.stringify(job));
      } else {
        return app.respond_with(resp, 'empty');
      }
    });
  });
  app.del('/:queue/:id', function(req, resp) {
    app.queue.removeJob(req.params.id);
    return app.respond_with(resp, 'success');
  });
  app.listen(Number(process.env.PORT) || 8000, function() {
    app.queue.init(process.env.MONGOHQ_URL || 'localhost:27017/cloudq');
    return console.log('Listening...');
  });
  module.exports = app;
}).call(this);
