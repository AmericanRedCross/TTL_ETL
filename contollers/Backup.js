/**
 * Created by ryanwhitley on 12/31/14.
 */

var settings = require("../settings/settings.js"),
common = require("../common.js"),
flow = require("flow"),
fs = require('fs'),
zlib = require('zlib'),
moment = require("moment");

var Backup = function() {
  //if(io) common.createSocketOutput(io); //Use the common socket output to common.log to.
}

/**
 *
 * @param dbName - name of the postgres DB to backup (optional).
 * @param cb - callback function.
 */
Backup.prototype.backupDB = function(cb, dbName) {

  //If a dbname is passed in, try that one.  Otherwise, use the DB specified in settings.js
  var database = dbName || settings.pg.database;

  var timestamp = moment().format('YYYY-MM-DDHHmmss');

  var outputFile = settings.pg.backup_directory + "/" + database + timestamp + ".out";

  common.run_cmd( "pg_dump -O -v " + database + " > " + outputFile, [], function(err, text) {

    console.log(text);

    if (cb) cb(err, text);

  });

}

module.exports = Backup;
