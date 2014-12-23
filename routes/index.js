/**
 *
 * Routes - holds the routes for the app
 * @param app
 */

var express = require('express'),
  path = require('path'),
  flow = require('flow'),
  router = express.Router();

  /**
   * Given a site ID or nickname, load the stats for that site.
   */
  //router.get('/sites/:id', function (req, res) {
  //
  //});


  router.get('/', function(req, res) {
    res.send('GuardDuty home page');
  })

  /**
   * Get all sites at once
   */
  router.get('/sites/all', function(req, res) {

    var siteStats = [];
    var files = require("fs").readdirSync(path.join(__dirname, '../sites'));
    files = files.map(function(file){
        return path.join(__dirname, '../sites', file);
    });


    var securedFiles = require("fs").readdirSync(path.join(__dirname, '../sites-secured'));
    securedFiles = securedFiles.map(function(file){
      return path.join(__dirname, '../sites-secured', file);
    });

    //Join the two arrays
    files = files.concat(securedFiles);

    flow.serialForEach(files, function (file) {
        //Each value in the array is passed here.
        //Call 'this' as cb

        if (path.extname(file) === ".js" && file != "index.js") {
          try {
            var operation = require(file);
            var page = new operation();
            var self = this;
            if (page && page.run) page.run(function () {
              //Finished running.
              //Grab the results object, then continue.
              var stats = page.getStats();
              siteStats.push(stats);
              self(); //continue on
            });
          }
          catch (e) {
            console.log("Error loading page " + e)
          }
        } else {
          this();
        }

      },
      function (err, newVal) {
        //cb results come here
        //var stats =
      },
      function () {
        //This is the end
        console.log("Finished them all.");
        res.setHeader('Content-disposition', 'attachment; filename=all.json');
        res.writeHead(200, {
          'Content-Type': 'application/json'
        });

        res.end(JSON.stringify(siteStats, null, true));
      })
  });

  module.exports = router;