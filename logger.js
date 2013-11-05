var bunyan = require('bunyan');
var log = bunyan.createLogger({
  name: 'cloudq',
  serializers: {
    req: bunyan.stdSerializers.req,
    res: bunyan.stdSerializers.res
  }
});

module.exports = log;