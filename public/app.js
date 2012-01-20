Ext.application({
  name: 'MyApp',
  launch: function() {
    Ext.define('Queue', {
       extend: 'Ext.data.Model',
       fields: ['key', 'value']
    });

    var store = Ext.create('Ext.data.Store', {
       model: 'Queue',
       sorters: 'name',
       proxy: {
         type: 'ajax',
         url: '/queues',
         reader: { 
           root: 'rows',
           type: 'json'
         }
       },
       autoLoad: true
    });

    var list = Ext.create('Ext.List', {
       fullscreen: true,
       items:[
        {xtype: 'toolbar', title: 'CloudQ'}
       ],
       style: 'color: green;',
       itemTpl: '<div class="queue">{key} <span style="float:right">{value}</span></div>',
       store: store
    });
    
  }
});