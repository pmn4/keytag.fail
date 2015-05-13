;(function (TagsApp, angular, undefined) {
	"use strict";

	angular.module(TagsApp.name + ".directives", [])
		.directive("keyTag", [
			"AppConfig",
			function (AppConfig) {
				return {
					restrict: "E",
					scope: {
						tag: "=",
						onChange: "&"
					},
					templateUrl: AppConfig.templatesPath + "key-tag.html",
					link: function ($scope, element) {
						element.find("input").on("change", $scope.onChange)
					}
				};
			}
		])
		.directive("keyTagHistory", [
			"AppConfig",
			function (AppConfig) {
				return {
					restrict: "E",
					scope: {
						tag: "=",
						showHistory: "="
					},
					templateUrl: AppConfig.templatesPath + "key-tag-history.html"
				};
			}
		])
		.directive("barcode", [
			"BWIPJS",
			"BarCodeFormatMap",
			function (BWIPJS, BarCodeFormatMap) {
				return {
					restrict: "E",
					scope: {
						tag: "=",
						onError: "&",
						onSuccess: "&"
					},
					transclude: true,
					template: '<canvas width="1" height="1" class="barcode" style="visibility:hidden;"></canvas>',
					link: function ($scope, element, attrs) {
						$scope.canvas = element.children().eq(0)[0]; // @todo: null check

						$scope.$watch(attrs.tag, function (tag) {
							var bw;

							if (!tag || !tag.barcode || !(tag.barcode.format in BarCodeFormatMap)) {
								return $scope.onError("Missing or unsupported barcode format");
							}

							bw = new BWIPJS();

							bw.bitmap(new Bitmap());

							bw.push(tag.barcode.text);
							bw.push({});

							bw.call(BarCodeFormatMap[tag.barcode.format], function (e) {
								if (e) {
									$scope.onError(e);
								} else {
									bw.bitmap().show($scope.canvas, "N");
									$scope.onSuccess();
								}
							});
						});
					}
				};
			}
		])
		.directive("keyTagScanner", [
			"$window",
			"$ionicPlatform",
			"$cordovaBarcodeScanner",
			"AppConfig",
			"BarCodeFormatMap",
			function ($window, $ionicPlatform, $cordovaBarcodeScanner, AppConfig, BarCodeFormatMap) {
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
						$scope.BarCodeFormats = Object.keys(BarCodeFormatMap);

						$scope.openScanner = function () {
							if (!$window.cordova) {
								$scope.fruitlessScanAttempt = true;
								return;
							}
							$cordovaBarcodeScanner.scan()
								.then(function (scanResponse) {
									$scope.fruitlessScanAttempt = !scanResponse || !scanResponse.text;
									if ($scope.fruitlessScanAttempt) {
										$scope.onCancel();
									} else {
										$scope.onScanSuccess({ scanResponse: scanResponse });
									}
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
