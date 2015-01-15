/**
 *
 * Routes - holds the routes for the app
 * @param app
 */

var express = require('express'),
  path = require('path'),
  flow = require('flow'),
  common = require('../common.js'),
  router = express.Router();


//var Router = function(server) {
//  this.router = router;
//  this.io = require('./socket.js').listen(server);
//}

var ETL = require("../contollers/ETL.js");
var etl = new ETL();

var S3Uploader = require("../contollers/S3Uploader.js");
var s3 = new S3Uploader();

var Backup = require("../contollers/Backup.js");
var backup = new Backup();

var Reporter = require("../contollers/Reporter.js");
var reporter = new Reporter();

//For grabbing report settings
var report_settings = require("../public/js/reports/reports.js");

var _stats = {};  //Keep track of stats since service has been alive.

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


router.get('/surveys', function(req, res) {
    var Survey = require("../contollers/Surveys.js");
    var survey = new Survey();

    survey.fetchFormHubFormList(function(err, list){
        //Got List.

        //Return it as JSON.
        if(err){

          res.end("Error getting list.");
          return;
        }

        //End with JSON.
        res.end(JSON.stringify(list, null, true));

    });
})

router.get('/stats', function(req, res) {

    //Get stats on latest backup
    _stats.latest = s3.getStats();
    _stats.etl = etl.getStats();

    //End with JSON.
    res.end(JSON.stringify(_stats, null, true));

})


router.get('/reports/:report_name', function(req, res) {

  var report_name = req.params.report_name;
  if(report_name) {
    //Try to find the query from reports/reports.js
    reporter.runReport(report_name, function (err, result) {

      if (err) {
        res.end(JSON.stringify(err, null, true));
        return;
      }


      //End with JSON.
      res.end(JSON.stringify(result, null, true));

    })

  }

})


//Using the report name, pull the csv from the scope hash and send it back as a csv.
//Assumes that the runReport() method has fired, and that the result is stored in a hash.
router.get('/reports/:report_name/csv', function(req, res) {

  reporter.getReport(req.params.report_name, function(result){

    var args = { format: 'csv' };
    args.featureCollection = common.formatters.CSVFormatter(result);
    args.name = req.params.report_name;

    common.respond(req, res, args, function(){

    })

  });

})



module.exports = router;