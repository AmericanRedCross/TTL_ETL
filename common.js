//common.js is a collection of commonly used functions by the main app.js and all submodules.
var pg = require('pg'),
    querystring = require('querystring'),
    request = require("request"),
    settings = require("./settings/settings"),
    fs = require("fs"),
    shortid = require("shortid"),
    _ = require("underscore-node");

var common = {};
common.formatters = {};

common.respond = function (req, res, args, callback) {

    // File name the respondant JSON will be if downloaded.
    var downloadFileName = args.name || args.table || 'download';

    // makes the json pretty if desired. (2 space indent)
    var indent = args.pretty ? 2 : null;

    //Show or hide different NAV elements based on whether the endpoint is installed or not

    //Write out a response as JSON or HTML with the appropriate arguments.  Add more formats here if desired
    if (!args.format || args.format.toLowerCase() == "html") {
        //calculate response time
        args.responseTime = new Date - req._startTime; //ms since start of request

        //Determine sample request based on args
        res.render(args.view, args);
    }
    else if (args.format && (args.format.toLowerCase() == "json" || args.format.toLowerCase() == "esrijson" || args.format.toLowerCase() == "j")) {
        //Respond with JSON
        if (args.errorMessage) {
            res.writeHead(200, {
                'Content-Type': 'application/json'
            });
            res.end(JSON.stringify({ error: args.errorMessage }, null, indent));
        }
        else if(args.infoMessage) {
            res.writeHead(200, {
                'Content-Type': 'application/json'
            });
            res.end(JSON.stringify({ error: args.infoMessage }, null, indent));
        }
        else {
            //Send back json file
            res.setHeader('Content-disposition', 'attachment; filename=' + downloadFileName + '.json');
            res.writeHead(200, {
                'Content-Type': 'application/json'
            });

            res.end(JSON.stringify(args.featureCollection, null, indent));
            //Determine sample request based on args
            //res.render(args.view, args);
        }
    }
    else if (args.format && (args.format.toLowerCase() == "json" || args.format.toLowerCase() == "esrijson" || args.format.toLowerCase() == "j")) {
        //Respond with JSON
        if (args.errorMessage) {
            res.jsonp({ error: args.errorMessage });
        }
        else {
            //Send back json file
            //res.setHeader('Content-disposition', 'attachment; filename=' + args.table + '.json');
            //res.writeHead(200, {
            //    'Content-Type': 'application/json'
            //});
            //res.end(JSON.stringify(args.featureCollection));
            res.jsonp(args.featureCollection);

        }
    }
    else if (args.format.toLowerCase() == "geojson") {
        //Set initial header
        res.setHeader('Content-disposition', 'attachment; filename=' + downloadFileName + '.geojson');

        //Responsd with GeoJSON
        if (args.errorMessage) {
            res.writeHead(200, {
                'Content-Type': 'application/json'
            });
            res.end(JSON.stringify({ error: args.errorMessage }, null, indent));
        }
        else {
            //Send back json file
            res.writeHead(200, {
                'Content-Type': 'application/json'
            });
            res.end(JSON.stringify(args.featureCollection, null, indent));
        }
    }
    else if (args.format && (args.format.toLowerCase() == "shapefile")) {
        //Requesting Shapefile Format.
        //If there's an error, return a json
        if (args.errorMessage) {
            res.writeHead(200, {
                'Content-Type': 'application/json'
            });
            res.end(JSON.stringify({ error: args.errorMessage }, null, indent));
        }
        else {
            //Send back a shapefile
            res.download(args.file, function () {
                callback(args.file)
            });
        }
    }
    else if (args.format && (args.format.toLowerCase() == "csv")) {
        //Responsd with CSV
        //If there's an error, return a json
        if (args.errorMessage) {
            res.writeHead(200, {
                'Content-Type': 'application/json'
            });
            res.end(JSON.stringify({ error: args.errorMessage }, null, indent));
        }
        else {
            var filename = downloadFileName + ".csv";
            //Send back a csv
            res.setHeader('Content-disposition', 'attachment; filename=' + filename);
            res.writeHead(200, {
                'Content-Type': 'text/csv'
            });
            res.end(args.featureCollection);
        }
    }
    else {
        //If unrecognized format is specified
        if (args.errorMessage) {
            res.writeHead(200, {
                'Content-Type': 'application/json'
            });
            res.end(JSON.stringify({ error: args.errorMessage }, null, indent));
        }
        else {
            res.writeHead(200, {
                'Content-Type': 'application/json'
            });
            res.end(JSON.stringify(args.featureCollection, null, indent));
        }
    }

}


