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

  //Given some incoming data, create a table and insert/update the data.
  //Lower-case the table name.
  this.checkIfTableExists(tableName.toLowerCase(), function (err, result) {

    var exists = true;

    //Whether or not the table exists
    if(result && result.length > 0 && result[0].exists == true){
      exists = true;
      survey.exists = true; //Keep track of this, so when inserting rows we know whether to check for IDs or just insert all rows
    }
    else{
      exists = false;
      survey.exists = false; //Keep track of this, so when inserting rows we know whether to check for IDs or just insert all rows
    }

    //Now create/insert into table.
    if (exists) {
      //The table exists.  Check the columns against the incoming columns to see if any new properties were added
      self.addNewColumnsIfNecessary(tableName,survey, function(){
        cb();
      });
    }
    else {
      //The table doesn't exist.  Create it, then callback.
      self.createTable(tableName, survey, cb);
    }
  })

}

PostGresHelper.prototype.truncateTable = function(tableName, cb) {

  //truncate a table
  var sql = "TRUNCATE TABLE " + tableName + ";";
  this.query(sql, function (err, result) {
    cb(err, result);
  });

}


PostGresHelper.prototype.checkIfTableExists = function(tableName, cb) {

  //see if a table exists - ASSUMES public schema
  var sql = "SELECT EXISTS (SELECT 1 " +
  "FROM   pg_catalog.pg_class c " +
  "JOIN   pg_catalog.pg_namespace n ON n.oid = c.relnamespace " +
  "WHERE  n.nspname = 'public' " +
  "AND    c.relname = '" + tableName + "' " +
  "AND    c.relkind = 'r'"+
  ");";

  this.query(sql, function (err, result) {
    cb(err, result);
  });

}

PostGresHelper.prototype.getExistingTableColumns = function(tableName, cb) {

  //get column names - ASSUMES public schema
  var sql = "SELECT attname " +
  "FROM   pg_attribute " +
  "WHERE  attrelid = 'public." + tableName + "'::regclass " +
  "AND    attnum > 0 " +
  "AND    NOT attisdropped " +
  "ORDER  BY attnum;";

  this.query(sql, function (err, result) {
    cb(err, result);
  });

}

