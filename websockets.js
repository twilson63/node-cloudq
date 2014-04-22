var Primus = require('primus');
var isJson = require('is-json');
var log = require('./logger').child({channel: 'ws'});;
var Middleware = require('./middleware');

var middleware = new Middleware();


var events = {
  data: function (msg) {
    var self = this;

    // validate JSON
    if (!isJson(msg, true)) {
      log.warn({rx: msg, address: self.address, conn_id: self.id}, 'bad JSON structure');
      return;
    }

    log.info({rx: msg, address: self.address, conn_id: self.id});

    // flow

    if (msg.op === 'STATS') {
      middleware.stats(function (err, stats) {
        if (err) {
          events.error(err);
          return self.write({error: err});
        }
        self.write(stats);
      });
      return;
    }

    if (msg.op === 'PUBLISH') {
      middleware.publish(msg.job, msg.queue, function (err, doc) {
        if (err) {
          events.error(err);
          return self.write({error: err});
        }
        self.write(doc);
      });
      return;
    }

    if (msg.op === 'CONSUME') {
      middleware.consume(msg.queue, function (err, doc) {
        if (err) {
          events.error(err);
          return self.write({error: err});
        }
        self.write(doc);
      });
      return;
    }

    if (msg.op === 'COMPLETE') {
      middleware.complete(msg.id, function (err, doc) {
        if (err) {
          events.error(err);
          return self.write({error: err});
        }
        self.write(doc);
      });
      return;
    }

  },

  error: function (err) {
    log.error(err);
  }
};

// OPS
// {queue:'test_mail', op:'PUBLISH', job: {job: {klass: 'Mailer', args: [{to: 'joaquim@yld.io', subject: 'hello world'}]}}}
// {queue:'send_mail', op:'PUBLISH', job:job_object}
// {queue:'send_mail', op:'COMPLETE', id:job_id}
// {op:'STATS'} - internal!!!!

module.exports = Websocket;

function Websocket (server, options) {
  var clients = {};
  var primus = new Primus(server, options);


  primus.on('connection', function ws_conn (spark) {
    log.info({address: spark.address, conn_id: spark.id}, 'new client connection');
    // keep client - use the connection id
    clients[spark.id] = spark;
    // spark events
    spark.on('data', events.data);
    spark.on('error', events.error);
  });

  primus.on('disconnection', function ws_disconn (spark) {
    log.info({address: spark.address, conn_id: spark.id}, 'client disconnected');
    // remove client
    delete clients[spark.id];
  });
}