define([
  "jquery",
  "underscore",
  "marionette-extensions",
  "views/PopoverView",
  "text!templates/nowplaying-popover.html",
  "text!templates/nowplaying-popover-lastfm.html"
  ], function($, _, Backbone, PopoverView, PopoverTemplate, PopoverContentTemplate) {

  var LastFmPopoverView = PopoverView.extend({

    template: PopoverContentTemplate,
    popoverTemplate: PopoverTemplate,
    initialize: function(options) {
      this.bindTo(this.vent, "nowplaying:lastfm:popover:toggle", this.toggle, this);
    },
    serializeData: function() {
      var lastFmCollection = this.model.getLastFmCollection();

      return _.chain(lastFmCollection.models)
        .filter(function(model) {
          return _.any(["album", "artist"], function(entity) {
            return model.get("entity") === entity;
          });
        })
        .sortBy(function(model) {
          return (model.get("entity") === "artist");
        })
        .map(function(model) {
          return {
            entity: model.get("entity"),
            name: model.get("name"),
            url: model.get("url"),
            image: model.getImageBySize(["medium"]),
            summary: model.get("summary")
          };
        })
        .value();
    },
    renderHtml: function(json) {
      return Backbone.Marionette.Renderer.render(this.template, {model: json});
    },
    onEnable: function() {
      this.vent.trigger("nowplaying:lastfm:popover:enabled", {
        target: $(this.el),
        model: this.model
      });
    },
    onShow: function() {
      this.vent.trigger("analytics:trackevent", "LastFm", "ShowPopover", this.model.toDebugString());
    }
  });
  return LastFmPopoverView;
});