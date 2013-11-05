require('newrelic');
var _ = require('underscore');
var express = require('express');
var log = require('./logger');

// Basic Auth - for now, in v3 implement user/queue based auth
var auth = require('./lib/auth')(process.env.TOKEN, process.env.SECRET);

var agentkeepalive = require('agentkeepalive');
var myagent = new agentkeepalive({
    maxSockets: 50
  , maxKeepAliveRequests: 0
  , maxKeepAliveTime: 30000
  });

var nano = require('nano')({
  url: process.env.COUCH || 'http://localhost:5984',
  request_defaults: { agent: myagent }
});

var db = nano.use('cloudq');

var app = express();

// TODO: User API

app.configure('development', function() {
  app.use(logger());
});

app.configure('production', function() {
  app.use(logger());
});

app.configure(function() {
  app.use(express.json());
  app.use(app.router);
  app.use(express.static('./public'));

});

// TODO: User API

// Cloudq API

// stats
app.get('/stats', function(req, res) {
  db.view('queues', 'all', { group: true, reduce: true }, function(err, body, h) {
    var stats = statify(body.rows);
    res.send(200, stats);
  });
});

// publish job
app.post('/:queue', auth, publish);
app.put('/:queue', auth, publish);

// consume job
app.get('/:queue', auth, function(req, res) {
  db.view('queue', 'next', { 
    startkey: [req.params.queue, 1], 
    endkey: [req.params.queue, 100],
    limit: 1
  }, function(err, body, h) {
    if (err) { log.error(err); return res.send(500, err); }
    //console.log(h.uri);
    if (body.rows.length == 0) { return res.send(200, { status: 'empty'}); }
    var doc = body.rows[0];
    db.atomic('dequeue', 'id', doc.id, function(err, body) {
      if (err) { log.error(err); return res.send(500, err); }
      doc.value.id = doc.id;
      doc.value.ok = true;
      res.send(201, doc.value);
    }); 
  });
});

// delete job
app.del('/:queue/:id', auth, function(req, res) {
  db.atomic('complete', 'id', req.params.id, function(err, body) {
    if (err) { log.error(err); return res.send(500, err); }
    res.send({ status: body });
  });
});

app.listen(process.env.PORT || 3000);


// lib
function logger() {
  return function(req, res, next) {
    function logRequest() {
      res.removeListener('finish', logRequest);
      res.removeListener('close', logRequest);
      log.info({res: res});
    }

    res.on('finish', logRequest);
    res.on('close', logRequest);
    next();
  }
}
function publish(req, res) {
  if (!req.body) { log.error(err); return res.send(500, { error: 'must submit a job'}); }
  var o = req.body;
  if (!o.job) { log.error(err); return res.send(500, { error: 'job not found!'}); }
  _.extend(o, {
    type: req.params.queue,
    state: 'published',
    publishedAt: new Date(),
    priority: o.priority || 100
  });
  db.insert(o).pipe(res);
}

function statify(rows) {
  return _(rows).chain().filter(function(row) {
     return _(row.key).has('state');
   }).map(function(row) {
    return {
      type: row.key.type,
      state: row.key.state,
      value: row.value
    };
  })
  .groupBy('type')
  .map(function(v, k) {
    var _value = {};
    _(v).each(function(r) {
      _value[r.state] = r.value;
    });
    return { key: k, value: _value};
  })
  .value();
}
