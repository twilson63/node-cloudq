(function() {
  var mongo, _;
  mongo = require('mongoskin');
  _ = require('underscore');
  module.exports = {
    QUEUED: 'queued',
    RESERVED: 'reserved',
    init: function(db, collection_name) {
      if (db == null) {
        db = 'localhost:27017/cloudq';
      }
      if (collection_name == null) {
        collection_name = 'cloudq.jobs';
      }
      this.db = mongo.db(db);
      return this.jobs = this.db.collection(collection_name);
    },
    queueJob: function(name, job, cb) {
      _.extend(job, {
        queue: name,
        queue_state: this.QUEUED,
        inserted_at: new Date()
      });
      return this.jobs.insert(job, cb);
    },
    reserveJob: function(queue, cb) {
      return this.jobs.findAndModify({
        queue: queue,
        queue_state: this.QUEUED
      }, [['inserted_at', 'ascending']], {
        $set: {
          queue_state: this.RESERVED,
          updated_at: new Date()
        }
      }, {
        "new": true
      }, cb);
    },
    removeJob: function(id, cb) {
      return this.jobs.removeById(id, cb);
    },
    groupJobs: function(cb) {
      return this.jobs.group(['queue', 'queue_state'], {}, {
        "count": 0
      }, "function(obj,prev){ prev.count++; }", true, cb);
    }
  };
}).call(this);
