define([
  "jquery",
  "backbone-kexp",
  "underscore",
  "indexeddb",
  "databases/LikedSongDatabase",
  "models/LikedSongModel"
  ], function($, Backbone, _, sync, LikedSongDatabase, LikedSongModel) {
  var LikedSongCollection = Backbone.Collection.extend({

    database: new LikedSongDatabase(),
    storeName: "songs",
    model: LikedSongModel,
    sync: sync,
    initialize: function() {

    },
    comparator: function(x, y) {
      if (x.get("likeCount") > y.get("likeCount")) {
        return -1;
      } else if (x.get("likeCount") === y.get("likeCount")) {

        if (x.get("timeLastLike") > y.get("timeLastLike")) {
          return -1;
        } else if (x.get("timeLastLike") === y.get("timeLastLike")) {
          return 0;
        } else {
          return -1;
        }
      } else {
        return 1;
      }
    },
    fetchSong: function(song, artist, album, options) {
      var self = this;
      options = options ? _.clone(options) : {};

      options.conditions = {
        song: song,
        artist: artist,
        album: album
      };

      return this.fetch(options)
        .done(function(collection, resp) {
          console.debug("%s indexeddb: {%s} => Song: {%s} Artist: {%s} Album: {%s}",
            (collection.length === 1 ? "[Found]" : "[Missing]"), self.database.id, song, artist, album);
        })
        .fail(function(collection, resp) {
          console.debug("[Fail] indexeddb: {%s} error [%s] => Song: {%s} Artist: {%s} Album: {%s}",
            self.database.id, resp, song, artist, album, resp);
        });
    }
  });
  return LikedSongCollection;
});