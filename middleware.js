var uuid = require('node-uuid');
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


// return only one instance
module.exports = new Middleware();

function Middleware () {
  if (!(this instanceof Middleware)) return new Middleware();
  this._db = nano.use(process.env.DB || 'cloudq');
  this._workers = {};
 }


Middleware.prototype.addWorker = function (queue, protocol, resource) {
  var id = uuid.v1();
  resource.workerId = id;
  this._workers[id] = {queue: queue, protocol: protocol, resource: resource, state: 0};
  return id;
};


Middleware.prototype.rmWorker = function (worker_id) {
  if (this._workers[worker_id] && !this._workers[worker_id].state)
    delete this._workers[worker_id];
};


Middleware.prototype._getWorker = function (queue) {
  return _.find(this._workers, function (worker, id) {
    if (!worker.state && worker.queue === queue) {
      worker.state = 1;
      return worker;
    }
  });
};


// put worker available or unavailable and return 1 | 0 if the state was updated
Middleware.prototype.enableWorker = function (worker_id, state) {
  var updated;
  // prevent to throw an error if the object no longer exists
  if (this._workers[worker_id] && this._workers[worker_id].state !== state) {
    this._workers[worker_id].state = Number(state) || 0;
    updated = 1;
  }
  return updated;
};


Middleware.prototype.workersOnline = function () {
  return _.map(this._workers, function (worker, id) {
    return {
      worker: id,
      queue: worker.queue,
      protocol: worker.protocol,
      state: worker.state
    };
  });
};


Middleware.prototype._dequeue = function (id, cb) {
  this._db.atomic('dequeue', 'id', id, function (err, body) {// must review body response!!!
    if (err) return cb(err);

    cb(null, true);
  });
}


Middleware.prototype.stats = function (cb) {
  var self = this;
  self._db.view('queues', 'all', {group: true, reduce: true}, function (err, body) {
    if (err) return cb(err);

    if (!body.rows.length) return cb(null, []);

    var stats = _.chain(body.rows)
    .filter(function (row) {
       return _.has(row.key, 'state');
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
      _.each(v, function (r) {
        _value[r.state] = r.value;
      });
      return {key: k, value: _value};
    })
    .value();

    cb(null, stats);
  });
};


// if worker is listening - notify..
Middleware.prototype._notifyWorker = function (doc, queue) {
  var self = this;
  var worker = this._getWorker(queue);
  // exit in case don't exist any worker available
  if (!worker) return;

  self._dequeue(doc.id, function (err, res) {
    // lets pass the error to the worker emitter
    if (err) return worker.resource.emit('error', err);
    // true or false
    doc.ok = res;

    // must validate the tx method
    // express
    if (worker.resource.send) return worker.resource.send(doc);
    // primus
    return worker.resource.write(doc);
  });
};


Middleware.prototype.publish = function (doc, queue, cb) {
  var now = new Date();
  var self = this;

  _.extend(doc, {
    type: queue,
    state: 'published',
    publishedAt: now,
    expires_in: new Date(now.setDate(new Date().getDate() + 2)),
    priority: doc.priority || 100
  });

  self._db.insert(doc, function (err, body) {
    if (err) return cb(err);
    // send output to client
    cb(null, body);

    doc.job.id = body.id;
    self._notifyWorker(doc.job, queue);
  });
};


Middleware.prototype.complete = function (worker, id, cb) {
  // parameters validation
  if (typeof id === 'function') {
    cb = id;
    id = worker;
    worker = null;
  }

  var self = this;
  self._db.atomic('complete', 'id', id, function (err, body) {
    // must check this better in couchdb or nano
    if (err) {
      err = err.reason && err.reason.split(/\n/)[0] || err;
      return cb(err);
    }

    // put worker available
    if (worker) self.enableWorker(worker, 0);

    cb(null, {status: body});
  });
};

// "consume" is going to work in a different manner for polling and websockets
// if is a ws worker the put him unavailable
Middleware.prototype.consume = function (worker, queue, cb) {
  // parameters validation
  if (typeof queue === 'function') {
    cb = queue;
    queue = worker;
    worker = null;
  }

  var self = this;

  // search for jobs
  self._db.view('queue', 'next', {
    startkey: [queue, 1],
    endkey: [queue, 100],
    limit: 1
  }, function (err, body) {
    if (err) return cb(err);
    // no jobs, return the cb
    if (!body.rows.length) return cb(null, {status: 'empty'});

    // worker unavailable
    if (worker) self.enableWorker(worker, 1);

    // consume job
    var doc = body.rows[0];
    self._dequeue(doc.id, function (_err, _body) {
      if (_err) return cb(_err);

      cb(null, _.extend(doc.value, {id: doc.id, ok: _body}));
    });
  });
};
