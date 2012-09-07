
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
 * #   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the          #
 * #   GNU General Public License for more details.                          #
 * #                                                                         #
 * #   You should have received a copy of the GNU General Public License     #
 * #   along with this program; if not, write to the                         #
 * #   Free Software Foundation, Inc.,                                       #
 * #   51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.         #
 * ##########################################################################*/

var SPLITTER = "*/MPDCLIENTSPLITTER/*";
/* MPClient
 */
function MPClient(server, port) {
  //public:
  this.getArtists = function() {
    return getMPDArray(LIST_ARTIST);
  };

  this.getAlbums = function(artist) {
    return getMPDArray(LIST_ALBUM + ARTIST + '\"' + artist+ '\"');
  };

  this.getSongs = function(artist, album) {
    var query = ARTIST + '\"' + artist + '\"' + ALBUM + '\"' + album + '\"';
    var songs = getMPDArray(LIST_TITLE + query);
    
    for(var i in songs) {
      var title = songs[i];
      var number = queryMPD(LIST_TRACK + query + TITLE + '\"' + title + '\"');
      if(number.length() != 0) {
	//title with number 03/12 (3 from 12)
	songs[i] = number.toString().split("/")[0] + " - " + title;
      }
    }
    
    return songs;
  };
  
  //complete playlist by files mpc -q -h 10.0.0.3 -p 6600 -f %file% playlist
  //Something like
  //... -f "[[%artist%]| ]SPLITTER[[%album%]| ]SPLITTER[[%track%]| ]SPLITTER[[%title%]|[%file%]]SPLITTER[%time%]" playlist
  //output: Joe LallySPLITTERNothing Is UnderratedSPLITTERTonight At TenSPLITTER2:33
  this.getPlaylist = function() {
    var data = getMPDArray(" -f \"" +
			    "[[%artist%]| ]" + SPLITTER +
			    "[[%album%]| ]" + SPLITTER +
			    "[[%track%]| ]" + SPLITTER +
			    "[[%title%]|[%file%]]" + SPLITTER +
			    "[%time%]" +
			    "\" playlist");
    Amarok.alert(data.length);
    var playlist = new Array();
    var song;
    var query;
    for(var i in data) {
      query = data[i].split(SPLITTER);
      //Amarok.alert(query);
      song = new Array();
      song["artist"] = query[0];
      song["album"] = query[1];
      song["track"] = query[2].split("/")[0];
      song["title"] = query[3];
      song["time"] = query[4];
      playlist.push(song);
    }
    return playlist;
  };
  
  var LIST = " list ";
  var ARTIST = " Artist ";
  var TITLE = " Title ";
  var ALBUM = " Album ";
  var TRACK = " Track ";
  var LIST_ARTIST = LIST + ARTIST;
  var LIST_TITLE = LIST + TITLE;
  var LIST_ALBUM = LIST + ALBUM;
  var LIST_TRACK = LIST + TRACK;
  
  function queryMPD(command) {
    var process = new QProcess(this);
    
    process.start("mpc -q -h " + server + " -p " + port + command);
    process.waitForFinished();

    return process.readAllStandardOutput();
  }
  
  function getMPDArray(command) {
    var bytes = queryMPD(command);
    var data = new Array();
    
    var textStream = new QTextStream(bytes, QIODevice.ReadOnly);
    while(!textStream.atEnd()) {
      data.push(textStream.readLine());
    }
    //data.sort();
    return data;
  }
  
}


QByteArray.prototype.toString = function() {
  var textStream = new QTextStream(this, QIODevice.ReadOnly);
  return textStream.readAll();
}
