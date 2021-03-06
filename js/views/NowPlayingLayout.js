define([
  "jquery",
  "underscore",
  "marionette-kexp",
  "views/NowPlayingFsm",
  "views/NowPlayingSongView",
  "views/NowPlayingFooterView",
  "views/LastFmMetaView",
  "views/NowPlayingErrorView",
  "collections/NowPlayingCollection",
  "text!templates/nowplaying.html"
  ], function($, _, Marionette, NowPlayingFsm, NowPlayingSongView, NowPlayingFooterView,
    LastFmMetaView, NowPlayingErrorView, NowPlayingCollection, LayoutTemplate) {

  // Value is used as mask, so order matters
  var ShowType = {
    Reset: 0,
    Page: 1,
    Update: 2,
    New: 3
  };
  Object.freeze(ShowType);


  var NowPlayingLayout = Marionette.Layout.extend({

    template: LayoutTemplate,
    regions: {
      song: "#region-nowplaying-song",
      meta: "#region-nowplaying-meta",
      footer: "#region-nowplaying-footer"
    },
    initialize: function(options) {
      options || (options = {});
      
      if (this.collection === undefined) {
        this.collection = new NowPlayingCollection();
      }

      this.popoverEl = options.popoverEl || "#navbar-top";
    },
    initialEvents: function() {
      var layout = this;
      _.bindAll(this, "handleManualPageReset");

      this._bindCollection = _.once(function() {
        layout.bindTo(layout.collection, "add", layout.handleNewSong, layout);
        layout.bindTo(layout.collection, "change", layout.handleUpdatedSong, layout);
        layout.bindTo(layout.collection, "error", layout.handleError, layout);
      });

      this.bindTo(this.vent, "nowplaying:refresh:manual", this.handleManualRefresh, this);
      this.bindTo(this.vent, "nowplaying:page:prev", this.handlePagePrev, this);
      this.bindTo(this.vent, "nowplaying:page:next", this.handlePageNext, this);
    },
    onShow: function() {
      var self = this,
          mostRecentModel = this.collection.last();

      this.showNowPlaying(mostRecentModel, ShowType.Reset);
      // Bind collection events here incase a fetch is in progress during initialize
      self._bindCollection();
    },
    showNowPlaying: _.debounce(function(nowPlayingModel, showType) {

      if (this._currentLoader) {
        delete this._currentLoader;
      }

      var layout = this,
          loader = new NowPlayingFsm(nowPlayingModel);

      showType || (showType = ShowType.New);

      // Skip New or Changed models if Manual page is activated and current page is not the model
      if (showType > ShowType.Page && this.hasManualPageEnabled() && this.song.model !== nowPlayingModel) {
        return;
      }

      // Shortcut for Updates
      if (showType === ShowType.Update && this.song.model === nowPlayingModel) {
        this.showSongView(nowPlayingModel);
        return;
      }
      
      this._currentLoader = loader;

      loader.on("initialized", function(model) {
        layout.showSongView(model);
      });
      loader.on("resolve:liked", function(model) {
        layout.showFooterView(model);
      });
      loader.on("resolve:lastfm", function(model) {
        layout.showMetaView(model);
      });
      loader.on("reconciled", function(model) {
        console.log("[NowPlaying: Resolved] %s", model.toDebugString());
        layout.vent.trigger("nowplaying:cycle", model);
        //loaderDfr.resolve(model);
      });
      loader.on("error", function(model, error) {
        layout.vent.trigger("analytics:trackevent", "NowPlaying", "Error",
          _.isObject(model) && _.isFunction(model.toDebugString) ?
            model.toDebugString() : "");
        layout.showErrorView();
        layout.vent.trigger("nowplaying:cycle", model);
        //loaderDfr.reject(model, error);
      });
      // Wait for fade out transitions
      $.when(
        layout.footer ? layout.footer.close() : true,
        layout.meta ? layout.meta.close() : true)
        .then(function() {
          //console.debug("[Now Playing] => Fade-out Complete");
          loader.handle("initialize");
        });

      //return loaderDfr.promise();
    }, 200, true),
    showSongView: function(nowPlayingModel) {
      var songView = new NowPlayingSongView({
        vent: this.vent,
        appConfig: this.appConfig,
        model: nowPlayingModel
      });
      return this.song.show(songView, "append");
    },
    showFooterView: function(nowPlayingModel) {
      var songIndex = this.collection.indexOf(nowPlayingModel);
      var footerView = new NowPlayingFooterView({
        vent: this.vent,
        appConfig: this.appConfig,
        model: nowPlayingModel,
        pager: {
          canPagePrev: songIndex > 0,
          canPageNext:  songIndex < this.collection.size() - 1
        }
      });
      
      var regionView = this.footer.show(footerView, "append");
      
      // Footer is hidden on error (we want full region height)
      this.footer.$el.toggleClass("hide", false);
      return regionView;
    },
    showMetaView: function(nowPlayingModel) {
      var metaView = new LastFmMetaView({
        vent: this.vent,
        appConfig: this.appConfig,
        model: nowPlayingModel,
        popoverEl: this.popoverEl
      });
      return this.meta.show(metaView, "append");
    },
    showErrorView: function(nowPlayingModel) {
      // Footer is hidden on error (we want full region height)
      $(this.footer.el).toggleClass("hide", true);
      
      var errorView = new NowPlayingErrorView({
        vent: this.vent,
        appConfig: this.appConfig,
        model: new Backbone.Model({
          canPagePrev: this.collection.size() > 0
        })
      });
      return this.song.show(errorView, "append");
    },
    hasManualPageEnabled: function() {
      return (!_.isUndefined(this._manualPageTimeoutId));
    },
    disableManualPage: function() {
      if (!_.isUndefined(this._manualPageTimeoutId)) {
        window.clearTimeout(this._manualPageTimeoutId);
        delete this._manualPageTimeoutId;
      }
    },
    enableManualPage: function() {
      this.disableManualPage();
      this._manualPageTimeoutId = window.setTimeout(this.handleManualPageReset, 30 * 1000);
    },
    handleError: function(collection, model) {
      console.debug("[NowPlaying: Error] - Unable to upsert now playing to view collection");
      this.showNowPlaying(null, ShowType.Reset);
      this.vent.trigger("nowplaying:cycle");
    },
    handleNewSong: function(model, collection) {
      console.debug("[NowPlaying: New] - Added new %s to view collection", model.toDebugString());
      this.showNowPlaying(model, ShowType.New);
      this.vent.trigger("nowplaying:cycle", model);
    },
    handleUpdatedSong: function(model) {

      var identityChange = _.any(Object.keys(model.changed), function(key) {
        return model.frozenAttributeKeys.indexOf(key) !== -1;
      });
      var songChange = _.any(Object.keys(model.changed), function(key) {
        return model.amendableAttributeKeys.indexOf(key) !== -1;
      });

      if (identityChange) {
        console.debug("[NowPlaying: Identity Change] - %s", model.toDebugString());
        this.showNowPlaying(model, ShowType.New);
      } else if (songChange) {
        console.debug("[NowPlaying: Updated] - Attributes changed for %s", model.toDebugString());
        this.showNowPlaying(model, ShowType.Update);
      }
    },
    handleManualRefresh: function() {
      if (this.hasManualPageEnabled()) {
        this.handleManualPageReset();
      }
      this.collection.fetch({upsert: true});
    },
    handleManualPageReset: function() {
      this.disableManualPage();
      var mostRecentNowPlaying = this.collection.last();
      if (this.song.model !== mostRecentNowPlaying) {
        this.showNowPlaying(mostRecentNowPlaying, ShowType.Reset);
      }
    },
    handlePagePrev: function(model) {
      var songIndex = this.collection.indexOf(model) - 1;
      if (songIndex >= 0) {
        this.showNowPlaying(this.collection.at(songIndex), ShowType.Page);
        this.enableManualPage();
      } else {
        this.handleManualPageReset();
      }
    },
    handlePageNext: function(model) {
      var songIndex = this.collection.indexOf(model) + 1;
      if (songIndex > 0 && songIndex <= this.collection.size() - 1) {
        this.showNowPlaying(this.collection.at(songIndex), ShowType.Page);
        this.enableManualPage();
      }
    },
    beforeClose: function() {
      this.disableManualPage();
      // Song "could" be loading during close.  This should kill any event handlers
      delete this._currentLoader;
    }
  });

  return NowPlayingLayout;
});