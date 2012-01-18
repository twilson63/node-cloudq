broadway = require 'broadway'
queue = new broadway.App()
queue.use(require(process.env.PLUGIN or './plugins/couchdb'))

# # Queue
# 
# This object allows the server to queue, reserve, remove and group Jobs.
queue.QUEUED = 'queued'
queue.RESERVED = 'reserved'
module.exports = queue