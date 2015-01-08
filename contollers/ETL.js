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

var _stats = { surveys: []}; //Keep track of running stats

var ETL = function() {
  //if(io) common.createSocketOutput(io); //Use the common socket output to common.log to.
}


ETL.prototype.run = flow.define(

  function(cb) {

    //reset
    _stats = { surveys: []};

    this.cb = cb;

    //Tuck away the stats
    _stats.start_time = (new Date()).toJSON();

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

      //Tuck away the list of surveys in the stats object in case client wants to see a log of most recent run.
      _stats.surveys.push({ name: key, columns: survey.columns });

      if(survey.columns && survey.data && key.indexOf("test") == -1){ //Don't use surveys with 'test' in the form name.
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

      if(survey.columns && survey.data && key.indexOf("test") == -1){ //Don't use surveys with 'test' in the form name.
        pghelper.insertRows(key, survey, this.MULTI());
      }
      else{
        common.log("Survey " + key + " doesn't have columns or data. Skipping inserting data.");
      }
    }


  },
  function(){
    //Add geom columns and fill them, but only if _geolocation property exists for a given survey
    var self = this;

    for(var key in surveys.surveys) {
      var survey = surveys.surveys[key];

      if(survey.columns && survey.data && key.indexOf("test") == -1){ //Don't use surveys with 'test' in the form name.

        if (survey.columns.indexOf("_geolocation") > -1) {
          pghelper.addGeomColumn(key, self.MULTI());
        }

      }
      else{
        common.log("Survey " + key + " doesn't have columns or data. Skipping adding geometry column.");
      }
    }

  },
  function(){
    //Fill geom columns, but only if _geolocation property exists for a given survey
    var self = this;

    for(var key in surveys.surveys) {
      var survey = surveys.surveys[key];

      if(survey.columns && survey.data && key.indexOf("test") == -1){ //Don't use surveys with 'test' in the form name.

        if(survey.columns.indexOf("_geolocation") > -1){
            //Added Geom column. Fill it with geom data.
            pghelper.fillGeomColumn(key, self.MULTI());
        }

      }
      else{
        common.log("Survey " + key + " doesn't have columns or data. Skipping filling geometry column.");
      }
    }

  },
  function(){
    //Done inserting data.
    common.log("Finished inserting data.");

    //Tuck away the stats
    _stats.end_time = (new Date()).toJSON();

    this.cb();

  }

);

ETL.prototype.getStats = function(){
  return _stats;
}



module.exports = ETL;
