var conn = require('../conn')();

describe('conn', function() {
  it('return localhost', function(done) {
    console.log(conn);
    done();   
  });
});