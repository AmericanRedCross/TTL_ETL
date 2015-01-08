angular.module('ttlService', [])

	// each function returns a promise object 
	.factory('Surveys', ['$http',function($http) {
		return {
			get : function() {
				return $http.get('/surveys');
			}
		}

	}]);