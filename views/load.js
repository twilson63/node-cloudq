// Load CouchDb Views 
var db = require('nano')(process.env.COUCH || 'http://localhost:5984/cloudq');
var async = require('async');
var views = ['dequeue', 'queue', 'complete', 'queues'];

module.exports = function (cb) { async.map(views, load, cb); }

function load(view, done) {
  db.get('_design/' + view, function(err, body, headers) {
    var data = require('./' + view);
    if (err) { return db.insert(data, '_design/' + view, done); }
    data._rev = body._rev;
    db.insert(data, done);
  });
}