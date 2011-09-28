(function() {
  var app, job_id, request, root_uri;
  app = require('../index');
  request = require('request');
  root_uri = 'http://localhost:8000';
  job_id = '';
  describe('Successful Integration Tests', function() {
    it('POST /queue with no body fail', function() {
      request.post({
        uri: "" + root_uri + "/foobar",
        json: true
      }, function(err, resp, body) {
        expect(body.status).toEqual('error');
        return asyncSpecDone();
      });
      return asyncSpecWait();
    });
    it('POST /queue', function() {
      request.post({
        uri: "" + root_uri + "/foobar",
        json: {
          job: {
            klass: 'Jasmine',
            args: ['Rocks2']
          }
        }
      }, function(err, resp, body) {
        expect(body.status).toEqual('success');
        return asyncSpecDone();
      });
      return asyncSpecWait();
    });
    it('GET /queue', function() {
      request({
        uri: "" + root_uri + "/foobar",
        json: true
      }, function(err, resp, body) {
        job_id = body.id;
        expect(body.queue_state).toEqual('reserved');
        return asyncSpecDone();
      });
      return asyncSpecWait();
    });
    return it('DELETE /queue/:id', function() {
      request.del({
        uri: "" + root_uri + "/foobar/" + job_id,
        json: true
      }, function(err, resp, body) {
        expect(body.status).toEqual('success');
        return asyncSpecDone();
      });
      return asyncSpecWait();
    });
  });
}).call(this);
