var _ = require('underscore');
var express = require('express');
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

app.configure(function() {
  app.use(express.json());
  // TODO:
  // add auth middleware for basic auth
  // nano.auth(username, userpass, function (err, body, headers) {

});

// TODO: User API

app.configure('development', function() {
  app.use(express.logger('dev'));
});

app.configure('production', function() {
  app.use(express.logger());
});

// Cloudq API

// stats
app.get('/', function(req, res) {
  db.view('queues', 'all', { group: true, reduce: true }, function(err, body, h) {
    var stats = statify(body.rows);
    res.send(200, stats);
  });
});

// publish job
app.post('/:queue', function(req, res) {
  if (!req.body) { return res.send(500, { error: 'must submit a job'}); }
  var o = req.body;
  if (!o.job) { return res.send(500, { error: 'job not found!'}); }
  _.extend(o, {
    type: req.params.queue,
    state: 'published',
    publishedAt: new Date(),
    priority: o.priority || 100
  });
  db.insert(o).pipe(res);
});

// consume job
app.get('/:queue', function(req, res) {
  db.view('queue', 'next', { 
    startkey: [req.params.queue, 1], 
    endkey: [req.params.queue, 100],
    limit: 1
  }, function(err, body, h) {
    //console.log(h.uri);
    if (body.rows.length == 0) { return res.send(200, { status: 'empty'}); }
    var doc = body.rows[0];
    db.atomic('dequeue', 'id', doc.id, function(err, body) {
      if (err) { return res.send(500, err); }
      doc.value.id = doc.id;
      doc.value.ok = true;
      res.send(201, doc.value);
    }); 
  });
});

// delete job
app.del('/:queue/:id', function(req, res) {
  db.atomic('complete', 'id', req.params.id, function(err, body) {
    if (err) { return res.send(500, err); }
    res.send({ status: body });
  });
});

app.listen(process.env.PORT || 3000);


// lib
function statify(rows) {
  return _(rows).chain().filter(function(row) {
     return _(row.key).has('state');
   }).map(function(row) {
    return {
      type: row.key.type,
      state: row.key.state,
      value: row.value
    };
  }).value();
}
