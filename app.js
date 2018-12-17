var nr = require('newrelic');
var _ = require('underscore');
var moment = require('moment');

var express = require('express');
var log = require('./logger');
var TIMEOUT = process.env.TIMEOUT || 500;
var SUCCESS = 200;
var ERROR = 500;

var conn = process.env.COUCH || 'http://localhost:5984';

// Basic Auth - for now, in v3 implement user/queue based auth
var auth = require('./lib/auth')(process.env.TOKEN, process.env.SECRET || process.env.SECRET2);

var agentkeepalive = require('agentkeepalive');
var myagent = new agentkeepalive({
  maxSockets: 50,
  maxKeepAliveRequests: 0,
  maxKeepAliveTime: 30000
});


var nano = require('nano')(conn);

var db = nano.use(process.env.DB || 'cloudq');

var app = express();

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

// TODO: User API

// Cloudq API

// stats
app.get('/stats', function (req, res) {
  db.view('queues', 'all', { group: true, reduce: true }, function (err, body) {
    if (err) {
      log.error(err);
      return res.send(500, err.message);
    }

    var stats = statify(body.rows);
    res.send(SUCCESS, stats);
  });
});

// publish job
app.post('/:queue', auth, publish);
app.put('/:queue', auth, publish);

// consume job
app.get('/:queue', auth, function (req, res) {
  db.view('queue', 'next', {
    startkey: [req.params.queue, 1],
    endkey: [req.params.queue, 100],
    limit: 1
  }, function (err, body) {
    if (err) {
      log.error(err);
      return res.send(500, err);
    }

    // return 0 rows
    if (!body.rows.length) {
      // queue worker instead of returning response
      if (!workers[req.params.queue]) workers[req.params.queue] = [];

      workers[req.params.queue].push(res);

      function dequeueResponse () {
        workers[req.params.queue] = _(workers[req.params.queue]).without(res);
      }

      var responseTimeoutId = setTimeout(function () {
        log.info({req: req}, 'Queue request timeout');
        dequeueResponse();
        res.send(SUCCESS, {status: 'empty'});
      }, TIMEOUT);

      res.once('close', function () {
        log.info({req: req}, 'Queue request terminated');
        clearTimeout(responseTimeoutId);
        dequeueResponse();
      });

      return;
    }

    // have jobs so pass first one to resp worker...
    var doc = body.rows[0];
    db.atomic('dequeue', 'id', doc.id, function (err) {
      if (err) {
        log.error(err);
        return res.send(500, err.message);
      }
      doc.value.id = doc.id;
      doc.value.ok = true;
      res.send(SUCCESS, doc.value);
    });
  });
});

// delete job - set state to complete
app.del('/:queue/:id', auth, function (req, res) {
  db.atomic('complete', 'id', req.params.id, function (err, body) {
    if (err) {
      log.error(err);
      return res.send(ERROR, err.message);
    }
    res.send({status: body});
  });
});

module.exports = app;
//app.listen(process.env.PORT || 3000);

// lib
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

function statify (rows) {
  return _(rows).chain().filter(function (row) {
     return _(row.key).has('state');
   }).map(function (row) {
    return {
      type: row.key.type,
      state: row.key.state,
      value: row.value
    };
  })
  .groupBy('type')
  .map(function (v, k) {
    var _value = {};
    _(v).each(function (r) {
      _value[r.state] = r.value;
    });
    return {key: k, value: _value};
  })
  .value();
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
