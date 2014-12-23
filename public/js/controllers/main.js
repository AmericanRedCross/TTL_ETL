angular.module('gdController', [])

	// inject the  service factory into our controller
	.controller('mainController', ['$scope','$http','GDs', function($scope, $http, GDs) {
		$scope.formData = {};
		$scope.loading = true;

		// GET =====================================================================
		// when landing on the page, get all sites and show them
		// use the service to get all the sites
		GDs.get()
			.success(function(data) {
				$scope.sites = data;
				$scope.loading = false;
			});

	}]);