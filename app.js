if (process.env.NEWRELIC_KEY) { require('newrelic'); }

var http = require('http');
var express = require('express');
var _ = require('underscore');
var log = require('./logger');

var Websocket = require('./websockets');
var Routes = require('./routes');
var Middleware = require('./middleware');//process.env.TOKEN = process.env.SECRET = 'test';

// Basic Auth - for now, in v3 implement user/queue based auth
var auth = require('./lib/auth')(process.env.TOKEN, process.env.SECRET);

var TIMEOUT = process.env.TIMEOUT || 500;

// create an express app
var app = express();

// for better logging and debugging let's make
// a division by "http" and "websockets"
app.log = log.child({protocol: 'http'});

// the app express logger
function logger () {
  return function (req, res, next) {
    var _start = new Date();

    function logRequest () {
      app.log.info({req: req, res: res});
      app.log.info('Exec Time', (new Date()) - _start, 'ms');
    }

    res.once('finish', logRequest);
    res.once('close', logRequest);
    next();
  };
}

function respError (err, code, res) {
  app.log.error(err);
  res.send(code, {error: err.message});
}


// EXPRESS
// Express configuration

app.configure('development', function () {
  app.use(logger());
});

app.configure('production', function () {
  app.use(logger());
});

app.configure(function () {
  // using a browser to call /stats the server must sent the favicon or the
  // request will be a `GET /favicon`
  app.use(express.favicon());
  app.use(express.json());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

// lib

function publish (req, res) {
  // check content-type, only application/json
  if (!req.is('application/json'))
    return respError(new Error('the content type must be "application/json"'), 500, res);// code 415

  if (!req.body || !req.body.job)
    return respError(new Error('must submit a valid job'), 500, res);// code 400

  Middleware.publish(req.body, req.params.queue, function (err, doc) {
    if (err) return respError(err, 500, res);
    // response to client
    res.send(doc);
  });
}


// Cloudq API - ROUTES

// return stats
app.get('/stats', auth, function (req, res) {
  Middleware.stats(function (err, stats) {
    if (err) return respError(err, 500, res);
    res.send(stats);
  });
});

// return workers
app.get('/workers', auth, function (req, res) {
  res.send({online: Middleware.workersOnline()});
});

// publish job
app.post('/:queue', auth, publish);
app.put('/:queue', auth, publish);

// consume job - update state to Processing
app.get('/:queue', auth, function (req, res) {
  Middleware.consume(req.params.queue, function (err, doc) {
    if (err) return respError(err, 500, res);

    // the middleware is going to set the response even if no jobs to consume
    if (doc && !doc.status) return res.send(doc);

    // workaround if happens any error when the worker
    // is polling and is notified to consume some job
    res.once('error', function (err) {
      return respError(err, 500, res);
    });

    // POLLING

    // queue worker instead of returning response
    // middleware addWorker returns an guid to identify the worker
    var workerId = Middleware.addWorker(req.params.queue, 'http', res);

    function dequeueResponse () {
      // resource is http then removes the worker
      Middleware.rmWorker(workerId);
    }

    var responseTimeoutId = setTimeout(function () {
      app.log.info({req: req}, 'Queue request timeout');
      dequeueResponse();
      // send status: empty - came from middleware
      res.send(doc);
    }, TIMEOUT);

    // this prevents jobs to being put in processing state
    // if a client closes the connection
    res.once('close', function () {
      app.log.info({req: req}, 'Queue request terminated');
      clearTimeout(responseTimeoutId);
      dequeueResponse();
    });
  });
});

// delete job - update state to Completed
app.del('/:queue/:id', auth, function (req, res) {
  Middleware.complete(req.params.id, function (err, doc) {
    if (err) return respError(err, 500, res);// code 400
    res.send(doc);
  });
});


module.exports = app;

app.listen = function (port) {
  var self = this;
  // workaround to authorize ws connections
  process.env.WS_AUTHORIZATION = null;

  self.set('port', port);
  // create http server
  var server = http.createServer(self);

  // listen & start websockets
  server.listen(self.get('port'), function () {
    log.info('cloudq start on port ' + self.get('port') + ' in ' + self.get('env') + ' environment');
    Websocket(server, {
      transformer: process.env.PRIMUS_TRANS,
      pathname: process.env.PRIMUS_PATH || '/cloudq',
      parser: process.env.PRIMUS_PARSER,
      timeout: process.env.PRIMUS_TIMEOUT
    });
  });
};
