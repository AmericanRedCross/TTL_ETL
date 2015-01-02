/**
 * Created by ryanwhitley on 12/31/14.
 */

var settings = require("../settings/settings.js"),
common = require("../common"),
flow = require("flow"),
  _ = require("underscore-node"),
  path = require("path"),
  fs = require("fs");


var AWS = require("./AWS.js")
var aws = new AWS();

var S3Uploader = function() {

}


S3Uploader.prototype.upload = function(filePath, cb) {

  //Go get the surveys.  When we've finished, flow to the next function block
  aws.uploadToS3(filePath, function(err, data){

    cb("Done");

  });

}


//Look thru a known folder of backups and look to see if there are any, and pluck the most recent.
S3Uploader.prototype.getLatestBackup = function(cb) {

  var dir = (settings.pg.backup_directory) || "./backups";

  var matched_files = [];

  //Look in a backup folder and find files.
  fs.readdirSync(dir).forEach(function (file) {
    var ext = path.extname(file);

    var valid_extensions = (settings.pg.backup_extensions) || [".out", ".sql", ".bak"];

    if (valid_extensions.indexOf(ext) > -1) {
      matched_files.push(file);
    }
  });

  //Matched Files should contain any valid SQL backups.
  //If there are any, see which one is the latest.
// use underscore for max()
  var latest = _.max(matched_files, function (f) {
    var fullpath = path.join(dir, f);

    // ctime = creation time is used
    // replace with mtime for modification time
    return fs.statSync(fullpath).ctime;
  });

  //Latest has only the file name
  //Add the full path.
  if(latest){
    cb(null, path.join(dir, latest));
  }
  else{
    cb(null, null);
  }

}



module.exports = S3Uploader;
