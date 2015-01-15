(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/ryanwhitley/Documents/GitHub/TTL_ETL/public/js/controllers/main.js":[function(require,module,exports){
angular.module('ttlController', [])

	// inject the  service factory into our controller
	.controller('mainController', ['$scope','$http','Surveys', 'Stats', 'ETL', 'Reports', function($scope, $http, Surveys, Stats, ETL, Reports) {

		$scope.formData = {};
		$scope.loading = true;

		// GET =====================================================================
		// when landing on the page, get all Surveys
		// use the service to get all the surveys
		//Don't get a live connection.  Use the list from the last ETL run.
		//Surveys.get()
		//	.success(function(data) {
		//		$scope.surveys = data;
		//		$scope.loading = false;
		//});

		// GET =====================================================================
		// when landing on the page, get all Stats
		// use the service to get stats
		$scope.refreshStats = function(){

			Stats.get()
				.success(function(data) {
					$scope.stats = data;

					//See how long its been sine the last FormHub Synch.
					if($scope.stats && $scope.stats.etl && $scope.stats.etl.start_time){
						$scope.hasETLRun = true;

						//set list of surveys in scope
						$scope.surveys = $scope.stats.etl.surveys;

						var msDiff = new Date().getTime() - new Date($scope.stats.etl.end_time).getTime(); //Difference in ms

						//How long has it been since we last recorded an ETL run?
						$scope.dayDiff = millisecondsToDays(msDiff); //returns {days, hours, minutes} object.

						if($scope.dayDiff.days >= 3 && $scope.dayDiff.days < 7){
							//Between 3 days and 1 week.
							$scope.stats.etl.medium = true;
						}
						else  if($scope.dayDiff.days >= 7 && $scope.dayDiff.days < 14) {
							//Greater than 1 week old
							$scope.stats.etl.high = true;
						}
						else{
							//Other - less than 3 days or something else.
							$scope.stats.etl.low = true;
						}

					}
					else{
						$scope.hasETLRun = false;
					}




					//See how long its been sine the last DB Backup.
					if($scope.stats && $scope.stats.latest && $scope.stats.latest.latestBackup){
						$scope.hasDBBackupRun = true;

						var msDiff = new Date().getTime() - new Date($scope.stats.latest.latestBackup.time).getTime(); //Difference in ms

						//How long has it been since we last recorded an ETL run?
						$scope.backupDayDiff = millisecondsToDays(msDiff); //returns {days, hours, minutes} object.

						if($scope.backupDayDiff.days >= 3 && $scope.backupDayDiff.days < 7){
							//Between 3 days and 1 week.
							$scope.stats.latest.medium = true;
						}
						else  if($scope.backupDayDiff.days >= 7 && $scope.backupDayDiff.days < 14) {
							//Greater than 1 week old
							$scope.stats.latest.high = true;
						}
						else{
							//Other - less than 3 days or something else.
							$scope.stats.latest.low = true;
						}

					}
					else{
						$scope.hasDBBackupRun = false;
					}



					//See how long its been sine the last backup upload to S3.
					if($scope.stats && $scope.stats.latest && $scope.stats.latest.uploadToS3){
						$scope.hasS3BackupRun = true;

						var msDiff = new Date().getTime() - new Date($scope.stats.latest.lastUploaded).getTime(); //Difference in ms

						//How long has it been since we last recorded an ETL run?
						$scope.s3DayDiff = millisecondsToDays(msDiff); //returns {days, hours, minutes} object.

						if($scope.s3DayDiff.days >= 3 && $scope.s3DayDiff.days < 7){
							//Between 3 days and 1 week.
							$scope.stats.latest.uploadToS3.medium = true;
						}
						else  if($scope.s3DayDiff.days >= 7 && $scope.s3DayDiff.days < 14) {
							//Greater than 1 week old
							$scope.stats.latest.uploadToS3.high = true;
						}
						else{
							//Other - less than 3 days or something else.
							$scope.stats.latest.uploadToS3.low = true;
						}

					}
					else{
						$scope.hasS3BackupRun = false;
					}

				});

			//Disable spinner.
			$scope.loading = false;

		}

		//Kick it off on load
		$scope.refreshStats();


		// GET =====================================================================
		// if user wants to trigger a job via the API
		$scope.runAll = function(){
			//Run all jobs (Download FormHub Data, Insert Into DB, Backup, Send to S3

			//Load spinner
			$scope.loading = true;

			ETL.runAll()
				.success(function(data) {
						//Refresh stats, and go to home page.
					  $scope.refreshStats();

					//Hide spinner
					$scope.loading = false;
				});
		}

		$scope.synchFormHubData = function(){
			//Run Download FormHub Data

			//Load spinner
			$scope.loading = true;

			ETL.etl()
				.success(function(data) {
					//Refresh stats, and go to home page.
					$scope.refreshStats();

					//Hide spinner
					$scope.loading = false;
				});
		}

		$scope.backupDB= function(){
			//Run Download FormHub Data

			//Load spinner
			$scope.loading = true;

			ETL.backupDB()
				.success(function(data) {
					//Refresh stats, and go to home page.
					$scope.refreshStats();

					//Hide spinner
					$scope.loading = false;
				});
		}

		$scope.sendToS3= function(){
			//Run Download FormHub Data

			//Load spinner
			$scope.loading = true;

			ETL.uploadToS3()
				.success(function(data) {
					//Refresh stats, and go to home page.
					$scope.refreshStats();

					//Hide spinner
					$scope.loading = false;
				});
		}


		/***
		 *
		 * Reports Section
		 */

		$scope.getReport = function(report_name){
			//Store the selected report
			$scope.reportName = report_name;

			Reports.get(report_name).success(function(data) {
				//Refresh stats, and go to home page.
				$scope.refreshStats();

				$scope.currentReport = data;

				if(data && data.length > 0){
					$scope.keys = Object.keys(data[0]); //Use this to iterate using ng-repeat.
				}

				//Hide spinner
				$scope.loading = false;
			});

		}

		//Fetch the list of reports defined in public/reports/reports.js
		$scope.getReportList = function(){

				$scope.reportList = Reports.getReportList();

		}

		$scope.getReportList();



		$scope.downloadReportCSV = function(report_name){
			Reports.getCSV(report_name).success(function(data) {
				 //should have downloaded csv.
			});
		}


		 function millisecondsToDays(t){
			var cd = 24 * 60 * 60 * 1000,
				ch = 60 * 60 * 1000,
				d = Math.floor(t / cd),
				h = Math.floor( (t - d * cd) / ch),
				m = Math.round( (t - d * cd - h * ch) / 60000);

			if( m === 60 ){
				h++;
				m = 0;
			}
			if( h === 24 ){
				d++;
				h = 0;
			}
			return { days: d, hours: h, minutes: m };
		}

	}]);
},{}],"/Users/ryanwhitley/Documents/GitHub/TTL_ETL/public/js/core.js":[function(require,module,exports){
angular.module('TTL_ETL_UI', ['ttlController', 'ttlService', 'statsService', 'etlService', 'reportService']);


require('./controllers/main.js');
require('./services/etl.js');
require('./services/reports.js');
require('./services/stats.js');
require('./services/surveys.js');
},{"./controllers/main.js":"/Users/ryanwhitley/Documents/GitHub/TTL_ETL/public/js/controllers/main.js","./services/etl.js":"/Users/ryanwhitley/Documents/GitHub/TTL_ETL/public/js/services/etl.js","./services/reports.js":"/Users/ryanwhitley/Documents/GitHub/TTL_ETL/public/js/services/reports.js","./services/stats.js":"/Users/ryanwhitley/Documents/GitHub/TTL_ETL/public/js/services/stats.js","./services/surveys.js":"/Users/ryanwhitley/Documents/GitHub/TTL_ETL/public/js/services/surveys.js"}],"/Users/ryanwhitley/Documents/GitHub/TTL_ETL/public/js/services/etl.js":[function(require,module,exports){
angular.module('etlService', [])

	// each function returns a promise object 
	.factory('ETL', ['$http',function($http) {
		return {
			runAll : function() {
				return $http.get('/runall');
			},
			etl : function() {
				//Download FormHub Data
				return $http.get('/etl');
			},
			backupDB : function() {
				//Download FormHub Data
				return $http.get('/backup');
			},
			uploadToS3 : function() {
				//Download FormHub Data
				return $http.get('/sendtos3');
			}
		}

	}]);
},{}],"/Users/ryanwhitley/Documents/GitHub/TTL_ETL/public/js/services/reports.js":[function(require,module,exports){
angular.module('reportService', [])

	// each function returns a promise object 
	.factory('Reports', ['$http',function($http) {
		return {
			get : function(report_name) {
				return $http.get('/reports/' + report_name);
			},
			getReportList : function() {
				return reports;
			},
			getCSV : function(report_name){
				return $http.get('/reports/' + report_name + "/csv");
			}
		}
	}]);
},{}],"/Users/ryanwhitley/Documents/GitHub/TTL_ETL/public/js/services/stats.js":[function(require,module,exports){
angular.module('statsService', [])

	// each function returns a promise object 
	.factory('Stats', ['$http',function($http) {
		return {
			get : function() {
				return $http.get('/stats');
			}
		}

	}]);
},{}],"/Users/ryanwhitley/Documents/GitHub/TTL_ETL/public/js/services/surveys.js":[function(require,module,exports){
angular.module('ttlService', [])

	// each function returns a promise object 
	.factory('Surveys', ['$http',function($http) {
		return {
			get : function() {
				return $http.get('/surveys');
			}
		}

	}]);
},{}]},{},["/Users/ryanwhitley/Documents/GitHub/TTL_ETL/public/js/core.js"])
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvcnlhbndoaXRsZXkvRG9jdW1lbnRzL0dpdEh1Yi9UVExfRVRML3B1YmxpYy9qcy9jb250cm9sbGVycy9tYWluLmpzIiwiL1VzZXJzL3J5YW53aGl0bGV5L0RvY3VtZW50cy9HaXRIdWIvVFRMX0VUTC9wdWJsaWMvanMvY29yZS5qcyIsIi9Vc2Vycy9yeWFud2hpdGxleS9Eb2N1bWVudHMvR2l0SHViL1RUTF9FVEwvcHVibGljL2pzL3NlcnZpY2VzL2V0bC5qcyIsIi9Vc2Vycy9yeWFud2hpdGxleS9Eb2N1bWVudHMvR2l0SHViL1RUTF9FVEwvcHVibGljL2pzL3NlcnZpY2VzL3JlcG9ydHMuanMiLCIvVXNlcnMvcnlhbndoaXRsZXkvRG9jdW1lbnRzL0dpdEh1Yi9UVExfRVRML3B1YmxpYy9qcy9zZXJ2aWNlcy9zdGF0cy5qcyIsIi9Vc2Vycy9yeWFud2hpdGxleS9Eb2N1bWVudHMvR2l0SHViL1RUTF9FVEwvcHVibGljL2pzL3NlcnZpY2VzL3N1cnZleXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMvUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNQQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3RCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNmQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1ZBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiYW5ndWxhci5tb2R1bGUoJ3R0bENvbnRyb2xsZXInLCBbXSlcblxuXHQvLyBpbmplY3QgdGhlICBzZXJ2aWNlIGZhY3RvcnkgaW50byBvdXIgY29udHJvbGxlclxuXHQuY29udHJvbGxlcignbWFpbkNvbnRyb2xsZXInLCBbJyRzY29wZScsJyRodHRwJywnU3VydmV5cycsICdTdGF0cycsICdFVEwnLCAnUmVwb3J0cycsIGZ1bmN0aW9uKCRzY29wZSwgJGh0dHAsIFN1cnZleXMsIFN0YXRzLCBFVEwsIFJlcG9ydHMpIHtcblxuXHRcdCRzY29wZS5mb3JtRGF0YSA9IHt9O1xuXHRcdCRzY29wZS5sb2FkaW5nID0gdHJ1ZTtcblxuXHRcdC8vIEdFVCA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0XHQvLyB3aGVuIGxhbmRpbmcgb24gdGhlIHBhZ2UsIGdldCBhbGwgU3VydmV5c1xuXHRcdC8vIHVzZSB0aGUgc2VydmljZSB0byBnZXQgYWxsIHRoZSBzdXJ2ZXlzXG5cdFx0Ly9Eb24ndCBnZXQgYSBsaXZlIGNvbm5lY3Rpb24uICBVc2UgdGhlIGxpc3QgZnJvbSB0aGUgbGFzdCBFVEwgcnVuLlxuXHRcdC8vU3VydmV5cy5nZXQoKVxuXHRcdC8vXHQuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG5cdFx0Ly9cdFx0JHNjb3BlLnN1cnZleXMgPSBkYXRhO1xuXHRcdC8vXHRcdCRzY29wZS5sb2FkaW5nID0gZmFsc2U7XG5cdFx0Ly99KTtcblxuXHRcdC8vIEdFVCA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0XHQvLyB3aGVuIGxhbmRpbmcgb24gdGhlIHBhZ2UsIGdldCBhbGwgU3RhdHNcblx0XHQvLyB1c2UgdGhlIHNlcnZpY2UgdG8gZ2V0IHN0YXRzXG5cdFx0JHNjb3BlLnJlZnJlc2hTdGF0cyA9IGZ1bmN0aW9uKCl7XG5cblx0XHRcdFN0YXRzLmdldCgpXG5cdFx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdFx0XHQkc2NvcGUuc3RhdHMgPSBkYXRhO1xuXG5cdFx0XHRcdFx0Ly9TZWUgaG93IGxvbmcgaXRzIGJlZW4gc2luZSB0aGUgbGFzdCBGb3JtSHViIFN5bmNoLlxuXHRcdFx0XHRcdGlmKCRzY29wZS5zdGF0cyAmJiAkc2NvcGUuc3RhdHMuZXRsICYmICRzY29wZS5zdGF0cy5ldGwuc3RhcnRfdGltZSl7XG5cdFx0XHRcdFx0XHQkc2NvcGUuaGFzRVRMUnVuID0gdHJ1ZTtcblxuXHRcdFx0XHRcdFx0Ly9zZXQgbGlzdCBvZiBzdXJ2ZXlzIGluIHNjb3BlXG5cdFx0XHRcdFx0XHQkc2NvcGUuc3VydmV5cyA9ICRzY29wZS5zdGF0cy5ldGwuc3VydmV5cztcblxuXHRcdFx0XHRcdFx0dmFyIG1zRGlmZiA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gbmV3IERhdGUoJHNjb3BlLnN0YXRzLmV0bC5lbmRfdGltZSkuZ2V0VGltZSgpOyAvL0RpZmZlcmVuY2UgaW4gbXNcblxuXHRcdFx0XHRcdFx0Ly9Ib3cgbG9uZyBoYXMgaXQgYmVlbiBzaW5jZSB3ZSBsYXN0IHJlY29yZGVkIGFuIEVUTCBydW4/XG5cdFx0XHRcdFx0XHQkc2NvcGUuZGF5RGlmZiA9IG1pbGxpc2Vjb25kc1RvRGF5cyhtc0RpZmYpOyAvL3JldHVybnMge2RheXMsIGhvdXJzLCBtaW51dGVzfSBvYmplY3QuXG5cblx0XHRcdFx0XHRcdGlmKCRzY29wZS5kYXlEaWZmLmRheXMgPj0gMyAmJiAkc2NvcGUuZGF5RGlmZi5kYXlzIDwgNyl7XG5cdFx0XHRcdFx0XHRcdC8vQmV0d2VlbiAzIGRheXMgYW5kIDEgd2Vlay5cblx0XHRcdFx0XHRcdFx0JHNjb3BlLnN0YXRzLmV0bC5tZWRpdW0gPSB0cnVlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxzZSAgaWYoJHNjb3BlLmRheURpZmYuZGF5cyA+PSA3ICYmICRzY29wZS5kYXlEaWZmLmRheXMgPCAxNCkge1xuXHRcdFx0XHRcdFx0XHQvL0dyZWF0ZXIgdGhhbiAxIHdlZWsgb2xkXG5cdFx0XHRcdFx0XHRcdCRzY29wZS5zdGF0cy5ldGwuaGlnaCA9IHRydWU7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbHNle1xuXHRcdFx0XHRcdFx0XHQvL090aGVyIC0gbGVzcyB0aGFuIDMgZGF5cyBvciBzb21ldGhpbmcgZWxzZS5cblx0XHRcdFx0XHRcdFx0JHNjb3BlLnN0YXRzLmV0bC5sb3cgPSB0cnVlO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2V7XG5cdFx0XHRcdFx0XHQkc2NvcGUuaGFzRVRMUnVuID0gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXG5cblxuXG5cdFx0XHRcdFx0Ly9TZWUgaG93IGxvbmcgaXRzIGJlZW4gc2luZSB0aGUgbGFzdCBEQiBCYWNrdXAuXG5cdFx0XHRcdFx0aWYoJHNjb3BlLnN0YXRzICYmICRzY29wZS5zdGF0cy5sYXRlc3QgJiYgJHNjb3BlLnN0YXRzLmxhdGVzdC5sYXRlc3RCYWNrdXApe1xuXHRcdFx0XHRcdFx0JHNjb3BlLmhhc0RCQmFja3VwUnVuID0gdHJ1ZTtcblxuXHRcdFx0XHRcdFx0dmFyIG1zRGlmZiA9IG5ldyBEYXRlKCkuZ2V0VGltZSgpIC0gbmV3IERhdGUoJHNjb3BlLnN0YXRzLmxhdGVzdC5sYXRlc3RCYWNrdXAudGltZSkuZ2V0VGltZSgpOyAvL0RpZmZlcmVuY2UgaW4gbXNcblxuXHRcdFx0XHRcdFx0Ly9Ib3cgbG9uZyBoYXMgaXQgYmVlbiBzaW5jZSB3ZSBsYXN0IHJlY29yZGVkIGFuIEVUTCBydW4/XG5cdFx0XHRcdFx0XHQkc2NvcGUuYmFja3VwRGF5RGlmZiA9IG1pbGxpc2Vjb25kc1RvRGF5cyhtc0RpZmYpOyAvL3JldHVybnMge2RheXMsIGhvdXJzLCBtaW51dGVzfSBvYmplY3QuXG5cblx0XHRcdFx0XHRcdGlmKCRzY29wZS5iYWNrdXBEYXlEaWZmLmRheXMgPj0gMyAmJiAkc2NvcGUuYmFja3VwRGF5RGlmZi5kYXlzIDwgNyl7XG5cdFx0XHRcdFx0XHRcdC8vQmV0d2VlbiAzIGRheXMgYW5kIDEgd2Vlay5cblx0XHRcdFx0XHRcdFx0JHNjb3BlLnN0YXRzLmxhdGVzdC5tZWRpdW0gPSB0cnVlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxzZSAgaWYoJHNjb3BlLmJhY2t1cERheURpZmYuZGF5cyA+PSA3ICYmICRzY29wZS5iYWNrdXBEYXlEaWZmLmRheXMgPCAxNCkge1xuXHRcdFx0XHRcdFx0XHQvL0dyZWF0ZXIgdGhhbiAxIHdlZWsgb2xkXG5cdFx0XHRcdFx0XHRcdCRzY29wZS5zdGF0cy5sYXRlc3QuaGlnaCA9IHRydWU7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbHNle1xuXHRcdFx0XHRcdFx0XHQvL090aGVyIC0gbGVzcyB0aGFuIDMgZGF5cyBvciBzb21ldGhpbmcgZWxzZS5cblx0XHRcdFx0XHRcdFx0JHNjb3BlLnN0YXRzLmxhdGVzdC5sb3cgPSB0cnVlO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2V7XG5cdFx0XHRcdFx0XHQkc2NvcGUuaGFzREJCYWNrdXBSdW4gPSBmYWxzZTtcblx0XHRcdFx0XHR9XG5cblxuXG5cdFx0XHRcdFx0Ly9TZWUgaG93IGxvbmcgaXRzIGJlZW4gc2luZSB0aGUgbGFzdCBiYWNrdXAgdXBsb2FkIHRvIFMzLlxuXHRcdFx0XHRcdGlmKCRzY29wZS5zdGF0cyAmJiAkc2NvcGUuc3RhdHMubGF0ZXN0ICYmICRzY29wZS5zdGF0cy5sYXRlc3QudXBsb2FkVG9TMyl7XG5cdFx0XHRcdFx0XHQkc2NvcGUuaGFzUzNCYWNrdXBSdW4gPSB0cnVlO1xuXG5cdFx0XHRcdFx0XHR2YXIgbXNEaWZmID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBuZXcgRGF0ZSgkc2NvcGUuc3RhdHMubGF0ZXN0Lmxhc3RVcGxvYWRlZCkuZ2V0VGltZSgpOyAvL0RpZmZlcmVuY2UgaW4gbXNcblxuXHRcdFx0XHRcdFx0Ly9Ib3cgbG9uZyBoYXMgaXQgYmVlbiBzaW5jZSB3ZSBsYXN0IHJlY29yZGVkIGFuIEVUTCBydW4/XG5cdFx0XHRcdFx0XHQkc2NvcGUuczNEYXlEaWZmID0gbWlsbGlzZWNvbmRzVG9EYXlzKG1zRGlmZik7IC8vcmV0dXJucyB7ZGF5cywgaG91cnMsIG1pbnV0ZXN9IG9iamVjdC5cblxuXHRcdFx0XHRcdFx0aWYoJHNjb3BlLnMzRGF5RGlmZi5kYXlzID49IDMgJiYgJHNjb3BlLnMzRGF5RGlmZi5kYXlzIDwgNyl7XG5cdFx0XHRcdFx0XHRcdC8vQmV0d2VlbiAzIGRheXMgYW5kIDEgd2Vlay5cblx0XHRcdFx0XHRcdFx0JHNjb3BlLnN0YXRzLmxhdGVzdC51cGxvYWRUb1MzLm1lZGl1bSA9IHRydWU7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbHNlICBpZigkc2NvcGUuczNEYXlEaWZmLmRheXMgPj0gNyAmJiAkc2NvcGUuczNEYXlEaWZmLmRheXMgPCAxNCkge1xuXHRcdFx0XHRcdFx0XHQvL0dyZWF0ZXIgdGhhbiAxIHdlZWsgb2xkXG5cdFx0XHRcdFx0XHRcdCRzY29wZS5zdGF0cy5sYXRlc3QudXBsb2FkVG9TMy5oaWdoID0gdHJ1ZTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGVsc2V7XG5cdFx0XHRcdFx0XHRcdC8vT3RoZXIgLSBsZXNzIHRoYW4gMyBkYXlzIG9yIHNvbWV0aGluZyBlbHNlLlxuXHRcdFx0XHRcdFx0XHQkc2NvcGUuc3RhdHMubGF0ZXN0LnVwbG9hZFRvUzMubG93ID0gdHJ1ZTtcblx0XHRcdFx0XHRcdH1cblxuXHRcdFx0XHRcdH1cblx0XHRcdFx0XHRlbHNle1xuXHRcdFx0XHRcdFx0JHNjb3BlLmhhc1MzQmFja3VwUnVuID0gZmFsc2U7XG5cdFx0XHRcdFx0fVxuXG5cdFx0XHRcdH0pO1xuXG5cdFx0XHQvL0Rpc2FibGUgc3Bpbm5lci5cblx0XHRcdCRzY29wZS5sb2FkaW5nID0gZmFsc2U7XG5cblx0XHR9XG5cblx0XHQvL0tpY2sgaXQgb2ZmIG9uIGxvYWRcblx0XHQkc2NvcGUucmVmcmVzaFN0YXRzKCk7XG5cblxuXHRcdC8vIEdFVCA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0XHQvLyBpZiB1c2VyIHdhbnRzIHRvIHRyaWdnZXIgYSBqb2IgdmlhIHRoZSBBUElcblx0XHQkc2NvcGUucnVuQWxsID0gZnVuY3Rpb24oKXtcblx0XHRcdC8vUnVuIGFsbCBqb2JzIChEb3dubG9hZCBGb3JtSHViIERhdGEsIEluc2VydCBJbnRvIERCLCBCYWNrdXAsIFNlbmQgdG8gUzNcblxuXHRcdFx0Ly9Mb2FkIHNwaW5uZXJcblx0XHRcdCRzY29wZS5sb2FkaW5nID0gdHJ1ZTtcblxuXHRcdFx0RVRMLnJ1bkFsbCgpXG5cdFx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdFx0XHRcdC8vUmVmcmVzaCBzdGF0cywgYW5kIGdvIHRvIGhvbWUgcGFnZS5cblx0XHRcdFx0XHQgICRzY29wZS5yZWZyZXNoU3RhdHMoKTtcblxuXHRcdFx0XHRcdC8vSGlkZSBzcGlubmVyXG5cdFx0XHRcdFx0JHNjb3BlLmxvYWRpbmcgPSBmYWxzZTtcblx0XHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0JHNjb3BlLnN5bmNoRm9ybUh1YkRhdGEgPSBmdW5jdGlvbigpe1xuXHRcdFx0Ly9SdW4gRG93bmxvYWQgRm9ybUh1YiBEYXRhXG5cblx0XHRcdC8vTG9hZCBzcGlubmVyXG5cdFx0XHQkc2NvcGUubG9hZGluZyA9IHRydWU7XG5cblx0XHRcdEVUTC5ldGwoKVxuXHRcdFx0XHQuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRcdFx0Ly9SZWZyZXNoIHN0YXRzLCBhbmQgZ28gdG8gaG9tZSBwYWdlLlxuXHRcdFx0XHRcdCRzY29wZS5yZWZyZXNoU3RhdHMoKTtcblxuXHRcdFx0XHRcdC8vSGlkZSBzcGlubmVyXG5cdFx0XHRcdFx0JHNjb3BlLmxvYWRpbmcgPSBmYWxzZTtcblx0XHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0JHNjb3BlLmJhY2t1cERCPSBmdW5jdGlvbigpe1xuXHRcdFx0Ly9SdW4gRG93bmxvYWQgRm9ybUh1YiBEYXRhXG5cblx0XHRcdC8vTG9hZCBzcGlubmVyXG5cdFx0XHQkc2NvcGUubG9hZGluZyA9IHRydWU7XG5cblx0XHRcdEVUTC5iYWNrdXBEQigpXG5cdFx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdFx0XHQvL1JlZnJlc2ggc3RhdHMsIGFuZCBnbyB0byBob21lIHBhZ2UuXG5cdFx0XHRcdFx0JHNjb3BlLnJlZnJlc2hTdGF0cygpO1xuXG5cdFx0XHRcdFx0Ly9IaWRlIHNwaW5uZXJcblx0XHRcdFx0XHQkc2NvcGUubG9hZGluZyA9IGZhbHNlO1xuXHRcdFx0XHR9KTtcblx0XHR9XG5cblx0XHQkc2NvcGUuc2VuZFRvUzM9IGZ1bmN0aW9uKCl7XG5cdFx0XHQvL1J1biBEb3dubG9hZCBGb3JtSHViIERhdGFcblxuXHRcdFx0Ly9Mb2FkIHNwaW5uZXJcblx0XHRcdCRzY29wZS5sb2FkaW5nID0gdHJ1ZTtcblxuXHRcdFx0RVRMLnVwbG9hZFRvUzMoKVxuXHRcdFx0XHQuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRcdFx0Ly9SZWZyZXNoIHN0YXRzLCBhbmQgZ28gdG8gaG9tZSBwYWdlLlxuXHRcdFx0XHRcdCRzY29wZS5yZWZyZXNoU3RhdHMoKTtcblxuXHRcdFx0XHRcdC8vSGlkZSBzcGlubmVyXG5cdFx0XHRcdFx0JHNjb3BlLmxvYWRpbmcgPSBmYWxzZTtcblx0XHRcdFx0fSk7XG5cdFx0fVxuXG5cblx0XHQvKioqXG5cdFx0ICpcblx0XHQgKiBSZXBvcnRzIFNlY3Rpb25cblx0XHQgKi9cblxuXHRcdCRzY29wZS5nZXRSZXBvcnQgPSBmdW5jdGlvbihyZXBvcnRfbmFtZSl7XG5cdFx0XHQvL1N0b3JlIHRoZSBzZWxlY3RlZCByZXBvcnRcblx0XHRcdCRzY29wZS5yZXBvcnROYW1lID0gcmVwb3J0X25hbWU7XG5cblx0XHRcdFJlcG9ydHMuZ2V0KHJlcG9ydF9uYW1lKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdFx0Ly9SZWZyZXNoIHN0YXRzLCBhbmQgZ28gdG8gaG9tZSBwYWdlLlxuXHRcdFx0XHQkc2NvcGUucmVmcmVzaFN0YXRzKCk7XG5cblx0XHRcdFx0JHNjb3BlLmN1cnJlbnRSZXBvcnQgPSBkYXRhO1xuXG5cdFx0XHRcdGlmKGRhdGEgJiYgZGF0YS5sZW5ndGggPiAwKXtcblx0XHRcdFx0XHQkc2NvcGUua2V5cyA9IE9iamVjdC5rZXlzKGRhdGFbMF0pOyAvL1VzZSB0aGlzIHRvIGl0ZXJhdGUgdXNpbmcgbmctcmVwZWF0LlxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly9IaWRlIHNwaW5uZXJcblx0XHRcdFx0JHNjb3BlLmxvYWRpbmcgPSBmYWxzZTtcblx0XHRcdH0pO1xuXG5cdFx0fVxuXG5cdFx0Ly9GZXRjaCB0aGUgbGlzdCBvZiByZXBvcnRzIGRlZmluZWQgaW4gcHVibGljL3JlcG9ydHMvcmVwb3J0cy5qc1xuXHRcdCRzY29wZS5nZXRSZXBvcnRMaXN0ID0gZnVuY3Rpb24oKXtcblxuXHRcdFx0XHQkc2NvcGUucmVwb3J0TGlzdCA9IFJlcG9ydHMuZ2V0UmVwb3J0TGlzdCgpO1xuXG5cdFx0fVxuXG5cdFx0JHNjb3BlLmdldFJlcG9ydExpc3QoKTtcblxuXG5cblx0XHQkc2NvcGUuZG93bmxvYWRSZXBvcnRDU1YgPSBmdW5jdGlvbihyZXBvcnRfbmFtZSl7XG5cdFx0XHRSZXBvcnRzLmdldENTVihyZXBvcnRfbmFtZSkuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRcdCAvL3Nob3VsZCBoYXZlIGRvd25sb2FkZWQgY3N2LlxuXHRcdFx0fSk7XG5cdFx0fVxuXG5cblx0XHQgZnVuY3Rpb24gbWlsbGlzZWNvbmRzVG9EYXlzKHQpe1xuXHRcdFx0dmFyIGNkID0gMjQgKiA2MCAqIDYwICogMTAwMCxcblx0XHRcdFx0Y2ggPSA2MCAqIDYwICogMTAwMCxcblx0XHRcdFx0ZCA9IE1hdGguZmxvb3IodCAvIGNkKSxcblx0XHRcdFx0aCA9IE1hdGguZmxvb3IoICh0IC0gZCAqIGNkKSAvIGNoKSxcblx0XHRcdFx0bSA9IE1hdGgucm91bmQoICh0IC0gZCAqIGNkIC0gaCAqIGNoKSAvIDYwMDAwKTtcblxuXHRcdFx0aWYoIG0gPT09IDYwICl7XG5cdFx0XHRcdGgrKztcblx0XHRcdFx0bSA9IDA7XG5cdFx0XHR9XG5cdFx0XHRpZiggaCA9PT0gMjQgKXtcblx0XHRcdFx0ZCsrO1xuXHRcdFx0XHRoID0gMDtcblx0XHRcdH1cblx0XHRcdHJldHVybiB7IGRheXM6IGQsIGhvdXJzOiBoLCBtaW51dGVzOiBtIH07XG5cdFx0fVxuXG5cdH1dKTsiLCJhbmd1bGFyLm1vZHVsZSgnVFRMX0VUTF9VSScsIFsndHRsQ29udHJvbGxlcicsICd0dGxTZXJ2aWNlJywgJ3N0YXRzU2VydmljZScsICdldGxTZXJ2aWNlJywgJ3JlcG9ydFNlcnZpY2UnXSk7XG5cblxucmVxdWlyZSgnLi9jb250cm9sbGVycy9tYWluLmpzJyk7XG5yZXF1aXJlKCcuL3NlcnZpY2VzL2V0bC5qcycpO1xucmVxdWlyZSgnLi9zZXJ2aWNlcy9yZXBvcnRzLmpzJyk7XG5yZXF1aXJlKCcuL3NlcnZpY2VzL3N0YXRzLmpzJyk7XG5yZXF1aXJlKCcuL3NlcnZpY2VzL3N1cnZleXMuanMnKTsiLCJhbmd1bGFyLm1vZHVsZSgnZXRsU2VydmljZScsIFtdKVxuXG5cdC8vIGVhY2ggZnVuY3Rpb24gcmV0dXJucyBhIHByb21pc2Ugb2JqZWN0IFxuXHQuZmFjdG9yeSgnRVRMJywgWyckaHR0cCcsZnVuY3Rpb24oJGh0dHApIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0cnVuQWxsIDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiAkaHR0cC5nZXQoJy9ydW5hbGwnKTtcblx0XHRcdH0sXG5cdFx0XHRldGwgOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0Ly9Eb3dubG9hZCBGb3JtSHViIERhdGFcblx0XHRcdFx0cmV0dXJuICRodHRwLmdldCgnL2V0bCcpO1xuXHRcdFx0fSxcblx0XHRcdGJhY2t1cERCIDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdC8vRG93bmxvYWQgRm9ybUh1YiBEYXRhXG5cdFx0XHRcdHJldHVybiAkaHR0cC5nZXQoJy9iYWNrdXAnKTtcblx0XHRcdH0sXG5cdFx0XHR1cGxvYWRUb1MzIDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdC8vRG93bmxvYWQgRm9ybUh1YiBEYXRhXG5cdFx0XHRcdHJldHVybiAkaHR0cC5nZXQoJy9zZW5kdG9zMycpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHR9XSk7IiwiYW5ndWxhci5tb2R1bGUoJ3JlcG9ydFNlcnZpY2UnLCBbXSlcblxuXHQvLyBlYWNoIGZ1bmN0aW9uIHJldHVybnMgYSBwcm9taXNlIG9iamVjdCBcblx0LmZhY3RvcnkoJ1JlcG9ydHMnLCBbJyRodHRwJyxmdW5jdGlvbigkaHR0cCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRnZXQgOiBmdW5jdGlvbihyZXBvcnRfbmFtZSkge1xuXHRcdFx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvcmVwb3J0cy8nICsgcmVwb3J0X25hbWUpO1xuXHRcdFx0fSxcblx0XHRcdGdldFJlcG9ydExpc3QgOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuIHJlcG9ydHM7XG5cdFx0XHR9LFxuXHRcdFx0Z2V0Q1NWIDogZnVuY3Rpb24ocmVwb3J0X25hbWUpe1xuXHRcdFx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvcmVwb3J0cy8nICsgcmVwb3J0X25hbWUgKyBcIi9jc3ZcIik7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XSk7IiwiYW5ndWxhci5tb2R1bGUoJ3N0YXRzU2VydmljZScsIFtdKVxuXG5cdC8vIGVhY2ggZnVuY3Rpb24gcmV0dXJucyBhIHByb21pc2Ugb2JqZWN0IFxuXHQuZmFjdG9yeSgnU3RhdHMnLCBbJyRodHRwJyxmdW5jdGlvbigkaHR0cCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRnZXQgOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuICRodHRwLmdldCgnL3N0YXRzJyk7XG5cdFx0XHR9XG5cdFx0fVxuXG5cdH1dKTsiLCJhbmd1bGFyLm1vZHVsZSgndHRsU2VydmljZScsIFtdKVxuXG5cdC8vIGVhY2ggZnVuY3Rpb24gcmV0dXJucyBhIHByb21pc2Ugb2JqZWN0IFxuXHQuZmFjdG9yeSgnU3VydmV5cycsIFsnJGh0dHAnLGZ1bmN0aW9uKCRodHRwKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdGdldCA6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvc3VydmV5cycpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHR9XSk7Il19
