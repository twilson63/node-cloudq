var http = require('http');
var format = require('util').format;
var Primus = require('primus');
var nock = require('nock');



var ip = 'localhost';
var port = 5000;


// launch cloudq server
require('../app').listen(port);

nock('http://localhost:5984/cloudq')
  .post('/cloudq')
  .reply(201, {ok: true});


var Socket = Primus.createSocket({
  transformer: 'engine.io',
  parser: 'JSON',
  pathname: '/cloudq'
});

function auth (cb) {
  var options = {
    hostname: ip,
    port: port,
    path:'/cloudq',
    agent:false,
    headers: {'Authorization': 'Basic ' + new Buffer('test:test').toString('base64')}
  };

  http.get(options, function (res) {
    cb(null, res.statusCode !== 401 ? 'ok' : 'nok');
  })
  .on('error', cb);
}


describe('Cloudq#Websockets#publishJob', function () {
  it('should post successfully and return ok', function (done) {
    var theJob = {
      queue:'send_mail',
      op:'PUBLISH',
      job: {
        job: {
          klass: 'Mailer',
          args: [{
            to: 'hello@world.com',
            subject: 'hello world'
          }]
        }
      }
    };

    var client = new Socket(format('http://%s:%d', ip, port));

    client.on('outgoing::open', function () {
      auth(function (err, code) {

        client.on('data', function (data) {
          done();
        });

        client.on('open', function () {
          client.write(theJob);
        });

        client.on('error', done)

        done();
      });
    });
  });
});