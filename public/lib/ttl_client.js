(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/ryanwhitley/Documents/GitHub/TTL_ETL/public/js/controllers/main.js":[function(require,module,exports){
angular.module('ttlController', [])

	// inject the  service factory into our controller
	.controller('mainController', ['$scope','$http','Surveys', 'Stats', 'ETL', 'Reports', function($scope, $http, Surveys, Stats, ETL, Reports) {

		$scope.formData = {};
		$scope.loading = true;

		// GET =====================================================================
		// when landing on the page, get all Surveys
		// use the service to get all the surveys
		Surveys.get()
			.success(function(data) {
				$scope.surveys = data;
				$scope.loading = false;
		});

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

		//Fetch the list of reports defined in public/settings/reports.js
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCIvVXNlcnMvcnlhbndoaXRsZXkvRG9jdW1lbnRzL0dpdEh1Yi9UVExfRVRML3B1YmxpYy9qcy9jb250cm9sbGVycy9tYWluLmpzIiwiL1VzZXJzL3J5YW53aGl0bGV5L0RvY3VtZW50cy9HaXRIdWIvVFRMX0VUTC9wdWJsaWMvanMvY29yZS5qcyIsIi9Vc2Vycy9yeWFud2hpdGxleS9Eb2N1bWVudHMvR2l0SHViL1RUTF9FVEwvcHVibGljL2pzL3NlcnZpY2VzL2V0bC5qcyIsIi9Vc2Vycy9yeWFud2hpdGxleS9Eb2N1bWVudHMvR2l0SHViL1RUTF9FVEwvcHVibGljL2pzL3NlcnZpY2VzL3JlcG9ydHMuanMiLCIvVXNlcnMvcnlhbndoaXRsZXkvRG9jdW1lbnRzL0dpdEh1Yi9UVExfRVRML3B1YmxpYy9qcy9zZXJ2aWNlcy9zdGF0cy5qcyIsIi9Vc2Vycy9yeWFud2hpdGxleS9Eb2N1bWVudHMvR2l0SHViL1RUTF9FVEwvcHVibGljL2pzL3NlcnZpY2VzL3N1cnZleXMuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDeFBBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDZkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNWQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsImFuZ3VsYXIubW9kdWxlKCd0dGxDb250cm9sbGVyJywgW10pXG5cblx0Ly8gaW5qZWN0IHRoZSAgc2VydmljZSBmYWN0b3J5IGludG8gb3VyIGNvbnRyb2xsZXJcblx0LmNvbnRyb2xsZXIoJ21haW5Db250cm9sbGVyJywgWyckc2NvcGUnLCckaHR0cCcsJ1N1cnZleXMnLCAnU3RhdHMnLCAnRVRMJywgJ1JlcG9ydHMnLCBmdW5jdGlvbigkc2NvcGUsICRodHRwLCBTdXJ2ZXlzLCBTdGF0cywgRVRMLCBSZXBvcnRzKSB7XG5cblx0XHQkc2NvcGUuZm9ybURhdGEgPSB7fTtcblx0XHQkc2NvcGUubG9hZGluZyA9IHRydWU7XG5cblx0XHQvLyBHRVQgPT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09XG5cdFx0Ly8gd2hlbiBsYW5kaW5nIG9uIHRoZSBwYWdlLCBnZXQgYWxsIFN1cnZleXNcblx0XHQvLyB1c2UgdGhlIHNlcnZpY2UgdG8gZ2V0IGFsbCB0aGUgc3VydmV5c1xuXHRcdFN1cnZleXMuZ2V0KClcblx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdFx0JHNjb3BlLnN1cnZleXMgPSBkYXRhO1xuXHRcdFx0XHQkc2NvcGUubG9hZGluZyA9IGZhbHNlO1xuXHRcdH0pO1xuXG5cdFx0Ly8gR0VUID09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PVxuXHRcdC8vIHdoZW4gbGFuZGluZyBvbiB0aGUgcGFnZSwgZ2V0IGFsbCBTdGF0c1xuXHRcdC8vIHVzZSB0aGUgc2VydmljZSB0byBnZXQgc3RhdHNcblx0XHQkc2NvcGUucmVmcmVzaFN0YXRzID0gZnVuY3Rpb24oKXtcblxuXHRcdFx0U3RhdHMuZ2V0KClcblx0XHRcdFx0LnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0XHRcdCRzY29wZS5zdGF0cyA9IGRhdGE7XG5cblx0XHRcdFx0XHQvL1NlZSBob3cgbG9uZyBpdHMgYmVlbiBzaW5lIHRoZSBsYXN0IEZvcm1IdWIgU3luY2guXG5cdFx0XHRcdFx0aWYoJHNjb3BlLnN0YXRzICYmICRzY29wZS5zdGF0cy5ldGwgJiYgJHNjb3BlLnN0YXRzLmV0bC5zdGFydF90aW1lKXtcblx0XHRcdFx0XHRcdCRzY29wZS5oYXNFVExSdW4gPSB0cnVlO1xuXG5cdFx0XHRcdFx0XHR2YXIgbXNEaWZmID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBuZXcgRGF0ZSgkc2NvcGUuc3RhdHMuZXRsLmVuZF90aW1lKS5nZXRUaW1lKCk7IC8vRGlmZmVyZW5jZSBpbiBtc1xuXG5cdFx0XHRcdFx0XHQvL0hvdyBsb25nIGhhcyBpdCBiZWVuIHNpbmNlIHdlIGxhc3QgcmVjb3JkZWQgYW4gRVRMIHJ1bj9cblx0XHRcdFx0XHRcdCRzY29wZS5kYXlEaWZmID0gbWlsbGlzZWNvbmRzVG9EYXlzKG1zRGlmZik7IC8vcmV0dXJucyB7ZGF5cywgaG91cnMsIG1pbnV0ZXN9IG9iamVjdC5cblxuXHRcdFx0XHRcdFx0aWYoJHNjb3BlLmRheURpZmYuZGF5cyA+PSAzICYmICRzY29wZS5kYXlEaWZmLmRheXMgPCA3KXtcblx0XHRcdFx0XHRcdFx0Ly9CZXR3ZWVuIDMgZGF5cyBhbmQgMSB3ZWVrLlxuXHRcdFx0XHRcdFx0XHQkc2NvcGUuc3RhdHMuZXRsLm1lZGl1bSA9IHRydWU7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbHNlICBpZigkc2NvcGUuZGF5RGlmZi5kYXlzID49IDcgJiYgJHNjb3BlLmRheURpZmYuZGF5cyA8IDE0KSB7XG5cdFx0XHRcdFx0XHRcdC8vR3JlYXRlciB0aGFuIDEgd2VlayBvbGRcblx0XHRcdFx0XHRcdFx0JHNjb3BlLnN0YXRzLmV0bC5oaWdoID0gdHJ1ZTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGVsc2V7XG5cdFx0XHRcdFx0XHRcdC8vT3RoZXIgLSBsZXNzIHRoYW4gMyBkYXlzIG9yIHNvbWV0aGluZyBlbHNlLlxuXHRcdFx0XHRcdFx0XHQkc2NvcGUuc3RhdHMuZXRsLmxvdyA9IHRydWU7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZXtcblx0XHRcdFx0XHRcdCRzY29wZS5oYXNFVExSdW4gPSBmYWxzZTtcblx0XHRcdFx0XHR9XG5cblxuXG5cblx0XHRcdFx0XHQvL1NlZSBob3cgbG9uZyBpdHMgYmVlbiBzaW5lIHRoZSBsYXN0IERCIEJhY2t1cC5cblx0XHRcdFx0XHRpZigkc2NvcGUuc3RhdHMgJiYgJHNjb3BlLnN0YXRzLmxhdGVzdCAmJiAkc2NvcGUuc3RhdHMubGF0ZXN0LmxhdGVzdEJhY2t1cCl7XG5cdFx0XHRcdFx0XHQkc2NvcGUuaGFzREJCYWNrdXBSdW4gPSB0cnVlO1xuXG5cdFx0XHRcdFx0XHR2YXIgbXNEaWZmID0gbmV3IERhdGUoKS5nZXRUaW1lKCkgLSBuZXcgRGF0ZSgkc2NvcGUuc3RhdHMubGF0ZXN0LmxhdGVzdEJhY2t1cC50aW1lKS5nZXRUaW1lKCk7IC8vRGlmZmVyZW5jZSBpbiBtc1xuXG5cdFx0XHRcdFx0XHQvL0hvdyBsb25nIGhhcyBpdCBiZWVuIHNpbmNlIHdlIGxhc3QgcmVjb3JkZWQgYW4gRVRMIHJ1bj9cblx0XHRcdFx0XHRcdCRzY29wZS5iYWNrdXBEYXlEaWZmID0gbWlsbGlzZWNvbmRzVG9EYXlzKG1zRGlmZik7IC8vcmV0dXJucyB7ZGF5cywgaG91cnMsIG1pbnV0ZXN9IG9iamVjdC5cblxuXHRcdFx0XHRcdFx0aWYoJHNjb3BlLmJhY2t1cERheURpZmYuZGF5cyA+PSAzICYmICRzY29wZS5iYWNrdXBEYXlEaWZmLmRheXMgPCA3KXtcblx0XHRcdFx0XHRcdFx0Ly9CZXR3ZWVuIDMgZGF5cyBhbmQgMSB3ZWVrLlxuXHRcdFx0XHRcdFx0XHQkc2NvcGUuc3RhdHMubGF0ZXN0Lm1lZGl1bSA9IHRydWU7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0XHRlbHNlICBpZigkc2NvcGUuYmFja3VwRGF5RGlmZi5kYXlzID49IDcgJiYgJHNjb3BlLmJhY2t1cERheURpZmYuZGF5cyA8IDE0KSB7XG5cdFx0XHRcdFx0XHRcdC8vR3JlYXRlciB0aGFuIDEgd2VlayBvbGRcblx0XHRcdFx0XHRcdFx0JHNjb3BlLnN0YXRzLmxhdGVzdC5oaWdoID0gdHJ1ZTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGVsc2V7XG5cdFx0XHRcdFx0XHRcdC8vT3RoZXIgLSBsZXNzIHRoYW4gMyBkYXlzIG9yIHNvbWV0aGluZyBlbHNlLlxuXHRcdFx0XHRcdFx0XHQkc2NvcGUuc3RhdHMubGF0ZXN0LmxvdyA9IHRydWU7XG5cdFx0XHRcdFx0XHR9XG5cblx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0ZWxzZXtcblx0XHRcdFx0XHRcdCRzY29wZS5oYXNEQkJhY2t1cFJ1biA9IGZhbHNlO1xuXHRcdFx0XHRcdH1cblxuXG5cblx0XHRcdFx0XHQvL1NlZSBob3cgbG9uZyBpdHMgYmVlbiBzaW5lIHRoZSBsYXN0IGJhY2t1cCB1cGxvYWQgdG8gUzMuXG5cdFx0XHRcdFx0aWYoJHNjb3BlLnN0YXRzICYmICRzY29wZS5zdGF0cy5sYXRlc3QgJiYgJHNjb3BlLnN0YXRzLmxhdGVzdC51cGxvYWRUb1MzKXtcblx0XHRcdFx0XHRcdCRzY29wZS5oYXNTM0JhY2t1cFJ1biA9IHRydWU7XG5cblx0XHRcdFx0XHRcdHZhciBtc0RpZmYgPSBuZXcgRGF0ZSgpLmdldFRpbWUoKSAtIG5ldyBEYXRlKCRzY29wZS5zdGF0cy5sYXRlc3QubGFzdFVwbG9hZGVkKS5nZXRUaW1lKCk7IC8vRGlmZmVyZW5jZSBpbiBtc1xuXG5cdFx0XHRcdFx0XHQvL0hvdyBsb25nIGhhcyBpdCBiZWVuIHNpbmNlIHdlIGxhc3QgcmVjb3JkZWQgYW4gRVRMIHJ1bj9cblx0XHRcdFx0XHRcdCRzY29wZS5zM0RheURpZmYgPSBtaWxsaXNlY29uZHNUb0RheXMobXNEaWZmKTsgLy9yZXR1cm5zIHtkYXlzLCBob3VycywgbWludXRlc30gb2JqZWN0LlxuXG5cdFx0XHRcdFx0XHRpZigkc2NvcGUuczNEYXlEaWZmLmRheXMgPj0gMyAmJiAkc2NvcGUuczNEYXlEaWZmLmRheXMgPCA3KXtcblx0XHRcdFx0XHRcdFx0Ly9CZXR3ZWVuIDMgZGF5cyBhbmQgMSB3ZWVrLlxuXHRcdFx0XHRcdFx0XHQkc2NvcGUuc3RhdHMubGF0ZXN0LnVwbG9hZFRvUzMubWVkaXVtID0gdHJ1ZTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHRcdGVsc2UgIGlmKCRzY29wZS5zM0RheURpZmYuZGF5cyA+PSA3ICYmICRzY29wZS5zM0RheURpZmYuZGF5cyA8IDE0KSB7XG5cdFx0XHRcdFx0XHRcdC8vR3JlYXRlciB0aGFuIDEgd2VlayBvbGRcblx0XHRcdFx0XHRcdFx0JHNjb3BlLnN0YXRzLmxhdGVzdC51cGxvYWRUb1MzLmhpZ2ggPSB0cnVlO1xuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdFx0ZWxzZXtcblx0XHRcdFx0XHRcdFx0Ly9PdGhlciAtIGxlc3MgdGhhbiAzIGRheXMgb3Igc29tZXRoaW5nIGVsc2UuXG5cdFx0XHRcdFx0XHRcdCRzY29wZS5zdGF0cy5sYXRlc3QudXBsb2FkVG9TMy5sb3cgPSB0cnVlO1xuXHRcdFx0XHRcdFx0fVxuXG5cdFx0XHRcdFx0fVxuXHRcdFx0XHRcdGVsc2V7XG5cdFx0XHRcdFx0XHQkc2NvcGUuaGFzUzNCYWNrdXBSdW4gPSBmYWxzZTtcblx0XHRcdFx0XHR9XG5cblx0XHRcdFx0fSk7XG5cblx0XHR9XG5cblx0XHQvL0tpY2sgaXQgb2ZmIG9uIGxvYWRcblx0XHQkc2NvcGUucmVmcmVzaFN0YXRzKCk7XG5cblxuXHRcdC8vIEdFVCA9PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT1cblx0XHQvLyBpZiB1c2VyIHdhbnRzIHRvIHRyaWdnZXIgYSBqb2IgdmlhIHRoZSBBUElcblx0XHQkc2NvcGUucnVuQWxsID0gZnVuY3Rpb24oKXtcblx0XHRcdC8vUnVuIGFsbCBqb2JzIChEb3dubG9hZCBGb3JtSHViIERhdGEsIEluc2VydCBJbnRvIERCLCBCYWNrdXAsIFNlbmQgdG8gUzNcblxuXHRcdFx0Ly9Mb2FkIHNwaW5uZXJcblx0XHRcdCRzY29wZS5sb2FkaW5nID0gdHJ1ZTtcblxuXHRcdFx0RVRMLnJ1bkFsbCgpXG5cdFx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdFx0XHRcdC8vUmVmcmVzaCBzdGF0cywgYW5kIGdvIHRvIGhvbWUgcGFnZS5cblx0XHRcdFx0XHQgICRzY29wZS5yZWZyZXNoU3RhdHMoKTtcblxuXHRcdFx0XHRcdC8vSGlkZSBzcGlubmVyXG5cdFx0XHRcdFx0JHNjb3BlLmxvYWRpbmcgPSBmYWxzZTtcblx0XHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0JHNjb3BlLnN5bmNoRm9ybUh1YkRhdGEgPSBmdW5jdGlvbigpe1xuXHRcdFx0Ly9SdW4gRG93bmxvYWQgRm9ybUh1YiBEYXRhXG5cblx0XHRcdC8vTG9hZCBzcGlubmVyXG5cdFx0XHQkc2NvcGUubG9hZGluZyA9IHRydWU7XG5cblx0XHRcdEVUTC5ldGwoKVxuXHRcdFx0XHQuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRcdFx0Ly9SZWZyZXNoIHN0YXRzLCBhbmQgZ28gdG8gaG9tZSBwYWdlLlxuXHRcdFx0XHRcdCRzY29wZS5yZWZyZXNoU3RhdHMoKTtcblxuXHRcdFx0XHRcdC8vSGlkZSBzcGlubmVyXG5cdFx0XHRcdFx0JHNjb3BlLmxvYWRpbmcgPSBmYWxzZTtcblx0XHRcdFx0fSk7XG5cdFx0fVxuXG5cdFx0JHNjb3BlLmJhY2t1cERCPSBmdW5jdGlvbigpe1xuXHRcdFx0Ly9SdW4gRG93bmxvYWQgRm9ybUh1YiBEYXRhXG5cblx0XHRcdC8vTG9hZCBzcGlubmVyXG5cdFx0XHQkc2NvcGUubG9hZGluZyA9IHRydWU7XG5cblx0XHRcdEVUTC5iYWNrdXBEQigpXG5cdFx0XHRcdC5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdFx0XHQvL1JlZnJlc2ggc3RhdHMsIGFuZCBnbyB0byBob21lIHBhZ2UuXG5cdFx0XHRcdFx0JHNjb3BlLnJlZnJlc2hTdGF0cygpO1xuXG5cdFx0XHRcdFx0Ly9IaWRlIHNwaW5uZXJcblx0XHRcdFx0XHQkc2NvcGUubG9hZGluZyA9IGZhbHNlO1xuXHRcdFx0XHR9KTtcblx0XHR9XG5cblx0XHQkc2NvcGUuc2VuZFRvUzM9IGZ1bmN0aW9uKCl7XG5cdFx0XHQvL1J1biBEb3dubG9hZCBGb3JtSHViIERhdGFcblxuXHRcdFx0Ly9Mb2FkIHNwaW5uZXJcblx0XHRcdCRzY29wZS5sb2FkaW5nID0gdHJ1ZTtcblxuXHRcdFx0RVRMLnVwbG9hZFRvUzMoKVxuXHRcdFx0XHQuc3VjY2VzcyhmdW5jdGlvbihkYXRhKSB7XG5cdFx0XHRcdFx0Ly9SZWZyZXNoIHN0YXRzLCBhbmQgZ28gdG8gaG9tZSBwYWdlLlxuXHRcdFx0XHRcdCRzY29wZS5yZWZyZXNoU3RhdHMoKTtcblxuXHRcdFx0XHRcdC8vSGlkZSBzcGlubmVyXG5cdFx0XHRcdFx0JHNjb3BlLmxvYWRpbmcgPSBmYWxzZTtcblx0XHRcdFx0fSk7XG5cdFx0fVxuXG5cblx0XHQvKioqXG5cdFx0ICpcblx0XHQgKiBSZXBvcnRzIFNlY3Rpb25cblx0XHQgKi9cblxuXHRcdCRzY29wZS5nZXRSZXBvcnQgPSBmdW5jdGlvbihyZXBvcnRfbmFtZSl7XG5cdFx0XHQvL1N0b3JlIHRoZSBzZWxlY3RlZCByZXBvcnRcblx0XHRcdCRzY29wZS5yZXBvcnROYW1lID0gcmVwb3J0X25hbWU7XG5cblx0XHRcdFJlcG9ydHMuZ2V0KHJlcG9ydF9uYW1lKS5zdWNjZXNzKGZ1bmN0aW9uKGRhdGEpIHtcblx0XHRcdFx0Ly9SZWZyZXNoIHN0YXRzLCBhbmQgZ28gdG8gaG9tZSBwYWdlLlxuXHRcdFx0XHQkc2NvcGUucmVmcmVzaFN0YXRzKCk7XG5cblx0XHRcdFx0JHNjb3BlLmN1cnJlbnRSZXBvcnQgPSBkYXRhO1xuXG5cdFx0XHRcdGlmKGRhdGEgJiYgZGF0YS5sZW5ndGggPiAwKXtcblx0XHRcdFx0XHQkc2NvcGUua2V5cyA9IE9iamVjdC5rZXlzKGRhdGFbMF0pOyAvL1VzZSB0aGlzIHRvIGl0ZXJhdGUgdXNpbmcgbmctcmVwZWF0LlxuXHRcdFx0XHR9XG5cblx0XHRcdFx0Ly9IaWRlIHNwaW5uZXJcblx0XHRcdFx0JHNjb3BlLmxvYWRpbmcgPSBmYWxzZTtcblx0XHRcdH0pO1xuXG5cdFx0fVxuXG5cdFx0Ly9GZXRjaCB0aGUgbGlzdCBvZiByZXBvcnRzIGRlZmluZWQgaW4gcHVibGljL3NldHRpbmdzL3JlcG9ydHMuanNcblx0XHQkc2NvcGUuZ2V0UmVwb3J0TGlzdCA9IGZ1bmN0aW9uKCl7XG5cblx0XHRcdFx0JHNjb3BlLnJlcG9ydExpc3QgPSBSZXBvcnRzLmdldFJlcG9ydExpc3QoKTtcblxuXHRcdH1cblxuXHRcdCRzY29wZS5nZXRSZXBvcnRMaXN0KCk7XG5cblxuXG5cdFx0JHNjb3BlLmRvd25sb2FkUmVwb3J0Q1NWID0gZnVuY3Rpb24ocmVwb3J0X25hbWUpe1xuXHRcdFx0UmVwb3J0cy5nZXRDU1YocmVwb3J0X25hbWUpLnN1Y2Nlc3MoZnVuY3Rpb24oZGF0YSkge1xuXHRcdFx0XHQgLy9zaG91bGQgaGF2ZSBkb3dubG9hZGVkIGNzdi5cblx0XHRcdH0pO1xuXHRcdH1cblxuXG5cdFx0IGZ1bmN0aW9uIG1pbGxpc2Vjb25kc1RvRGF5cyh0KXtcblx0XHRcdHZhciBjZCA9IDI0ICogNjAgKiA2MCAqIDEwMDAsXG5cdFx0XHRcdGNoID0gNjAgKiA2MCAqIDEwMDAsXG5cdFx0XHRcdGQgPSBNYXRoLmZsb29yKHQgLyBjZCksXG5cdFx0XHRcdGggPSBNYXRoLmZsb29yKCAodCAtIGQgKiBjZCkgLyBjaCksXG5cdFx0XHRcdG0gPSBNYXRoLnJvdW5kKCAodCAtIGQgKiBjZCAtIGggKiBjaCkgLyA2MDAwMCk7XG5cblx0XHRcdGlmKCBtID09PSA2MCApe1xuXHRcdFx0XHRoKys7XG5cdFx0XHRcdG0gPSAwO1xuXHRcdFx0fVxuXHRcdFx0aWYoIGggPT09IDI0ICl7XG5cdFx0XHRcdGQrKztcblx0XHRcdFx0aCA9IDA7XG5cdFx0XHR9XG5cdFx0XHRyZXR1cm4geyBkYXlzOiBkLCBob3VyczogaCwgbWludXRlczogbSB9O1xuXHRcdH1cblxuXHR9XSk7IiwiYW5ndWxhci5tb2R1bGUoJ1RUTF9FVExfVUknLCBbJ3R0bENvbnRyb2xsZXInLCAndHRsU2VydmljZScsICdzdGF0c1NlcnZpY2UnLCAnZXRsU2VydmljZScsICdyZXBvcnRTZXJ2aWNlJ10pO1xuXG5cbnJlcXVpcmUoJy4vY29udHJvbGxlcnMvbWFpbi5qcycpO1xucmVxdWlyZSgnLi9zZXJ2aWNlcy9ldGwuanMnKTtcbnJlcXVpcmUoJy4vc2VydmljZXMvcmVwb3J0cy5qcycpO1xucmVxdWlyZSgnLi9zZXJ2aWNlcy9zdGF0cy5qcycpO1xucmVxdWlyZSgnLi9zZXJ2aWNlcy9zdXJ2ZXlzLmpzJyk7IiwiYW5ndWxhci5tb2R1bGUoJ2V0bFNlcnZpY2UnLCBbXSlcblxuXHQvLyBlYWNoIGZ1bmN0aW9uIHJldHVybnMgYSBwcm9taXNlIG9iamVjdCBcblx0LmZhY3RvcnkoJ0VUTCcsIFsnJGh0dHAnLGZ1bmN0aW9uKCRodHRwKSB7XG5cdFx0cmV0dXJuIHtcblx0XHRcdHJ1bkFsbCA6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvcnVuYWxsJyk7XG5cdFx0XHR9LFxuXHRcdFx0ZXRsIDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdC8vRG93bmxvYWQgRm9ybUh1YiBEYXRhXG5cdFx0XHRcdHJldHVybiAkaHR0cC5nZXQoJy9ldGwnKTtcblx0XHRcdH0sXG5cdFx0XHRiYWNrdXBEQiA6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQvL0Rvd25sb2FkIEZvcm1IdWIgRGF0YVxuXHRcdFx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvYmFja3VwJyk7XG5cdFx0XHR9LFxuXHRcdFx0dXBsb2FkVG9TMyA6IGZ1bmN0aW9uKCkge1xuXHRcdFx0XHQvL0Rvd25sb2FkIEZvcm1IdWIgRGF0YVxuXHRcdFx0XHRyZXR1cm4gJGh0dHAuZ2V0KCcvc2VuZHRvczMnKTtcblx0XHRcdH1cblx0XHR9XG5cblx0fV0pOyIsImFuZ3VsYXIubW9kdWxlKCdyZXBvcnRTZXJ2aWNlJywgW10pXG5cblx0Ly8gZWFjaCBmdW5jdGlvbiByZXR1cm5zIGEgcHJvbWlzZSBvYmplY3QgXG5cdC5mYWN0b3J5KCdSZXBvcnRzJywgWyckaHR0cCcsZnVuY3Rpb24oJGh0dHApIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0Z2V0IDogZnVuY3Rpb24ocmVwb3J0X25hbWUpIHtcblx0XHRcdFx0cmV0dXJuICRodHRwLmdldCgnL3JlcG9ydHMvJyArIHJlcG9ydF9uYW1lKTtcblx0XHRcdH0sXG5cdFx0XHRnZXRSZXBvcnRMaXN0IDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiByZXBvcnRzO1xuXHRcdFx0fSxcblx0XHRcdGdldENTViA6IGZ1bmN0aW9uKHJlcG9ydF9uYW1lKXtcblx0XHRcdFx0cmV0dXJuICRodHRwLmdldCgnL3JlcG9ydHMvJyArIHJlcG9ydF9uYW1lICsgXCIvY3N2XCIpO1xuXHRcdFx0fVxuXHRcdH1cblx0fV0pOyIsImFuZ3VsYXIubW9kdWxlKCdzdGF0c1NlcnZpY2UnLCBbXSlcblxuXHQvLyBlYWNoIGZ1bmN0aW9uIHJldHVybnMgYSBwcm9taXNlIG9iamVjdCBcblx0LmZhY3RvcnkoJ1N0YXRzJywgWyckaHR0cCcsZnVuY3Rpb24oJGh0dHApIHtcblx0XHRyZXR1cm4ge1xuXHRcdFx0Z2V0IDogZnVuY3Rpb24oKSB7XG5cdFx0XHRcdHJldHVybiAkaHR0cC5nZXQoJy9zdGF0cycpO1xuXHRcdFx0fVxuXHRcdH1cblxuXHR9XSk7IiwiYW5ndWxhci5tb2R1bGUoJ3R0bFNlcnZpY2UnLCBbXSlcblxuXHQvLyBlYWNoIGZ1bmN0aW9uIHJldHVybnMgYSBwcm9taXNlIG9iamVjdCBcblx0LmZhY3RvcnkoJ1N1cnZleXMnLCBbJyRodHRwJyxmdW5jdGlvbigkaHR0cCkge1xuXHRcdHJldHVybiB7XG5cdFx0XHRnZXQgOiBmdW5jdGlvbigpIHtcblx0XHRcdFx0cmV0dXJuICRodHRwLmdldCgnL3N1cnZleXMnKTtcblx0XHRcdH1cblx0XHR9XG5cblx0fV0pOyJdfQ==
