var Primus = require('primus');
var isJson = require('is-json');
var log = require('./logger');
var Middleware = require('./middleware');



var workflow = {
  data: function (data) {
    if (!isJson(data)) {
      log.warn({origin: 'ws', rx: data, address: this.address}, 'bad JSON structure');
      return;
    }

    log.info({origin: 'ws', rx: data, address: this.address});



  },
  error: function (err) {
    log.error(err, 'websocket error');
  }
};

// {queue:'send_mail', op:'PUBLISH', job:job_object}
// {queue:'send_mail', op:'CONSUME'}
// {queue:'send_mail', op:'COMPLETED', id:job_id}


module.exports = Websocket;

function Websocket (server, options) {
  var clients = {};
  var primus = new Primus(server, options);
  var middleware = new Middleware();


  primus.on('connection', function ws_conn (spark) {
    log.info({address: spark.address, ws_session: spark.id}, 'websocket new connection');
    // keep client
    clients[spark.id] = spark;

    spark.on('data', workflow.data);
    spark.on('error', workflow.error);
  });

  primus.on('disconnection', function ws_disconn (spark) {
    log.info({address: spark.address, ws_session: spark.id}, 'websocket disconnection');
    // remove client
    delete clients[spark.id];
  });
}