/**
 * Created by ryanwhitley on 1/9/14.
 */

var settings = require("../settings/settings.js"),
  common = require("../common.js"),
  reports = require("../public/js/settings/reports.js"),
  flow = require("flow"),
  fs = require('fs');

var PostGresHelper = require("./PostGresHelper.js");
var pghelper = new PostGresHelper();

var Reporter = function () {

  this.reports = reports;
  this.results = {}; //store run queries here.

}


Reporter.prototype.getReportQueryString = function (report_name, cb) {

  if(this.reports && this.reports[report_name]){
    var query = this.reports[report_name];
    cb(null, query);
  }
  else{
    cb(null, "");
  }

}

Reporter.prototype.runReport = function (report_name, cb) {

  var self = this;

  //Get the query string and run the query
  this.getReportQueryString(report_name, function(err, query){

      if(query){

        pghelper.query(query, function(err, result){

              self.results[report_name] = result;
              cb(err, result);

        })

      }
      else {
        cb(new Error("Query string for report " + report_name + " not found."), null);
      }

  })

}

Reporter.prototype.getReport = function (report_name, cb) {

  //Get the query string and run the query
  var result = this.results[report_name];

  cb(result);

}

module.exports = Reporter;
