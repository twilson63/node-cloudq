if (process.env.NEWRELIC_KEY) { require('newrelic'); }

var protocol = process.env.IS_HTTPS ? require('https') : require('http');
var express = require('express');
var _ = require('underscore');
var log = require('./logger');

var Websocket = require('./websockets');
var Routes = require('./routes');
var Middleware = require('./middleware');

// Basic Auth - for now, in v3 implement user/queue based auth
var auth = require('./lib/auth')(process.env.TOKEN, process.env.SECRET);

var TIMEOUT = process.env.TIMEOUT || 500;

var app = express();


// APP logger
function logger () {
  return function (req, res, next) {
    var _start = new Date();

    function logRequest () {
      log.info({req: req, res: res});
      log.info('Exec Time', (new Date()) - _start, 'ms');
    }

    res.once('finish', logRequest);
    res.once('close', logRequest);
    next();
  };
}

function respError (err, code, res) {
  log.error(err);
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
    // if worker is listening - notify..
    notify(_.extend(req.body.job, {id: doc.id, type: req.params.queue}));
  });
}


// if worker is listening - notify..
function notify (doc) {
  // find queue, find worker...
  var wkr = Middleware.getWorker(doc.type);

  if (!wkr) return;

  // update doc as processing
  Middleware.dequeue(doc.id, function (err, res) {
    if (err) return respError(err, 500, wkr);

    delete doc.type;
    doc.ok = res;
    wkr.send(doc);
  });
}


// Cloudq API - ROUTES

// return stats
app.get('/stats', function (req, res) {
  Middleware.stats(function (err, stats) {
    if (err) return respError(err, 500, res);
    res.send(stats);
  });
});

// publish job
app.post('/:queue', auth, publish);
app.put('/:queue', auth, publish);

// consume job - update state to Processing
app.get('/:queue', auth, function (req, res) {
  Middleware.consume(req.params.queue, function (err, doc) {
    if (err) return respError(err, 500, res);

    // a workaround because the middleware is going to set the response even if no jobs to consume
    if (doc && !doc.status) return res.send(doc);

    // queue worker instead of returning response
    Middleware.addWorker(req.params.queue, 'http', res);

    function dequeueResponse () {
      // resource is http then automatically removes the worker
      Middleware.getWorker(req.params.queue);
    }

    var responseTimeoutId = setTimeout(function () {
      log.info({req: req}, 'Queue request timeout');
      dequeueResponse();
      // send status: empty - came from middleware
      res.send(doc);
    }, TIMEOUT);

    res.once('close', function () {
      log.info({req: req}, 'Queue request terminated');
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
module.exports.listen = listen;

function listen (port) {
  app.set('port', port);

  var server = protocol.createServer(app);

  server.listen(app.get('port'), function () {
    log.info('cloudq start on port ' + app.get('port') + ' in ' + app.get('env') + ' environment');

     Websocket(server, {
      transformer: process.env.PRIMUS_TRANS || 'engine.io',
      pathname: process.env.PRIMUS_PATH || '/cloudq',
      parser: process.env.PRIMUS_PARSER || 'JSON',
      timeout: process.env.PRIMUS_TIMEOUT
    });
  });
}