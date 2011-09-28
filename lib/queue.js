(function() {
  var mongo;
  mongo = require('mongoskin');
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
    queueJob: function(name, job) {
      job.queue = name;
      job.queue_state = this.QUEUED;
      job.inserted_at = new Date();
      return this.jobs.insert(job);
    },
    reserveJob: function(queue, callback) {
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
      }, callback);
    },
    removeJob: function(id) {
      return this.jobs.removeById(id);
    },
    groupJobs: function(cb) {
      return this.jobs.group(['queue', 'queue_state'], {}, {
        "count": 0
      }, "function(obj,prev){ prev.count++; }", true, cb);
    }
  };
}).call(this);
