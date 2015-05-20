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
  //if(io) common.createSocketOutput(io); //Use the common socket output to common.log to.
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
      // only give me two tables back for now.
    var tmp = {};
      tmp.Abc = data.Abc;
      tmp.Core_Shelter_Validation_Tool = data.Core_Shelter_Validation_Tool;
    data = tmp;

    self.surveyList = data;
    cb(null, data);

  });

}

Surveys.prototype.downloadFormMetadata = function(cb) {
    var self = this;
    var getSurveysMetaData = flow.define(

        function(){
            var metadata_path = null;
            for(var key in self.surveyList) {
                metadata_path = self.surveyList[key].replace("/data/","/forms/");
                //Download this file from FormHub.
                self.fetchFormHubMetaData(key, metadata_path, this.MULTI());

            }

        },
        function(){

            //When all are complete, fire callback
            cb();

        }
    )

    //Trigger the flow
    getSurveysMetaData();
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

Surveys.prototype.fetchFormHubMetaData = function(formName, path, cb) {

    var path = path + "/form.json";
    var postargs = {
        Authorization: 'Token ' + settings.formhub.token
    };

    var self = this;

    common.log("Fetching metadata for: " + formName);

    common.executeRESTRequest(path, postargs, function (err, data) {

        common.log("Fetched metadata for: " + formName);

        if (err) {
            console.log(err)
            cb(null)
            return;
        }

        //Hold the survey object.
        if (!self.surveys[formName]) {
            self.surveys[formName] = {};
        }

        self.surveys[formName].metadata = data;

        cb(formName);

    });

}

//Add column names to the surveys property.  These come from the metadata file
Surveys.prototype.addColumnNamesFromMetadata = function(cb){

    var self = this;

    for(var key in self.surveys) {

        var survey = self.surveys[key];

        if (survey && survey.metadata) {

            var columns = [];
            var multichoice = [];
            // Last two columns are for "base class" and "is multiple choice"
            columns = recursiveChildren(survey.metadata.children, columns, "base", false);
            survey.metacolumns = columns;
            survey.multichoice = multichoice;
        }
    }
    // recursive function to loop through the children of each parent node.  Add column name and type to the columns array.
    // append the parent node to the name from the child element (as was originally done by Ryan's common.formatFormHubColumnName() function
    function recursiveChildren(node, columns, parent, multi) {
        node.forEach(function (d) {
            if (d.hasOwnProperty('children') && d.children[0].name != "yes") {
                // Check to see if this is a multiple choice question.  If it is, add it to our multichoice array.
                if (d.type == "select one" || d.type == "select all that apply") {
                    multichoice.push((parent != "base" ? parent+"/" : "")+d.name);
                    recursiveChildren(d.children, columns, parent+"_"+d.name, true);
                } else {
                    recursiveChildren(d.children, columns, d.name, false);
                }
            } else {
                // This handles the strange issue that multiple choice response 'other' ends up with the same name as the 'other' input text field.
                // Append 'mc' in this case so that we know it is from the multiple choice option.
                d.name = (d.name == "other" ? d.name+"_mc" : d.name);
                d.type = (multi ? "multi" : d.type);
                columns.push({
                    'name': (parent + "_" + d.name).toLowerCase(),
                    'type': (d.type == undefined ? "text" : d.type)
                });
            }
        });
        return columns;
    }

    //Done
    cb();

}

Surveys.prototype.fetchFormHubData = function(formName, path, cb) {

  var path = path;
  var postargs = {
    Authorization: 'Token ' + settings.formhub.token
  };

  var self = this;

  common.log("Fetching data for: " + formName);

  common.executeRESTRequest(path, postargs, function (err, data) {

    common.log("Fetched data for: " + formName);

    if (err) {
      console.log(err)
      cb(null)
      return;
    }

    //Hold the survey object.
    if (!self.surveys[formName]) {
      self.surveys[formName] = {};
    }
      var newname = null;
    // compare the data coming in with the multiple choice array.  If it is a question with multiple options for response remove the base field (question) and add fields for each response option.
    for(var prop1 in data) {
        for(var key in data[prop1]) {
            for (var prop2 in self.surveys[formName].multichoice) {
                if (key == self.surveys[formName].multichoice[prop2]) {
                    // Check to see if we have multiple answer in the same line (multiple choice responses will be delimited with a space
                    if (data[prop1][key].indexOf(" ") != -1) {
                        var multi = data[prop1][key].split(" ");
                        for(var ele in multi) {
                            // This handles the strange issue that multiple choice response 'other' ends up with the same name as the 'other' input text field.
                            // Append 'mc' in this case so that we know it is from the multiple choice option.
                            newname = key + "_" + multi[ele] + (multi[ele] == "other" ? "_mc" : "");
                            data[prop1][newname] = 1;
                            delete data[prop1][key];
                        }
                    } else {
                        newname = key + "_" + data[prop1][key] + (data[prop1][key] == "other" ? "_mc" : "");
                        data[prop1][newname] = 1;
                        delete data[prop1][key];
                    }

                }
            }
        }
    }

    self.surveys[formName].data = data;

    cb(formName);

  });

}

// Find any columns that are in the data fields that don't exist in the metadata and append them to the metacolumns.
// There is a quick check here to make sure that they are base level entities e.g., "base__" or the formhub_uuid
Surveys.prototype.mergeDataColumnsAndMetaData = function(cb) {
    var self = this;
    var match = false;
    for(var key in self.surveys) {
        var survey = self.surveys[key];
        survey.multiplechoice = [];
        if (survey && survey.columns && survey.metacolumns) {
            for(var p in survey.columns) {
                match = false;
                for(var m in survey.metacolumns) {
                    if (survey.metacolumns[m].name.toLowerCase() == survey.columns[p].toLowerCase()) {
                        match = true;
                        break;
                    }
                }
                if (!match) {
                   if(survey.columns[p].indexOf("__") != -1 || survey.columns[p].indexOf("formhub") != -1) {
                       survey.metacolumns.push({name: survey.columns[p], type: 'text'});
                   }
                }
            }
        }
    }
    //Done
    cb();
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
