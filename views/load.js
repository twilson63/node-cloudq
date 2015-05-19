var conn = process.env.COUCH || 'http://localhost:5984';

// Load CouchDb Views
var nano = require('nano')(conn);
var async = require('async');
var views = ['dequeue', 'queue', 'complete', 'queues'];
var db = nano.use(process.env.DB || 'cloudq');


function initDB (cb) {
  nano.db.get(process.env.DB || 'cloudq', function (err) {
    if(err && err.message === 'no_db_file') {
      return nano.db.create(process.env.DB || 'cloudq', cb);
    }
    return cb();
  });
}

// exports module
var start = module.exports = load;


function load (cb) {
  initDB(function (err) {
    if (err) return cb(err);
    // load views
    async.map(views, setViews, cb);
  });
}

function setViews (view, done) {
  db.get('_design/' + view, function (err, body) {
    var data = require('./' + view);
    if (err) { return db.insert(data, '_design/' + view, done); }
    data._rev = body._rev;
    db.insert(data, done);
  });
}


if (!module.parent) {
  start(function (err, res) {
    if (err) { console.log(err); }
    console.log(res);
    process.exit(0);
  });
}