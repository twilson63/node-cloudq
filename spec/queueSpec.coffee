queue = require '../lib/queue'

# currently requires mongo to locally be running....
describe 'queue', ->
  it '#init', ->
    queue.init()
    expect(queue.db).toBeDefined()
    expect(queue.jobs).toBeDefined()
