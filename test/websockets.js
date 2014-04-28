var http = require('http');
var Primus = require('primus');
var nock = require('nock');
var assert = require('assert');

var ip = 'localhost';
var port = 5000;


process.env.TOKEN = 'A6JXsEdzD_y4_UqtAAAA';
process.env.SECRET = 'A6JXsEdzD_y4_UqtAAAA';
process.env.COUCH = 'http://localhost:5985';

// launch cloudq server
require('../app').listen(port);

// couchdb
// PUBLISH
nock(process.env.COUCH + '/cloudq')
  .post('/cloudq')
  .reply(201, {ok: true});

// CONSUME
nock(process.env.COUCH)
 .get('/cloudq/_design/queue/_view/next?startkey=%5B%22foo%22%2C1%5D&endkey=%5B%22foo%22%2C100%5D&limit=1')
 .reply(200, { rows: [{ id: 1, key: ["foo", 1], value: { klass: "foo", args: ["bar"]}}]});

nock(process.env.COUCH)
 .put('/cloudq/_design/dequeue/_update/id/1')
 .reply(201, 'success');

// COMPLETE
 nock(process.env.COUCH)
 .put('/cloudq/_design/complete/_update/id/d23bf9199f0b7b171d2be391cf01d954')
 .reply(200, 'success');


// WS Socket
var Socket = Primus.createSocket({
  transformer: 'engine.io',
  parser: 'JSON',
  pathname: '/cloudq'
});

// basic auth
function auth (cb) {
  var options = {
    hostname: ip,
    port: port,
    path:'/cloudq',
    agent:false,
    headers: {'Authorization': 'Basic ' + new Buffer(process.env.TOKEN + ':' + process.env.SECRET).toString('base64')}
  };

  http.get(options, function (res) {
    cb(null, res.statusCode !== 401 ? 'ok' : 'nok');
  })
  .on('error', cb);
}



describe('Cloudq#Websockets', function () {
  it('should publish a job successfully and return ok', function (done) {
    this.timeout(0);

    var theJob = {
      queue:'foo',
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

    var primus = new Socket('http://' + ip + ':' + port);

    primus.on('outgoing::open', function () {
      auth(function (err, code) {
        assert.ifError(err);
      });
    });

    primus.on('data', function (data) {
      assert.strictEqual(data, {ok: true});
      primus.end();
      done();
    });

    primus.on('open', function () {
      setTimeout(done, 2000);
      var res = primus.write(theJob);// {ok: true}
      assert.ok(res);
      // client.emit('data', {ok: true});
    });

    primus.on('error', function (err) {
      assert.ifError(err);
    });
  });


  it('should consume a job successfully and return ok', function (done) {
    this.timeout(0);

    var consume = {
      queue:'foo',
      op:'CONSUME'
    };

    var primus = new Socket('http://' + ip + ':' + port);

    primus.on('outgoing::open', function () {
      auth(function (err, code) {
        assert.ifError(err);
      });
    });

    primus.on('data', function (data) {
      assert.strictEqual(data, {ok: true});
      primus.end();
      done();
    });

    primus.on('open', function () {
      setTimeout(done, 1000);
      var res = primus.write(consume);
      assert.ok(res);
      // client.emit('data', {ok: true});
    });

    primus.on('error', function (err) {
      assert.ifError(err);
    });
  });


  it('should close a job successfully and return ok', function (done) {
    this.timeout(0);

    var complete = {
      op:'COMPLETE',
      id: 'd23bf9199f0b7b171d2be391cf01d954'
    };

    var primus = new Socket('http://' + ip + ':' + port);

    primus.on('outgoing::open', function () {
      auth(function (err, code) {
        assert.ifError(err);
      });
    });

    primus.on('data', function (data) {
      assert.strictEqual(data, {ok: true});
      primus.end();
      done();
    });

    primus.on('open', function () {
      setTimeout(done, 1000);
      var res = primus.write(complete);
      assert.ok(res);
      // client.emit('data', {ok: true});
    });

    primus.on('error', function (err) {
      assert.ifError(err);
    });
  });
});