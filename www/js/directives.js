;(function (TagsApp, angular, undefined) {
	"use strict";

	var FORMAT_MAP = {
		AZTEC: "azteccode",
		CODABAR: "",
		CODE_39: "code39",
		CODE_93: "code93",
		CODE_128: "code128",
		DATA_MATRIX: "datamatrix",
		EAN_8: "ean8",
		EAN_13: "ean13",
		ITF: "itf14",
		MAXICODE: "msi", // maybe?
		PDF_417: "pdf417",
		QR_CODE: "qrcode",
		RSS_14: "",
		RSS_EXPANDED: "",
		UPC_A: "upca",
		UPC_E: "upce",
		UPC_EAN_EXTENSION: ""
	};

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
						showHistory: "=",
						onToggleHistory: "&"
					},
					templateUrl: AppConfig.templatesPath + "key-tag-history.html"
				};
			}
		])
		.directive("barcode", [
			"BWIPJS",
			function (BWIPJS) {
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

							if (!tag || !tag.barcode || !(tag.barcode.format in FORMAT_MAP)) {
								return $scope.onError("Missing or unsupported barcode format");
							}

							bw = new BWIPJS();

							bw.bitmap(new Bitmap());

							bw.push(tag.barcode.text);
							bw.push({});

							bw.call(FORMAT_MAP[tag.barcode.format], function (e) {
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
							if (!$window.cordova) {
								$scope.fruitlessScanAttempt = true;
								return;
							}
							$cordovaBarcodeScanner.scan()
								.then(function (scanResponse) {
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
