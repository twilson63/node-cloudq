(function() {
  var VERSION, app, connect, express, fs, mongo;
  fs = require('fs');
  express = require('express');
  connect = require('connect');
  mongo = require('mongoskin');
  VERSION = "0.0.5";
  app = express.createServer();
  app.use(express.logger());
  app.use(express.bodyParser());
  if ((process.env.APIKEY != null) && process.env.SECRETKEY) {
    app.use(express.basicAuth(process.env.APIKEY, process.env.SECRETKEY));
  }
  app.workman = {
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
    queue: function(name, job) {
      job.queue = name;
      job.workflow_state = this.QUEUED;
      job.inserted_at = new Date();
      return this.jobs.insert(job);
    },
    reserve: function(queue, callback) {
      return this.jobs.findAndModify({
        queue: queue,
        workflow_state: this.QUEUED
      }, [['inserted_at', 'ascending']], {
        $set: {
          workflow_state: this.RESERVED,
          updated_at: new Date()
        }
      }, {
        "new": true
      }, callback);
    },
    remove: function(id) {
      return this.jobs.removeById(id);
    },
    jobs_by_queue: function(cb) {
      return this.jobs.group(['queue', 'workflow_state'], {}, {
        "count": 0
      }, "function(obj,prev){ prev.count++; }", true, cb);
    }
  };
  app.respond_with = function(resp, status) {
    return resp.end(JSON.stringify({
      status: status
    }));
  };
  app.get('/', function(req, resp) {
    return app.workman.jobs_by_queue(function(err, results) {
      return resp.end(err ? "No Results..." : JSON.stringify(results));
    });
  });
  app.post('/:queue', function(req, resp) {
    if ((req.body != null) && (req.body.job != null)) {
      app.workman.queue(req.params.queue, req.body.job);
      return app.respond_with(resp, 'success');
    } else {
      return app.respond_with(resp, 'error');
    }
  });
  app.get('/:queue', function(req, resp) {
    return app.workman.reserve(req.params.queue, function(err, job) {
      if (job) {
        job.id = job._id;
        return resp.end(JSON.stringify(job));
      } else {
        return app.respond_with(resp, 'empty');
      }
    });
  });
  app.del('/:queue/:id', function(req, resp) {
    app.workman.remove(req.params.id);
    return app.respond_with(resp, 'success');
  });
  app.listen(Number(process.env.PORT) || 8000, function() {
    app.workman.init(process.env.MONGOHQ_URL || 'localhost:27017/cloudq');
    return console.log('Listening...');
  });
  module.exports = app;
}).call(this);
