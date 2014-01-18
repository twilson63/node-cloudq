// Load CouchDb Views 
var nano = require('nano')(process.env.COUCH || 'http://localhost:5984');
var async = require('async');
var views = ['dequeue', 'queue', 'complete', 'queues'];
var db = nano.use(process.env.DB || 'cloudq');


var start = module.exports = function (cb) { async.map(views, load, cb); }

function load(view, done) {
  db.get('_design/' + view, function(err, body, headers) {
    var data = require('./' + view);
    if (err) { return db.insert(data, '_design/' + view, done); }
    data._rev = body._rev;
    db.insert(data, done);
  });
}

if (!module.parent) {
  start(function(err, res) {
    if (err) { console.log(err); }
    console.log(res);
    process.exit(0);
  });
}