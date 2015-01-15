/**
 * Created by ryanwhitley on 1/8/15.
 */


//This file will house PostGres Function definitions that will define the 'Reports'


var reports = {};

reports.number_of_households_by_barangay = "WITH distinct_hh AS (SELECT DISTINCT ON (household_id_hh_id) *  from enumeration_ttl_final) \
SELECT hh_loc_hh_barangay, count(hh_loc_hh_barangay)  from distinct_hh \
GROUP BY distinct_hh.hh_loc_hh_barangay \
ORDER BY hh_loc_hh_barangay";

//Add more reports for the UI like this
//reports.another_query_here = "SELECT * FROM table where id > 10";

try{
  module.exports = reports;
}
catch(e){

}
