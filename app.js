var express = require('express');
var nano = require('nano')(process.env.COUCH || 'http://localhost:5984');
var db = nano.use('cloudq');

var app = express();

app.configure(function() {
  app.use(express.json());
});

// Cloudq API

// stats
app.get('/', function(req, res) {
  res.send([]);
});

// publish job
app.post('/:queue', function(req, res) {
  req.body.type = req.params.queue;
  db.insert(req.body).pipe(res);
});

// consume job
app.get('/:queue', function(req, res) {
  db.atomic('job', 'consume', { params: { key: req.params.queue }}).pipe(res);
});

// delete job
app.del('/:queue/:id', function(req, res) {
  db.atomic('job', 'destroy', { params: { key: [req.params.queue, req.params.id] }}).pipe(res);
});

app.listen(process.env.PORT || 3000);
console.log('CloudQ - Running!');

