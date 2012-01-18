(function() {
  var mongo, _;

  mongo = require('mongoskin');

  _ = require('underscore');

  module.exports = {
    name: 'q-mongodb',
    init: function(done) {
      this.db = mongo.db(process.env.MONGOSVR || 'localhost:27017/cloudq');
      this.jobs = this.db.collection('cloudq.jobs');
      return done();
    },
    attach: function(options) {
      this.queueJob = function(name, job, cb) {
        _.extend(job, {
          queue: name,
          queue_state: this.QUEUED,
          inserted_at: new Date()
        });
        return this.jobs.insert(job, cb);
      };
      this.reserveJob = function(name, cb) {
        return this.jobs.findAndModify({
          queue: name,
          queue_state: this.QUEUED
        }, [['inserted_at', 'ascending']], {
          $set: {
            queue_state: this.RESERVED,
            updated_at: new Date()
          }
        }, {
          "new": true
        }, cb);
      };
      this.removeJob = function(job_id, cb) {
        return this.jobs.removeById(job_id, cb);
      };
      return this.groupJobs = function(cb) {
        return this.jobs.group(['queue', 'queue_state'], {}, {
          "count": 0
        }, "function(obj,prev){ prev.count++; }", true, cb);
      };
    }
  };

}).call(this);
