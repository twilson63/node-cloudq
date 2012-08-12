assert = require 'assert'
pin = require '../'

describe 'linchpin', ->
  it 'should emit events', (done) ->
    pin.on 'foo', -> 
      assert true
      done()
    pin.emit 'foo'