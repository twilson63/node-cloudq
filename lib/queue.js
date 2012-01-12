(function() {
  var cradle, _;

  cradle = require('cradle');

  _ = require('underscore');

  cradle.setup({
    host: 'localhost',
    port: 5984,
    cache: false,
    raw: false
  });

  module.exports = {
    QUEUED: 'queued',
    RESERVED: 'reserved',
    init: function() {
      this.db = new cradle.Connection().database('cloudq');
      this.db.exists(function(err, exists) {
        if (err) {
          return console.log("error", err);
        } else if (exists) {
          return console.log("the force is with you.");
        } else {
          console.log("database does not exists.");
          return db.create();
        }
      });
      return this.db.save('_design/jobs', {
        views: {
          queued: {
            map: function(doc) {
              if (doc.queue_state === 'queued') emit(doc.queue, doc);
              return true;
            }
          },
          reserved: {
            map: function(doc) {
              if (doc.queue_state === 'reserved') emit(doc.queue, doc);
              return true;
            }
          },
          groups: {
            map: function(doc) {
              emit("" + doc.queue + "-" + doc.queue_state, 1);
              return true;
            },
            reduce: function(keys, values) {
              return sum(values);
            }
          }
        }
      });
    },
    queueJob: function(name, job, cb) {
      _.extend(job, {
        queue: name,
        queue_state: this.QUEUED,
        inserted_at: new Date()
      });
      return this.db.save(job, function(err, res) {
        if (cb != null) return cb(err, res.ok);
      });
    },
    reserveJob: function(name, cb) {
      var _this = this;
      return this.db.view('jobs/queued', {
        key: name,
        limit: 1
      }, function(err, res) {
        var job;
        if (res.length === 1) {
          job = res[0].value;
          return _this.db.merge(res[0].id, {
            queue_state: 'reserved'
          }, function(err, res) {
            if (cb != null) {
              if (err != null) {
                return cb(err, null);
              } else {
                return cb(err, job);
              }
            }
          });
        } else {
          if (cb != null) return cb(null, null);
        }
      });
    },
    removeJob: function(job_id, cb) {
      return this.db.remove(job_id, cb);
    },
    removeAll: function(name, cb) {
      var _this = this;
      return this.db.view('jobs/reserved', {
        key: name
      }, function(err, res) {
        var doc, _i, _len;
        for (_i = 0, _len = res.length; _i < _len; _i++) {
          doc = res[_i];
          _this.db.remove(doc.id, doc.value._rev);
        }
        if (cb != null) {
          return cb(null, {
            ok: true
          });
        }
      });
    },
    groupJobs: function(cb) {
      return this.db.view('jobs/groups', {
        group: true
      }, cb);
    }
  };

}).call(this);
