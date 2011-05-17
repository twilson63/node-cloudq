{ exec } = require 'child_process'
# ANSI Terminal Colors
bold = '\033[0;1m'
green = '\033[0;32m'
reset = '\033[0m'

log = (message, color, explanation) ->
  console.log color + message + reset + ' ' + (explanation or '')

task 'bundle', ->
  exec([
    "npm install meryl"
    "npm install connect"
    "npm install mongoskin"
  ].join(' && '), (err, stdout, stderr) ->
    if err then console.log stderr.trim() else log 'done :-)', green
  )


task 'spec', ->
  exec 'jasmine-node specs --coffee', (err, stdout, stderr) ->
    if err then console.log stderr.trim() else console.log stdout.trim()

