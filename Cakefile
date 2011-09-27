{ exec } = require 'child_process'
# ANSI Terminal Colors
bold = '\033[0;1m'
green = '\033[0;32m'
reset = '\033[0m'

log = (message, color, explanation) ->
  console.log color + message + reset + ' ' + (explanation or '')

task 'build', ->
  exec 'coffee -c index.coffee', (err, stdout, stderr) ->
    return console.log stderr if err
    console.log ':)'

task 'spec', ->
  exec 'jasmine-node spec --coffee', (err, stdout, stderr) ->
    console.log stdout.trim() + "\n:)"
