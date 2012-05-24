define([
  "jquery",
  "underscore",
  "marionette-extensions",
  "collections/AppConfigCollection",
  "views/LastFmOptionsItemView",
  "text!templates/options.html"
  ], function($, _, Backbone, AppConfigCollection,
    LastFmOptionsItemView, ViewTemplate) {

  var OptionsView = Backbone.Marionette.CompositeView.extend({
    tagName: "div",
    className: "view-options kexp-box kexp-box-striped",
    template: ViewTemplate,
    initialize: function(options) {
      if (!this.collection) {
        this.collection = new AppConfigCollection();
      }

      this.bindTo(this.collection, "change", function(model, options) {
        model.save();
      });
    },
    getItemView: function() {
      return {};
    },
    buildItemView: function(item, ItemView){
      var view;
      if (item.id === "lastfm") {
        view = new LastFmOptionsItemView({
          model: item,
          collection: this.collection
        });
      }

      if (!view) throw new Error("Unable to determine view for item " + item.id);
      return view;
    },
    addItemView: function(item, ItemView) {
      // Features currently doesn't have a view, so skip
      if (item.id === "features") return;
      Backbone.Marionette.CollectionView.prototype.addItemView.call(this, item, ItemView);
    },
    appendHtml: function(collectionView, itemView) {
      collectionView.$("#container-options fieldset").append(itemView.el);
    }
  });
  return OptionsView;
});