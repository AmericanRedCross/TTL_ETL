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


router.get('/run', function(req, res) {
  etl.run(function (err, data) {
    res.send('Running ETL.');
  });
})


module.exports = router;