
  module.exports = 
  {
    "language": "javascript",
    "views": {
      "queued": {
        "map": "function(doc) { if(doc.queue_state === \"queued\") { emit(doc.queue, doc); } return true; }"
      },
      "reserved": {
        "map": "function(doc) { if(doc.queue_state === \"reserved\") { emit(doc.queue, doc); } return true; }"
      },
      "groups": {
        "map": "function(doc) { emit(doc.queue + '-' + doc.queue_state, 1); return true; }",
        "reduce": "function(keys, values) { return sum(values); }"
      }
    },
    "updates": {
      "dequeue": "function(doc, req) { doc.queue_state = req.query.state; return [doc, \"queue state changed\"]; }"
    }
  }
;
