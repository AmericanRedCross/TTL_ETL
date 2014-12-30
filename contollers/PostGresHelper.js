/**
 * Created by ryanwhitley on 12/22/14.
 */

var pg = require("pg"),
settings = require("../settings/settings.js"),
common = require("../common.js"),
flow = require("flow");

var PostGresHelper = function() {

  // PostGIS Connection String
  this.conString = "postgres://" +
  settings.pg.user + ":" +
  settings.pg.password + "@" +
  settings.pg.server + ":" +
  settings.pg.port + "/" +
  settings.pg.database;

}



PostGresHelper.prototype.dropCreateTable = function(tableName, survey, cb) {

  var self = this;

  //Given some incoming data, create/truncate a table and insert the data.
  this.dropTable(tableName, function (err, result) {

    ////Whether or not the table exists, we're done.
    //var exists = false;
    //
    //if (err && err.message.indexOf("does not exist") > -1) {
    //  //The table doesn't exist.
    //  exists = false;
    //}
    ////Now create/insert into table.
    //if (exists) {
    //  //The table exists and was truncated.  Callback
    //  cb();
    //}
    //else {
      //The table doesn't exist.  Create it, then callback.
      self.createTable(tableName, survey, cb);
    //}
  })
}

PostGresHelper.prototype.truncateTable = function(tableName, cb) {

  //truncate a table
  var sql = "TRUNCATE TABLE " + tableName + ";";
  this.query(sql, function (err, result) {
    cb(err, result);
  });

}

PostGresHelper.prototype.dropTable = function(tableName, cb) {

  //truncate a table
  var sql = "DROP TABLE IF EXISTS " + tableName + ";";
  this.query(sql, function (err, result) {
    cb(err, result);
  });

}



PostGresHelper.prototype.query = function(queryStr, cb) {
  pg.connect(this.conString, function(err, client, done) {
    if (err) {
      console.error('error fetching client from pool', err);
    }

    client.query(queryStr, function (queryerr, result) {
      //call `done()` to release the client back to the pool
      done();

      if (queryerr) {
        console.error('ERROR RUNNING QUERY:', queryStr, queryerr);
      }

      //common.log("Ran Query: " + queryStr)

      //cb((err || queryerr), (result && result.rows ? result.rows : result));
      cb();

    });
  });
};




/**
 * Creates a table based on the type of each field in a given row.
 * If a given field for a row is null, we iterate further until we
 * find the type for the given field. If all rows for a given field
 * are null, we just make the type be a String.\
 *
 * @param queryTable
 * @param rows
 * @param cb
 */
PostGresHelper.prototype.createTable = function (tableName, survey, cb) {

  //TODO: Get rid of this workaround.
  var lowerList = {}; //a lowercase list of field names coming back from salesforce.

  var sql = "CREATE TABLE " + tableName + "( ID  SERIAL PRIMARY KEY, ";
  survey.columns.forEach(function(field){


    //Make sure the return field matches one of the whitelisted fields from the original SOQL query, otherwise ignore the property
    //if (isValidColumn(fields, field) == true) {
      //It's ok.  Let it pass
      sql += common.escapePostGresColumns([field.toLowerCase()])[0] + ' ' + (survey.types[field] || 'text') + ', ';
      lowerList[field.toLowerCase()] = true; //keep a lower case version
    //}

  });

  //Add any columns that are defined in the select statement that AREN'T in the table object.
  //fields.forEach(function(field){
  //  //Check to see if the field is in the table list.
  //  if(!lowerList[field] && field != 'id'){
  //    sql += field.toLowerCase() + ' text, ';
  //  }
  //});

  sql = sql.slice(0, sql.length - 2); // get rid of that last ', '
  sql += ");";

  this.query(sql, function (err, res) {
    console.log(tableName + ' successfully created.');
    //var locationField = 'Location__c';
    //if (typeof row !== 'undefined' && typeof row[locationField] !== 'undefined') {
    //  var sql = 'CREATE INDEX idx_' + tableName + '_location__c ON ' + tableName + '(' + locationField + ');';
    //  this.query(sql, function (err, res) {
    //    console.log('Created Index.');
    //  });
    //}

    cb(err, res);
  });
}

/**
 * This is to be called inside of function insertRows only.
 * To know when it's done, wrap in a multiplexing flow
 * Survey object should have a 'fields' and 'data' property.
 * @param rows
 * @private
 */
PostGresHelper.prototype.insertRows = function(tableName, survey, cb) {

  var self = this;

  var _insertRows = flow.define(
    function () {

      if(survey.data.length == 0) cb();

      survey.data.forEach(function (row) {
        var insertStr = "INSERT INTO " + tableName + " ( ";
        var valStr = "VALUES ( ";

        var insertFieldArray = [];
        var insertValueArray = [];

        for (var field in row) {
          //field here contains the un-modified FormHub name, which in our case contains forward slashes.
          //Get ahold of the clean version to use in the SQL Statement
          var cleanVersion = common.formatFormHubColumnName(field);

          //if (isValidColumn(survey.columns, cleanVersion) == true) {
          insertFieldArray.push(common.escapePostGresColumns([cleanVersion.toLocaleLowerCase()])[0]);
          insertValueArray.push(convertArrayValuesToDelimitedString(row[field], settings.pg.delimiter));
          //}
        }

        //if fieldArray has a column specified more than one time, handle it
        var counts = {};
        insertFieldArray.forEach(function(x) { counts[x] = (counts[x] || 0)+1; });

        for(var j in counts){
          if(counts[j] > 1){
            //It's a duplicate
            var duplicate_field = j;
          }
        }

        insertStr += insertFieldArray.join(",") + ') ';
        valStr += insertValueArray.join(",") + ');';
        var sql = insertStr.toLowerCase() + valStr;

        self.query(sql, this.MULTI()); //MULTI means to wait until all calls finish, and then proceed to next function in flow

      }, this);


    }, function (result) {
      //All queries have finished. We're done
      if (cb) cb();
    }
  );

  //Execute Flow
  _insertRows();

}


/******************************************************************
 ************************ UTILITY FUNCTIONS************************
 ******************************************************************/
function isInt(n) {
  return n % 1 === 0;
}

function sanitize(val) {
  // we want a null to still be null, not a string
  if (typeof val === 'string' && val !== 'null') {
    // $nh9$ is using $$ with an arbitrary tag. $$ in pg is a safe way to quote something,
    // because all escape characters are ignored inside of it.
    var esc = (settings.pg.escapeStr) || "ttL0";
    return "$"+esc+"$" + val + "$"+esc+"$";
  }

  return val || "";
}

function convertArrayValuesToDelimitedString(val, delimiter){
  //If value is an array, then concat the fields using a delimiter and return that.
  if(val.constructor === Array){
    var mapped = sanitize(val.map(function(item){
        return item;
    }).join(delimiter));
    if(mapped.length == 0) {
      return sanitize("");
    }
    else{
      return mapped;
    }
  }
  else{
    return sanitize(val) || "";
  }
}


function isValidColumn(fields, field) {
  if (fields.indexOf(field.toLowerCase()) > -1) {
    return true;
  }
  else {
    return false;
  }
}



module.exports = PostGresHelper;
