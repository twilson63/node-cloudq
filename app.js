if (process.env.NEWRELIC_KEY) { require('newrelic'); }
var _ = require('underscore');
var moment = require('moment');

var Middleware = require('./middleware');

var express = require('express');
var log = require('./logger');
var TIMEOUT = process.env.TIMEOUT || 500;
var SUCCESS = 200;
var ERROR = 500;

// Basic Auth - for now, in v3 implement user/queue based auth
var auth = require('./lib/auth')(process.env.TOKEN, process.env.SECRET);

var agentkeepalive = require('agentkeepalive');
var myagent = new agentkeepalive({
  maxSockets: 50,
  maxKeepAliveRequests: 0,
  maxKeepAliveTime: 30000
});

var nano = require('nano')({
  url: process.env.COUCH || 'http://localhost:5984',
  request_defaults: { agent: myagent }
});

var db = nano.use(process.env.DB || 'cloudq');

var app = express();
var mid = new Middleware();

var workers = {};

// TODO: User API

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


function respError (err, res) {
  log.error(err);
  res.send(500, err.message);
}

// TODO: User API

// Cloudq API - ROUTES

// return stats
app.get('/stats', function (req, res) {
  mid.stats(function (err, stats) {
    if (err) return respError(err, res);
    res.send(SUCCESS, stats);
  });
});

// publish job
app.post('/:queue', auth, publish);
app.put('/:queue', auth, publish);

// consume job - update state to Processing
app.get('/:queue', auth, function (req, res) {
  mid.consume(req.params.queue, function (err, msg) {
    if (err) return respError(err, res);

    if (msg) return res.send(SUCCESS, msg);

    // queue worker instead of returning response
    if (!workers[req.params.queue]) workers[req.params.queue] = [];

    workers[req.params.queue].push(res);

    // listen for timeout
    setTimeout(function() {
      res.send(SUCCESS, {status: 'empty'});
      // dequeue worker...
      workers[req.params.queue] = _(workers[req.params.queue]).without(res);
    }, TIMEOUT);

  });
});

// delete job - update state to Completed
app.del('/:queue/:id', auth, function (req, res) {
  mid.completed(req.params.id, function (err, msg) {
    if (err) return respError(err, res);
    res.send(msg);
  });
});

module.exports = app;

// lib
function logger () {
  return function (req, res, next) {
    var _start = new Date();

    function logRequest () {
      log.info({req: req, res: res});
      log.info('Exec Time', (new Date()) - _start, 'ms');
    }

    res.once('finish', logRequest);
    res.once  ('close', function () {
      delete workers[req.params.queue];
      logRequest();
    });

    next();
  };
}

function publish (req, res) {
  if (!req.body) {
    log.error('could not find body');
    return res.send(ERROR, {error: 'must submit a job'});
  }
  var o = req.body;
  if (!o.job) {
    log.error('could not find job');
    return res.send(ERROR, {error: 'job not found!'});
  }
  _.extend(o, {
    type: req.params.queue,
    state: 'published',
    publishedAt: new Date(),
    expires_in: moment().add('days', 2),
    priority: o.priority || 100
  });

  db.insert(o, function (err, body) {
    if (err) {
      log.error(err);
      return res.send(500, err);
    }

    res.send(SUCCESS, body);
    o._id = body.id;
    // could emit event for job added if changes queue doesn't work
    notify(o);
  });
}


// if worker is listening - notify..
function notify (doc) {
  // find queue, find worker...
  if (_.isArray(workers[doc.type]) && !_.isEmpty(workers[doc.type])) {
    var wkr = workers[doc.type].shift();
    // update doc as processing
    db.atomic('dequeue', 'id', doc._id, function (err, body) {
      if (err) {
        log.error(err);
        return wkr.send(ERROR, err);
      }

      var job = _.extend(doc.job, {
        id: doc._id,
        ok: true
      });
      wkr.send(SUCCESS, job);
    });
  }
}