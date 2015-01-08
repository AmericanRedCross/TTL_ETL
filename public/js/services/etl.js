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