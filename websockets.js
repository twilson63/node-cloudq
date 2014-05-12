var Primus = require('primus');
var isJson = require('is-json');
var log = require('./logger').child({origin: 'ws'});
var Middleware = require('./middleware');
var auth = require('./lib/auth');

// a handler for primus events
var events = {};

events.error = function (err) {
  log.error(err);
};

events.data = function (msg) {
  var self = this;

  // validate JSON
  if (!isJson(msg, true)) {
    log.warn({rx: msg, address: self.address, conn_id: self.id}, 'bad JSON structure');
    return;
  }

  log.info({rx: msg, address: self.address, conn_id: self.id});


  // FLOW

  // generic callback
  function callback (err, res) {
    if (err) {
      events.error(err);
      return self.write({error: err.message});
    }

    var write_res = self.write(res);
    log.info({write_res: write_res, address: self.address, conn_id: self.id}, 'result from socket write');
  }

  switch (msg.op) {
    case 'STATS':
      Middleware.stats(callback);
      break;
    case 'PUBLISH':
      Middleware.publish(msg.job, msg.queue, callback);
      break;
    case 'CONSUME':
      // is the first "consume op" then set the queue for the worker
      if (!self.workerId) self.workerId = Middleware.addWorker(msg.queue, 'ws', self);
      // consume job
      Middleware.consume(self.workerId, msg.queue, callback);
      break;
    case 'COMPLETE':
      Middleware.complete(self.workerId, msg.id, callback);
      break;
     case 'WORKERS':
      self.write({online: Middleware.workersOnline()});
      break;
    default:
      callback(new Error('operation don\'t exist!'));
      break;
  }
};

module.exports = Websocket;

function Websocket (server, options) {
  var clients = {};
  var primus = new Primus(server, options);

  primus.authorize(auth.ws);

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
    // and remove from workers list
    Middleware.rmWorker(spark.workerId);
  });
}
