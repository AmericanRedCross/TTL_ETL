/**
 * Created by ryanwhitley on 12/31/14.
 */

var services = require("aws-sdk"),
settings = require("../settings/settings.js"),
common = require("../common.js"),
flow = require("flow"),
fs = require('fs'),
zlib = require('zlib');

var AWS = function() {

  // PostGIS Connection String
  this.params = {Bucket: settings.s3.bucket, Key: 'ARC'};
  this.s3 = new services.S3();


}



AWS.prototype.uploadToS3 = function(filePath, cb) {

  var body = fs.createReadStream(filePath).pipe(zlib.createGzip());
  this.s3.upload({Body: body, Bucket: this.params.Bucket, Key: this.params.Key}).
    on('httpUploadProgress', function(evt) {
      console.log(evt);
    }).
    send(function(err, data) {
      cb(err, data)
    });

}

module.exports = AWS;