common.executePgQuery = function (query, callback) {
    //Just run the query
    //Setup Connection to PG
  if(settings.pg && settings.pg.database && settings.pg.server) {
    pg.connect(global.conString, function (err, client, done) {
      if (err) {
        //return an error
        callback(err);
        return;
      }

      //Log the query to the console, for debugging
      common.log("Executing query: " + query.text + (query.values && query.values.length > 0 ? ", " + query.values : ""));

      //execute query
      client.query(query, function (err, result) {
        done();

        //go to callback
        callback(err, result);
      });
    });
  }
  else{
     //no postgres.
    //return empty
    callback(null, { rows: []});
  }
};


//Utilities
common.log = function (message) {
    //Write to console
    console.log(message);
}

//Determine if a string contains all numbers.
common.IsNumeric = function (sText) {
    var ValidChars = "0123456789";
    var IsNumber = true;
    var Char;

    sText.toString().replace(/\s+/g, '')

    for (var i = 0; i < sText.length && IsNumber == true; i++) {
        Char = sText.charAt(i);
        if (ValidChars.indexOf(Char) == -1) {
            IsNumber = false;
        }
    }
    return IsNumber;
}


//Take in an array, spit out an array of escaped columns
common.escapePostGresColumns = function (items) {
    //wrap all strings in double quotes
    return items.map(function (item) {
        //remove all quotes then wrap with quotes, just to be sure
        return '"' + item.replace(/"/g, "") + '"';
    });
}

/*
 Formhub column names for IRC sometimes have forward slashes in them.  Split the column name based on the slash, and return the last 2 items in the array.
 That's to be used as the column name. (Because the last item in the array isn't unique.)
 */
common.formatFormHubColumnName = function(columnName) {
    var pieces = columnName.split("/");

    if(pieces.length == 1){
        //Just return the string already.
        return pieces[0];
    }
    else if(pieces.length >= 2){
        //use the last 2 pieces of the array, since the last one isn't always unique for a given survey.
        return pieces[pieces.length - 2] + "_" + pieces[pieces.length - 1];
    }
    else{
        //Just in case.
        return pieces[pieces.length - 1];
    }
}


common.determineFieldType = function(val) {

    try {


        // it's a string that may be a stringified object
        if (typeof val === 'string') {
            return 'text';
        }

        // it's a number
        if (typeof val === 'number') {
            if (isInt(val)) {
                return 'bigint';
            } else {
                return 'float';
            }
        }

        // it's a null value, see if you can find a row that has a field that isn't null...
        //else if (typeof val === 'object' && val === null) {
        //    for (var i = 0; i < len; ++i) {
        //        row = rows[i];
        //        val = row[field];
        //        // its a string that may be a stringified object
        //        if (typeof val === 'string') {
        //            table[field] = 'text';
        //            break;
        //        }
        //        // it's a number
        //        if (typeof val === 'number') {
        //            if (isInt(val)) {
        //                table[field] = 'bigint';
        //            } else {
        //                table[field] = 'float';
        //            }
        //            break;
        //        }
        //    }
        // OK, well... We haven't found what we're looking for. Let's just call it text
        // and move on with our lives...
        //if (!table[field]) return 'text';
        //}
        return 'text';
    }
    catch(e){
        //In case something happens
        return 'text';
    }
}

//Take in an array, spit out an array of unescaped columns
common.unEscapePostGresColumns = function (items) {
    //remove all double quotes from strings

    if(!items) return "";

    return items.map(function (item) {
        //remove all quotes
        return item.replace(/"/g, "");
    });
}

common.isValidSQL = function (item) {
    //if(!item || item.length == 0) return true;

    //var illegalChars = /[\<\>\;\\\/\"\'\[\]]/;

    //if (illegalChars.test(item)) {
    //    //String contains invalid characters
    //    log("invalid sql: " + item);
    //    return false;
    //} else {
    //    return true;
    //}
    return true;
    //TODO - add validation code.
};

common.getArguments = function (req) {
    var args;

    //Grab POST or QueryString args depending on type
    if (req.method.toLowerCase() == "post") {
        //If a post, then arguments will be members of the this.req.body property
        args = req.body;
    } else if (req.method.toLowerCase() == "get") {
        //If request is a get, then args will be members of the this.req.query property
        args = req.query;
    }
    return args;
}

common.getProtocol = function(req){
  return ((req.secure ? "https:" : "http:") + "//");
}

////Take in results object, return GeoJSON (if there is geometry)
common.formatters.geoJSONFormatter = function (rows, geom_fields_array, geom_extent_array) {
    //Take in results object, return GeoJSON
    if (!geom_fields_array || geom_fields_array.length == 0) {
        //See if the extent array is populated
        if (geom_extent_array && geom_extent_array.length > 0) {
            //If no geometry, but extent is defined, just swap out the geom field name for the extent field name
            geom_fields_array = geom_extent_array;
        } else {
            //Use a default if none else are present
            geom_fields_array = ["geom"];
        }
    }

    //Loop thru results
    var featureCollection = { "type": "FeatureCollection", "features": [] };

    rows.forEach(function (row) {

        var feature = { "type": "Feature", "properties": {} };
        //Depending on whether or not there are geometry properties, handle it.  If multiple geoms, use a GeometryCollection output for GeoJSON.

        if (geom_fields_array && geom_fields_array.length == 1) {
            //single geometry
            if (row[geom_fields_array[0]]) {
                feature.geometry = JSON.parse(row[geom_fields_array[0]]);

                //remove the geometry property from the row object so we're just left with non-spatial properties
                delete row[geom_fields_array[0]];
            }
        }
        else if (geom_fields_array && geom_fields_array.length > 1) {
            //if more than 1 geom, make a geomcollection property
            feature.geometry = { "type": "GeometryCollection", "geometries": [] };
            geom_fields_array.forEach(function (item) {
                feature.geometry.geometries.push(row[item]);
                //remove the geometry property from the row object so we're just left with non-spatial properties
                delete row[item];
            });
        }

        feature.properties = row;
        featureCollection.features.push(feature);
    })

    return featureCollection;
}

common.formatters.ESRIFeatureSetJSONFormatter = function (rows, geom_fields_array) {
    //Take in results object, return ESRI Flavor of GeoJSON
    if (!geom_fields_array) geom_fields_array = ["geom"]; //default

    //Loop thru results
    var featureSet = { "features": [], "geometryType": "" };

    rows.forEach(function (row) {
        var feature = { "attributes": {} };
        //Depending on whether or not there is geometry properties, handle it.
        //Multiple geometry featureclasses don't exist in ESRI-land.  How to handle?  For now, just take the 1st one we come across
        //TODO:  Make user choose what they want

        if (geom_fields_array) {
            //single geometry
            if (row[geom_fields_array[0]]) {
                //manipulate to conform
                if (row[geom_fields_array[0]].type == "Polygon") featureSet.geometryType = "esriGeometryPolygon";
                else if (row[geom_fields_array[0]].type == "Point") featureSet.geometryType = "esriGeometryPoint";
                else if (row[geom_fields_array[0]].type == "Line") featureSet.geometryType = "esriGeometryLine";
                else if (row[geom_fields_array[0]].type == "Polyline") featureSet.geometryType = "esriGeometryPolyline";
                else if (row[geom_fields_array[0]].type == "MultiPolygon") featureSet.geometryType = "esriGeometryPolygon";

                //TODO - add the rest
                //TODO - support all types below
                feature.geometry = {};

                var rowGeom = JSON.parse(row[geom_fields_array[0]]);
                if (featureSet.geometryType = "esriGeometryPolygon") {
                    feature.geometry.rings = rowGeom.coordinates;
                }
                else {
                    feature.geometry = rowGeom;
                }
                //remove the geometry property from the row object so we're just left with non-spatial properties
                delete row[geom_fields_array[0]];
            }
        }


        feature.attributes = row;
        featureSet.features.push(feature);
    })

    return featureSet;
}

////Take in results object, return CSV (exclude geometry)
common.formatters.CSVFormatter = function (rows, geom_fields_array) {
    //Take in results object, return CSV
    if (!geom_fields_array) geom_fields_array = ["geom"]; //default

    //Loop thru results
    var csvArray = []; //at the end, csvArray will be joined and separated by commas to make the csv

    //Get column names
    if (rows && rows[0]) {
        Object.keys(rows[0]).forEach(function (column_name) {
            if (geom_fields_array.indexOf(column_name) == -1) csvArray.push(column_name + ","); //only add if not a geom column
        });

        //Add newline
        csvArray.push('\r\n');
    }


    rows.forEach(function (row) {
        //Depending on whether or not there is geometry properties, handle it.  If multiple geoms, use a GeometryCollection output for GeoJSON.

        for (var index in row) {
            if (geom_fields_array.indexOf(index) == -1)
                csvArray.push((row[index] || (row[index] == 0 ? row[index] : '')) + ",");
        }
        //Add newline
        csvArray.push('\r\n');
    })

    return csvArray.join("");
}

common.executeRESTRequest = function (url, postargs, callback) {

    //Connect to an http endpoint and get back data.
    var post_data = querystring.stringify(postargs);
    console.log("Post Data: " + post_data);


    var baseHeaders = {
        'Content-Type': 'application/json',
        'Content-Length': post_data.length
    };

    //Mix in passed in post parameters with the base parameters
    var headers = _.extend(baseHeaders, postargs);

    var options = {
        url: url,
        headers:headers
    };

    var post_req = request(options, function (error, res, body) {

            console.log("ended API response for " + url);
            if(error){
                callback(error, null);
                return;
            }


            if(this.statusCode == 403){
                callback(new Error("403 Error for path " + url), null);
                return;
            }
            try{
                var parsed = JSON.parse(body);
                callback(null, parsed);
            }catch(e) {
                callback(new Error("Problem parsing result."), null);
            }

    });

    //execute
    post_req.write(post_data);
    post_req.end();
}

//Pass in an object and write out a GeoJSON File
common.writeGeoJSONFile = function (geojson, name, callback) {

    //Write out a GeoJSON file to disk - remove all whitespace
    var geoJsonOutFile = name + '.json';
    var fullPath = "." + settings.application.geoJsonOutputFolder + geoJsonOutFile;
    fs.writeFile(fullPath, JSON.stringify(geojson).replace(/\s+/g, ''), function (err) {
        if (err) {
            console.log(err.message);
        }
        else {
            console.log("created GeoJSON file.");
        }

        //pass back err, even if null
        callback(err, geoJsonOutFile, fullPath);
    });

}

//Run a shell command, and return the output in the callback
//Usage: run_cmd( "ls", ["-l"], function(text) { console.log (text) });
common.run_cmd = function(cmd, args, callBack ) {
    var spawn = require('child_process').exec;
    var child = spawn(cmd, args);
    var resp = "";
    var err = "";

    console.log("Running shell command: " + cmd + ", args: " + args)

    child.stdout.on('data', function (buffer) {
        resp += buffer.toString() ;
    });
    child.stdout.on('end', function() {
        callBack (null, resp)
    });

    //child.stderr.on('data', function(buffer) { err += buffer.toString() });
    //child.stderr.on('end', function() {
    //    callBack (err, null)
    //});

}

module.exports = common;
