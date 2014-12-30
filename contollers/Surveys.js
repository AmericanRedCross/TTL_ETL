/**
 * Created by ryanwhitley on 12/22/14.
 */

var pg = require("pg"),
settings = require("../settings/settings.js"),
common = require("../common.js"),
flow = require("flow");

var Surveys = function() {
  this.surveyList = [];
  this.surveys = {};

}


Surveys.prototype.fetchFormHubFormList = function(cb) {
  //Connect to FormHub and find the list of surveys to download

  var path = settings.formhub.host + "/api/v1/data";
  var postargs = {
    Authorization : 'Token ' + settings.formhub.token
  };

  var self = this;

  common.executeRESTRequest(path, postargs, function(err, data){

    if(err){
      cb(err, null)
      return;
    }

    self.surveyList = data;
    cb(null, data);

  });

}

Surveys.prototype.downloadAllData= function(cb) {
  //Connect to FormHub and find survey metadata
  var self = this;


  var getSurveys = flow.define(

    function(){

        for(var key in self.surveyList) {

          //Download this file from FormHub.
          self.fetchFormHubData(key, self.surveyList[key], this.MULTI());

        }

    },
    function(){

      //When all are complete, fire callback
      cb();

    }
  )

  //Trigger the flow
  getSurveys();
}

Surveys.prototype.fetchFormHubData = function(formName, path, cb) {

  var path = path; //Split the incoming string, and only take the last 1/2 of the URL (i.e., /api/v1/data/foobar)
  var postargs = {
    Authorization: 'Token ' + settings.formhub.token
  };

  var self = this;

  common.log("Fetching data for: " + formName);

  common.executeRESTRequest(path, postargs, function (err, data) {

    if (err) {
      cb(null)
      return;
    }

    //Hold the survey object.
    if (!self.surveys[formName]) {
      self.surveys[formName] = {};
    }

    self.surveys[formName].data = data;

    cb(formName);

  });

}

//Add column names to the surveys property.
Surveys.prototype.addColumnNames = function(cb){

  var self = this;

  for(var key in self.surveys) {

    var survey = self.surveys[key];

    if (survey && survey.data) {

      var columns = [];
      var types = {};

      //Can't just look for column names in row 0.  Each row potentially has different properties. Thanks FormHub API!
      //Look in each row and pluck out unique fields.
      survey.data.forEach(function(row){

        for (var column in row) {

          var cleaned = common.formatFormHubColumnName(column);

          //If it's not already in the master list of columns, add it.
          if (columns.indexOf(cleaned) == -1) {
            columns.push(cleaned);
            types[cleaned] = (common.determineFieldType(row[column])); //store the type for this column so we can get it later.
          }

        }

      })

      survey.types = types;
      survey.columns = columns;
    }
  }

  //Done
  cb();

}



module.exports = Surveys;
