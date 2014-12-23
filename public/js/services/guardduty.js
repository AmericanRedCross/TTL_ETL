angular.module('gdService', [])

	// super simple service
	// each function returns a promise object 
	.factory('GDs', ['$http',function($http) {
		return {
			get : function() {
				return $http.get('/sites/all');
			}
		}
	}]);