angular.module('statsService', [])

	// each function returns a promise object 
	.factory('Stats', ['$http',function($http) {
		return {
			get : function() {
				return $http.get('/stats');
			}
		}

	}]);