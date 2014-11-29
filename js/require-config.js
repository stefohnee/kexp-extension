var require = {
  paths: {
    "backbone": "libs/backbone-min",
    "backbone-kexp": "plugins/backbone-kexp",
    "backbone-indexeddb": "libs/backbone-indexeddb",
    "backbone-localstorage": "libs/backbone-localstorage",
    "backbone-modelbinder": "plugins/Backbone.ModelBinder.min",
    "backbone-replete": "plugins/backbone-replete",
    "backbone-oauth": "libs/backbone-oauth",
    "bootstrap": "plugins/bootstrap",
    "detectzoom": "util/detectzoom",
    "ga": "https://ssl.google-analytics.com/ga",
    "gaq": "util/google-analytics",
    "htmlencoder": "util/htmlencoder",
    "jquery": "libs/jquery-2.1.1",
    "jquery-cycle": "plugins/jquery.cycle.all",
    "jquery-kexp": "plugins/jquery-kexp",
    "jquery-ui": "plugins/jquery-ui-1.11.2.custom",
    "datatables": "plugins/jquery.dataTables",
    "jquery.dataTables.sort": "plugins/jquery.dataTables.sort",
    "linkify": "util/ba-linkify",
    "machina": "libs/machina.min",
    "marionette": "libs/backbone.marionette",
    "marionette-deferredclose": "plugins/backbone.marionette-deferredclose",
    "marionette-kexp": "plugins/backbone.marionette-kexp",
    "md5": "util/md5",
    "moment": "libs/moment",
    "regexpatterns": "util/regexpatterns",
    "text": "libs/text",
    "toastr": "util/toastr",
    "twitter": "https://platform.twitter.com/widgets",
    "underscore": "libs/underscore",
  },
  shim: {
    "backbone-localstorage": ["backbone"],
    "bootstrap": ["jquery"],
    "jquery-cycle": ["jquery"],
    "jquery-kexp": ["jquery", "underscore"],
    "jquery-ui": ["jquery"]
  }
};