PostGresHelper.prototype.addNewColumnsIfNecessary = function(tableName, survey, cb) {

  var self = this;

  var _checkColumns = flow.define(
    function (dbColumns) {

      if(survey.metacolumns) {
        var updateColumns = false;

        survey.metacolumns.forEach(function (incomingColumn) {
          if (dbColumns.indexOf(incomingColumn.name) == -1) {
            //Not found in the DB Column list.  Assume it is a new column.
            updateColumns = true;
            self.addColumnToTable(tableName, incomingColumn.name, 'text', this.MULTI());
          }
        }, this)

        //If all columns are cool, then exit
        if(updateColumns === false){
          if(cb) cb(null, null);
          return;
        }

      }
      else{
        //No columns on survey.  Exit.
        if(cb) cb(null, null);
        return;
      }


    },
    function() {

      //All columns added for this table.
      //fire callback
      if(cb) cb(null, null);

    });


  //Get the columns from the DB.
  this.getExistingTableColumns(tableName, function(err, columns){

    if(err){ //exit and return;
      if(cb) cb(null, null);
      return;
    }

    //Covert the array of objects into an array of column names (strings)
    var columnArray = columns.map(function(row){
        return row.attname;
    });

    //with the columns in the DB, compare to the survey.columns property to see if there are any new ones.
    _checkColumns(columnArray);

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

      cb((err || queryerr), (result && result.rows ? result.rows : result));

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
  var lowerList = {}; //a lowercase list of field names coming back from formhub.

  var sql = "CREATE TABLE " + tableName.toLowerCase() + "( ID  SERIAL PRIMARY KEY, ";
  survey.metacolumns.forEach(function(field){


    //Make sure the return field matches one of the whitelisted fields from the original SQL query, otherwise ignore the property
    //if (isValidColumn(fields, field) == true) {
      //It's ok.  Let it pass
      sql += common.escapePostGresColumns(field.name.toLowerCase()) + ' ' + common.mapFormHubTypes2PostgresTypes(field) + ', ';
      lowerList[field] = true; //keep a lower case version
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
 * Addition - don't insert row if survey exists in DB already and _uuid is already in place.
 * @param rows
 * @private
 */
PostGresHelper.prototype.insertRows = function(tableName, survey, cb) {

  var self = this;

  var _insertRows = flow.define(
    function () {

      if(survey.data.length == 0) cb(); //Exit if no data exists for this survey

      survey.data.forEach(function (row) {

        //Get the _uuid of the record (ALL FormHub surveys (so far) have this field)
        var _uuid = row['_uuid'];

        var insertStr = "INSERT INTO " + tableName + " ( ";
        var valStr = "VALUES ( ";

        //If no _uuid, then treat it as a normal record - INSERT IT
        if(survey && survey.exists && survey.exists === true && _uuid) {
          //if survey exists, and we want to only insert rows if _uuid doesn't exist, then the form of the SQL expression will change.
          //It should look like INSERT INTO <table> (<column name>, <column name>) SELECT <value 1>,<value 2>) WHERE NOT EXISTS (SELECT _uuid from <table> where _uuid = <uuid of row to be inserted>);
          //The main difference there being the 'SELECT' instead of 'VALUES', and this SELECT list is not surounded by parenthesis ()
          var valStr = "SELECT ";
        }

        var insertFieldArray = [];
        var insertValueArray = [];

        for (var field in row) {
          //field here contains the un-modified FormHub name, which in our case contains forward slashes.
          //Get ahold of the clean version to use in the SQL Statement
          var cleanVersion = common.formatFormHubColumnName(field);

          //if (isValidColumn(survey.columns, cleanVersion) == true) {
          insertFieldArray.push(common.escapePostGresColumns(cleanVersion.toLocaleLowerCase()));
          // insertValueArray.push(row[field]);
          insertValueArray.push(convertArrayValuesToDelimitedString(row[field], settings.pg.delimiter)); // Old method for adding array.
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
        valStr += insertValueArray.join(","); //Decide whether or not to add the closing parenthesis below.  If checking _uuid, then no parenthesis.  Otherwise, yes.
        var sql = insertStr.toLowerCase() + valStr;

        //New addition - if survey already exists in DB, then add a check to NOT insert rows if _uuid exists already.
        //Only if there is a _uuid for this record.  Otherwise, just INSERT IT.
        if(survey && survey.exists && survey.exists === true && _uuid){
          sql += (" WHERE NOT EXISTS (SELECT _uuid from {{table}} where _uuid = '{{uuid}}')").replace('{{table}}', tableName).replace('{{uuid}}', _uuid);
        }else{
          sql += ")"; //Value string ends with a parenthesis ONLY when we're INSERTing a new row WITHOUT the _uuid check.
        }

        //Add ending semicolon
        sql += ";";

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


PostGresHelper.prototype.addColumnToTable = function(tableName, column, dataType, cb){

  var sql = "DO $$ \
              BEGIN \
                BEGIN \
                  ALTER TABLE " + tableName + " ADD COLUMN " + column + " " + dataType + "; \
                    EXCEPTION \
                      WHEN duplicate_column THEN RAISE NOTICE 'column " + column + " already exists in " + tableName + ".'; \
                END; \
              END; \
            $$";

  //Send it in
  this.query(sql, function() {
    //Added column to table (or tried anyway)
    console.log("Added column " + column + " to " + tableName);
    cb();
  });

}



PostGresHelper.prototype.addGeomColumn = function(tableName, cb) {

  var sql = "DO $$ \
              BEGIN \
                BEGIN \
                  ALTER TABLE " + tableName + " ADD COLUMN geom geometry; \
                    EXCEPTION \
                      WHEN duplicate_column THEN RAISE NOTICE 'column geom already exists in " + tableName + ".'; \
                END; \
              END; \
            $$";

  //Send it in
  this.query(sql, cb);
}


/**
 * Assumes that the geometry column of the table exists, and is called geom. Also assumes srid = 4326
 * @param tableName - name of table to update
 * @param cb - callback
 */
PostGresHelper.prototype.fillGeomColumn = function(tableName, cb) {

  var sql = "UPDATE " + tableName +
  " SET geom = CASE WHEN (trim(both ' ' from _geolocation) = ',' OR _geolocation IS NULL) THEN NULL ELSE ST_GeomFromText('POINT(' || split_part(_geolocation, ',', 2) || ' ' || split_part(_geolocation, ',', 1) || ')', 4326) END;";

  //Send it in
  this.query(sql, cb); //MULTI means to wait until all calls finish, and then proceed to next function in flow
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
