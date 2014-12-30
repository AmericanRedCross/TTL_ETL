/**
 * Created by ryanwhitley on 12/22/14.
 */

var pg = require("pg"),
http = require("http"),
settings = require("../settings/settings.js"),
common = require("../common"),
flow = require("flow");

var Surveys = require("./Surveys.js");
var surveys = new Surveys();

var PostGresHelper = require("./PostGresHelper.js");
var pghelper = new PostGresHelper();

var ETL = function() {

}


ETL.prototype.run = flow.define(

  function(cb) {

    this.cb = cb;

    //Go get the surveys.  When we've finished, flow to the next function block
    surveys.fetchFormHubFormList(this);

  },
  function(err, data) {

    //For each survey, pull down the data
    surveys.downloadAllData(this);

  },

  function() {

    //Peel out the column names from each dataset
    surveys.addColumnNames(this);

  },

  function() {

    //Should have all the forms and data now.

    //Iterate over the hash, and drop/create tables
    for(var key in surveys.surveys) {
      var survey = surveys.surveys[key];
      if(survey.columns && survey.data){
        pghelper.dropCreateTable(key, survey, this.MULTI());
      }
      else{
        common.log("Survey " + key + " doesn't have columns or data. Skipping truncating/creating table.");
      }
    }

  },
  function(){

    //All tables have been truncated or created
    //Insert Data
    for(var key in surveys.surveys) {
      var survey = surveys.surveys[key];

      if(survey.columns && survey.data){
        pghelper.insertRows(key, survey, this.MULTI());
      }
      else{
        common.log("Survey " + key + " doesn't have columns or data. Skipping inserting data.");
      }
    }



  },
  function(){
    //Done inserting data.
    common.log("Finished inserting data.");

    this.cb();

  }

);


ETL.prototype.dropPGTable = function(tableName, cb){

}

ETL.prototype.createPGTable = function(tableName, cb){

}

ETL.prototype.insertPGData = function(data, cb){

}

module.exports = ETL;
