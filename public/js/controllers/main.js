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