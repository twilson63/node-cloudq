(function() {
  var VERSION, app, express, jade, queue, validJob;

  express = require('express');

  jade = require('jade');

  queue = require('./queue');

  validJob = require('./validJob');

  VERSION = "0.0.5";

  app = express.createServer();

  app.configure(function() {
    app.use(express.logger());
    app.use(express.bodyParser());
    app.set('views', __dirname + '/../views');
    app.register('.jade', jade);
    app.set('view engine', 'jade');
    app.use(app.router);
    app.use(express.static(__dirname + '/../public'));
    return app.use(validJob());
  });

  app.queue = queue;

  app.auth = function() {
    if (process.env.APIKEY != null) {
      return express.basicAuth(process.env.APIKEY, process.env.SECRETKEY);
    } else {
      return function(req, resp, next) {
        return next();
      };
    }
  };

  app.admin_auth = function() {
    return express.basicAuth('jackhq', process.env.ADMINKEY || 'nosoup');
  };

  app.get('/mu-8a96bb28-3144ff61-26ebfcaf-2d0f9b36', function(req, resp) {
    resp.writeHead(200, {
      'Content-Type': 'text/plain'
    });
    return resp.end('42');
  });

  app.get('/', function(req, resp) {
    return app.queue.groupJobs(function(err, results) {
      return resp.json(err ? {
        results: []
      } : results);
    });
  });

  app.post('/:queue', app.auth(), function(req, resp) {
    console.log(req.body);
    if ((req.body != null) && (req.body.job != null)) {
      app.queue.queueJob(req.params.queue, req.body.job);
      return resp.json({
        status: 'success'
      });
    } else {
      return resp.json({
        status: 'error'
      });
    }
  });

  app.get('/:queue', app.auth(), function(req, resp) {
    return app.queue.reserveJob(req.params.queue, function(err, job) {
      if (job) {
        job.id = job._id;
        return resp.json(job);
      } else {
        return resp.json({
          status: 'empty'
        });
      }
    });
  });

  app.del('/:queue/:id', app.auth(), function(req, resp) {
    app.queue.removeJob(req.params.id);
    return resp.json({
      status: 'success'
    });
  });

  app.get('/:queue/clear', app.admin_auth(), function(req, resp) {
    app.queue.removeAll(req.params.queue);
    return resp.redirect('/');
  });

  app.listen(Number(process.env.VMC_APP_PORT) || 8000, function() {
    app.queue.init();
    return console.log('Listening...');
  });

  module.exports = app;

}).call(this);
