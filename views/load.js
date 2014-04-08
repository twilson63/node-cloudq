// Load CouchDb Views
var nano = require('nano')(process.env.COUCH || 'http://localhost:5984');
var async = require('async');
var views = ['dequeue', 'queue', 'complete', 'queues'];
var db = nano.use(process.env.DB || 'cloudq');

var start = module.exports = function (cb) { async.map(views, load, cb); };

function load(view, done) {
  db.get('_design/' + view, function (err, body) {
    var data = require('./' + view);
    if (err) { return db.insert(data, '_design/' + view, done); }
    data._rev = body._rev;
    db.insert(data, done);
  });
}


function initDB (done) {
  nano.db.get(process.env.DB || 'cloudq', function (err) {
    if(err && err.message === 'no_db_file') {
      nano.db.create(process.env.DB || 'cloudq', done);
    }
    done();
  });
}


if (!module.parent) {
  initDB(function () {
    start(function (err, res) {
      if (err) { console.log(err); }
      console.log(res);
      process.exit(0);
    });
  });
}