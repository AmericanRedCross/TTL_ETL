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