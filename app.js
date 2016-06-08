var flow = require('flow');
var CronJob = require('cron').CronJob;

var ETL = require("./contollers/ETL.js");
var etl = new ETL();

var S3Uploader = require("./contollers/S3Uploader.js");
var s3 = new S3Uploader();

var Backup = require("./contollers/Backup.js");
var backup = new Backup();


var job = new CronJob({
  cronTime: '00 30 01 * * *',
  onTick: function() {
    // Runs every day at 01:30:00 AM Manila time (time zone set below)
    flow.exec(

      function() {

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
          console.log("Didn't find any backups to send. Make sure settings have the correct backup folder specified.");
          this();
        }

      },function (err, data) {

        //Done.
        if(this.filePath){
          console.log(this.filePath + ' sent to S3. RunAll is Done.');
          this();
        }
        else{
          console.log("Looks like we couldn't find the latest backup file to send to S3.");
          this();
        }

      }

    );

  },
  start: false,
  timeZone: 'Asia/Manila'
});
job.start();
