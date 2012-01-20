(function() {

  module.exports = {
    name: 'q-membase',
    init: function(done) {
      return done();
    },
    attach: function(options) {
      this.queueJob = function(name, job, cb) {};
      this.reserveJob = function(name, cb) {};
      this.removeJob = function(job_id, cb) {};
      this.removeAll = function(name, cb) {};
      return this.groupJobs = function(cb) {};
    }
  };

}).call(this);
