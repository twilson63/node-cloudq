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
    }
  };
  app.admin_auth = function() {
    if (process.env.ADMINKEY != null) {
      return express.basicAuth('jackhq', process.env.ADMINKEY);
    }
  };
  app.get('/', function(req, resp) {
    return app.queue.groupJobs(function(err, results) {
      return resp.render('index', {
        queues: results
      });
    });
  });
  app.post('/:queue', app.auth(), function(req, resp) {
    return resp.json((req.body != null) && (req.body.job != null) ? (app.queue.queueJob(req.params.queue, req.body.job), {
      status: 'success'
    }) : {
      status: 'error'
    });
  });
  app.get('/:queue', app.auth(), function(req, resp) {
    return app.queue.reserveJob(req.params.queue, function(err, job) {
      return resp.json(job ? (job.id = job._id, job) : {
        status: 'empty'
      });
    });
  });
  app.del('/:queue/:id', app.auth(), function(req, resp) {
    app.queue.removeJob(req.params.id);
    return resp.json({
      status: 'success'
    });
  });
  app.get('/:queue/clear', app.admin_auth(), function(req, resp) {
    return resp.redirect('/');
  });
  app.listen(Number(process.env.PORT) || 8000, function() {
    app.queue.init(process.env.MONGOHQ_URL || 'localhost:27017/cloudq');
    return console.log('Listening...');
  });
  module.exports = app;
}).call(this);
