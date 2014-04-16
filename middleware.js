var _ = require('underscore');

var agentkeepalive = require('agentkeepalive');
var nano = require('nano')({
  url: process.env.COUCH || 'http://localhost:5984',
  request_defaults: {
      agent: new agentkeepalive({
      maxSockets: 50,
      maxKeepAliveRequests: 0,
      maxKeepAliveTime: 30000
    })
  }
});



module.exports = Middleware;

function Middleware () {
  if (!(this instanceof Middleware)) return new Middleware();
  this.db = nano.use(process.env.DB || 'cloudq');
}

Middleware.prototype.statify = function (rows) {
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
};

Middleware.prototype.stats = function (cb) {
  var self = this;
  self.db.view('queues', 'all', {group: true, reduce: true}, function (err, body) {
    if (err) return cb(err);

    var stats = self.statify(body.rows);
    cb(null, stats);
  });
};

Middleware.prototype.publish = function (obj, cb) {
  this._db.insert(obj, cb);
};

Middleware.prototype.completed = function (id, cb) {
  this.db.atomic('complete', 'id', id, function (err, body) {
    if (err) return cb(err);

    cb(null, {status: body});
  });
};

Middleware.prototype.consume = function (queue, cb) {
  var self = this;

  self.db.view('queue', 'next', {
    startkey: [queue, 1],
    endkey: [queue, 100],
    limit: 1
  }, function (err, body) {
    if (err) return cb(err);
    // now jobs, return the cb
    if (!body.rows.length) return cb(null, null);

    // jobs
    var doc = body.rows[0];
    self.db.atomic('dequeue', 'id', doc.id, function (_err) {
      if (_err) return cb(_err);

      doc.value.id = doc.id;
      doc.value.ok = true;

      cb(null, doc.value);
    });
  });
};