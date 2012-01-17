(function() {
  var couchUrl, nano, request, _;

  couchUrl = process.env.COUCHDB || 'http://localhost:5984';

  nano = require('nano')(couchUrl);

  _ = require('underscore');

  request = require('request');

  module.exports = {
    QUEUED: 'queued',
    RESERVED: 'reserved',
    init: function() {
      var jobs;
      this.db = nano.use('cloudq');
      jobs = {
        updates: {
          dequeue: function(doc, req) {
            var message;
            doc.queue_state = req.query.state;
            message = "set queue_state to " + doc.queue_state;
            return [doc, message];
          }
        },
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
      };
      return request.put({
        uri: couchUrl + "/cloudq/_design/jobs",
        json: jobs
      });
    },
    queueJob: function(name, job, cb) {
      _.extend(job, {
        queue: name,
        queue_state: this.QUEUED,
        inserted_at: new Date()
      });
      return this.db.insert(job, function(err, res, h) {
        if (cb != null) return cb(err, res.ok);
      });
    },
    reserveJob: function(name, cb) {
      var _this = this;
      return this.db.view('jobs', 'queued', {
        key: name,
        limit: 1
      }, function(err, res) {
        var _ref;
        if ((res != null ? (_ref = res.rows) != null ? _ref.length : void 0 : void 0) === 1) {
          return request.put({
            uri: couchUrl + ("/cloudq/_design/jobs/_update/dequeue/" + res.rows[0].id + "?state=reserved"),
            json: true
          }, function(e, r, b) {
            if (cb != null) {
              if (err != null) {
                return cb(err, null);
              } else {
                return cb(null, res.rows[0].value);
              }
            }
          });
        } else {
          if (cb != null) return cb(null, null);
        }
      });
    },
    removeJob: function(job_id, cb) {
      return this.db.destroy(job_id, cb);
    },
    removeAll: function(name, cb) {
      var _this = this;
      return this.db.view('jobs', 'reserved', {
        key: name
      }, function(err, res) {
        var doc, _i, _len, _ref;
        _ref = res.rows;
        for (_i = 0, _len = _ref.length; _i < _len; _i++) {
          doc = _ref[_i];
          _this.db.destroy(doc.id, doc.value._rev, function(e, b) {});
        }
        if (cb != null) {
          return cb(null, {
            ok: true
          });
        }
      });
    },
    groupJobs: function(cb) {
      return this.db.view('jobs', 'groups', {
        group: true
      }, cb);
    }
  };

}).call(this);
