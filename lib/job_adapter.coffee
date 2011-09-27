# Mixins
extend = (obj, mixin) ->
  obj[name] = method for name, method of mixin        
  obj

include = (klass, mixin) -> extend klass.prototype, mixin

# cloudqAdapter
class jobAdapter

  constructor: (job, adapter) ->
    include this, job
    include this, adapter
