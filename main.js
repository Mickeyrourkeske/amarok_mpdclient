
/* ###########################################################################
 * #                                                                         #
 * #   Copyright                                                             #
 * #                                                                         #
 * #   (C) Frederic Robra <fred@0011011.org>                                 #
 * #                                                                         #
 * #   This program is free software; you can redistribute it and/or modify  #
 * #   it under the terms of the GNU General Public License as published by  #
 * #   the Free Software Foundation; either version 2 of the License, or     #
 * #   (at your option) any later version.                                   #
 * #                                                                         #
 * #   This program is distributed in the hope that it will be useful,       #
 * #   but WITHOUT ANY WARRANTY; without even the implied warranty of        #
 * #   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the         #
 * #   GNU General Public License for more details.                          #
 * #                                                                         #
 * #   You should have received a copy of the GNU General Public License     #
 * #   along with this program; if not, write to the                         #
 * #   Free Software Foundation, Inc.,                                       #
 * #   51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.         #
 * ##########################################################################*/


Importer.loadQtBinding( "qt.core" );
Importer.include("MPClient.js");

var server = "10.0.0.3";
var port = "6600";
var SPLITTER = "*/MPDCLIENTSSPLITTER/*";

function onArtist() {
  var artists = mpc.getArtists();
  var item;
  var artist;
  for(var i in artists) {
    artist = artists[i];
    item = Amarok.StreamItem;
    item.level = 2;
    //item.coverUrl = ???;
    item.callbackData = artist;
    item.itemName = artist;
    //item.artist = artist;
    item.playableUrl = "";
    //item.infoHtml = ???;
    script.insertItem(item);
  }
}

function onAlbum(artist) {
  var albums = mpc.getAlbums(artist);
  Amarok.debug(albums);
  var album;
  var item;
  for(var i in albums) {
    album = albums[i];
    item = Amarok.StreamItem;
    item.level = 1;
    item.callbackData = artist + SPLITTER + album;
    //item.coverUrl = ???;
    item.itemName = album;
    item.playableUrl = "";
    item.album = album;
    //item.infoHtml = ???;
    item.artist = artist;
    script.insertItem(item);
  }
}

function onSong(artist, album) {
  var songs = mpc.getSongs(artist, album);
  Amarok.debug(songs);
  var song;
  var item;
  for(var i in songs) {
    song = songs[i];
    item = Amarok.StreamItem;
    item.level = 0;
    item.callbackData = "";
    //item.coverUrl = ???;
    item.itemName = song;
    item.playableUrl = "/tmp/" + artist + SPLITTER + album + SPLITTER + song + ".ogg";
    item.album = album;
    //item.infoHtml = ???;
    item.artist = artist;
    script.insertItem(item);
  }
}

/* Function connected with signal populate
 * For each level get the Data.
 * level: Level of Amarok
 * callback: callbackData from the level above
 * filter: search term
 */
function onPopulate(level, callback, filter) {
  Amarok.debug("Populating... [BUSY] Level: " + level + " Callback: " + callback + " Filter: " + filter);

  if(level == 2) {
    onArtist();
  }
  else if(level == 1) {
    onAlbum(callback);
  }
  else if(level == 0) {
    var split = callback.split(SPLITTER);
    onSong(split[0], split[1]);
  }
  
  script.donePopulating();
  Amarok.debug("Populating... [DONE] Level: " + level + " Callback: " + callback + " Filter: " + filter);
}

/* Main Function
 */
function main() {
  Amarok.debug("Initialize MPD Client");
  ScriptableServiceScript.call(this, "MPD Client", 3, "Let your MPD play!", "", true);
  
  //Initialize Playlist


}

script = new main();
script.populate.connect(onPopulate);
var mpc = new MPClient(server, port);

var playlist = mpc.getPlaylist();
var url;
var song;
for(var i in playlist) {
  song = playlist[i];
  url = createOgg(song);
  Amarok.Playlist.addMedia(new QUrl(url));
  
  //TODO create list of data in tmp, and delete them
}



QByteArray.prototype.toString = function() {
  var textStream = new QTextStream(this, QIODevice.ReadOnly);
  return textStream.readAll();
};

function createOgg(song) {
  var process = new QProcess(this);
  var url = "/tmp/" + song["artist"] + SPLITTER + song["album"] + SPLITTER + song["title"] + ".ogg";
  var minutes = song["time"].split(":")[0];
  var length = (minutes * 60) + song["time"].split(":")[1];
  process.start("dd if=/dev/zero bs=176400 count=" + length + " | oggenc - -r -o " + url  +
		" -a \"" + song["artist"] + "\"" +
		" -N \"" + song["track"] + "\"" +
		" -t \"" + song["title"] + "\"" +
		" -l \"" + song["album"] + "\"");
  
  return url;
}
