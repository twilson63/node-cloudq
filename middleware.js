var _ = require('underscore');
var agentkeepalive = require('agentkeepalive');
var nano = require('nano')({
  url: process.env.COUCH || 'http://localhost:5984',
  request_defaults: {
    agent: new agentkeepalive({
    maxSockets: 50,
    maxKeepAliveRequests: 0,
    maxKeepAliveTime: 30000
  })}
});

console.info(nano);


module.exports = Middleware;

function Middleware () {
  if (!(this instanceof Middleware)) return new Middleware();
  this._db = nano.use(process.env.DB || 'cloudq');
}


Middleware.prototype.dequeue = function (id, cb) {
  this._db.atomic('dequeue', 'id', id, function (err, body) {// must review body res
    if (err) return cb(err);

    cb(null, true);
  });
}


Middleware.prototype.stats = function (cb) {
  var self = this;
  self._db.view('queues', 'all', {group: true, reduce: true}, function (err, body) {
    if (err) return cb(err);

    if (!body.rows.length) return cb(null, []);

    var stats = _(body.rows)
    .chain()
    .filter(function (row) {
       return _(row.key).has('state');
     })
    .map(function (row) {
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

    cb(null, stats);
  });
};


Middleware.prototype.publish = function (obj, queue, cb) {
  var now = new Date();

  _.extend(obj, {
    type: queue,
    state: 'published',
    publishedAt: now,
    expires_in: new Date(now.setDate(new Date().getDate() + 2)),
    priority: obj.priority || 100
  });

  this._db.insert(obj, function (err, body) {
    if (err) return cb(err);

    cb(null, body);
  });
};


Middleware.prototype.complete = function (id, cb) {
  this._db.atomic('complete', 'id', id, function (err, body) {
    if (err) return cb(err);

    cb(null, {status: body});
  });
};


Middleware.prototype.consume = function (queue, cb) {
  var self = this;

  // search for jobs
  self._db.view('queue', 'next', {
    startkey: [queue, 1],
    endkey: [queue, 100],
    limit: 1
  }, function (err, body) {
    if (err) return cb(err);
    // no jobs, return the cb
    if (!body.rows.length) return cb(null, null);
    // consume job
    var doc = body.rows[0];
    self.dequeue(doc.id, function (_err, _body) {
      if (_err) return cb(_err);

      cb(null, _.extend(doc.value, {id: doc.id, ok: _body}));
    });
  });
};