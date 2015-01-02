/**
 *
 * Routes - holds the routes for the app
 * @param app
 */

var express = require('express'),
  path = require('path'),
  flow = require('flow'),
  router = express.Router();

var ETL = require("../contollers/ETL.js");
var etl = new ETL();

var S3Uploader = require("../contollers/S3Uploader.js");
var s3 = new S3Uploader();

var Backup = require("../contollers/Backup.js");
var backup = new Backup();


router.all("/runall", flow.define(

  function(req, res) {

    //Pull Down Formhub data, Do a backup of the PostGres DB, ship the backup to S3.
    //Tuck these away for later access using 'this' context.
    this.req = req;
    this.res = res;

    //Run the FormHub ETL
    console.log("Running Formhub Downloader.");
    etl.run(this);

  },
  function(err, data) {

    //Now, backup the DB.
    console.log("Finished Formhub Download.");
    console.log("Backing up DB");

    backup.backupDB(this);

  },
  function(err, result) {

    //Find most recent backup file.
    s3.getLatestBackup(this);

  },function (err, filePath) {

      if (err) {
        console.log('Problem backing up PostGres.');
        return;
      }

      //if we have a filePath
      if (filePath) {
        this.filePath = filePath;
        s3.upload(filePath, this);
      }
      else {
        console.log("Didn't find any backups to send.  Make sure settings have the correct backup folder specified.");
        this();
      }



  },function (err, data) {

    //Done.
    if(this.filePath){
      console.log(this.filePath + ' sent to S3. RunAll is Done.');
      this.res.send("Formhub download, DB Backup and S3 upload complete.");
    }
    else{
      this.res.send("Looks like we couldn't find the latest backup file to send to S3.");
    }

  }

))

router.get('/etl', function(req, res) {
  etl.run(function (err, data) {
    res.send('Running ETL.');
  });
})

router.all("/backup", function(req, res){

   //Do a backup of the PostGres DB.
  backup.backupDB(function(err, result){
    res.send('Backed up DB.');
  });

  //Also, do any cleanup of older files.

})

router.all("/sendtos3", function(req, res){

  //Find most recent backup file, and try to ship it up to S3.
  s3.getLatestBackup(function(err, filePath){

    if(err){
      res.send('Problem backing up PostGres.');
      return;
    }

    //if we have a filePath
    if(filePath){
      s3.upload(filePath, function (err, data) {
        res.send(filePath + ' sent to S3. Done.');
      });
    }
    else{
      res.send("Didn't find any backups to send.  Make sure settings have the correct backup folder specified.");
    }

  });

})

module.exports = router;