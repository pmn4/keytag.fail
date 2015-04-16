;(function (TagsApp, angular, undefined) {
	"use strict";

	angular.module(TagsApp.name + ".directives", [])
		.directive("keyTag", [
			"$cordovaBarcodeScanner",
			"AppConfig",
			function ($cordovaBarcodeScanner, AppConfig) {
				return {
					restrict: "E",
					scope: {
						tag: "="
					},
					templateUrl: AppConfig.templatesPath + "key-tag.html",
					controller: function ($scope) {
						$scope.encode = function (tag) {
							$scope.encoded = tag.barcode ? tag.barcode.text : "malformed";
							$scope.done = "not yet.";
							$cordovaBarcodeScanner.encode(tag.barcode.format, tag.barcode.text)
								.then(function (result) {
									$scope.encoded = result;
								}).finally(function () {
									$scope.done = "done";
								});
						};
					}
				};
			}
		])
		.directive("keyTagScanner", [
			"$window",
			"$ionicPlatform",
			"$cordovaBarcodeScanner",
			"AppConfig",
			function ($window, $ionicPlatform, $cordovaBarcodeScanner, AppConfig) {
				return {
					restrict: "E",
					scope: {
						onSuccess: "&",
						onScanSuccess: "&",
						onScanError: "&",
						onCancel: "&"
					},
					controller: function ($scope) {
						$scope.barcode = {};
						$scope.buttonLabel = $scope.buttonLabel || "Scan Key Tag";
						$scope.fruitlessScanAttempt = false;

						$scope.openScanner = function () {
							$cordovaBarcodeScanner.scan().then(function (scanResponse) {
								$scope.fruitlessScanAttempt = false;
								$scope.onScanSuccess({ scanResponse: scanResponse });
							}, function (error) {
								$scope.fruitlessScanAttempt = true;
								$scope.onScanError({ error: error });
							});
						};

						$scope.$deregisterBackButton = $ionicPlatform.registerBackButtonAction(function () {
							$scope.fruitlessScanAttempt = true;
							$scope.onCancel();
						});

						$scope.$on("$destroy", function () {
							if (!$scope.$deregisterBackButton) { return; }

							$scope.$deregisterBackButton();
						});
						// @todo: setTimeout to cancel scan?
					},
					templateUrl: AppConfig.templatesPath + "scanner.html"
				};
			}
		])
	;
})(window.TagsApp, window.angular);
