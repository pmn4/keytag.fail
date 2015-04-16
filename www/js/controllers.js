;(function (TagsApp, angular, AdMob, undefined) {
	"use strict";

	var Events = {
		CreateTag: "tag:new"
	};

	angular.module(TagsApp.name + ".controllers", [])
		.controller("AppController", [
			"$scope",
			"$cordovaAdMob",
			function ($scope, $cordovaAdMob) {
				$scope.setError = function (message) {
					// @todo: toast
				};

				$scope.trackEvent = function (event) {
					// @todo: ga
				};

				if (!AdMob) { return; }

				$cordovaAdMob.createBannerView({
					adId: TagsApp.AdMobIds.footerBanner,
					position: AdMob.AD_POSITION.BOTTOM_CENTER,
					bgColor: "black",
					autoShow: true,
					isTesting: true
				}).fail(function (e) {
					console.log(e);
				});
			}
		])

		.controller("TagListController", [
			"$scope",
			"$stateParams",
			"$ionicModal",
			"$ionicSlideBoxDelegate",
			"TagsService",
			function ($scope, $stateParams, $ionicModal, $ionicSlideBoxDelegate, TagsService) {
				$scope.tags = [];

				function currentTag(index) {
					if (!$scope.tags || $scope.tags.length < index) {
						// log this error
						return;
					}

					return $scope.tags[index];
				}

				function setTitle(index) {
					var tag = $scope.currentTag || {};

					// $scope.title = tag.name || "My Tags";
					$scope.title = "My Tags";
				}

				function refresh() {
					TagsService.list()
						.then(function (tags) {
							$scope.tags = tags;
						}, function (message) {
							$scope.setError(message);
							$scope.trackEvent("TagList Error: " + message);
						});
				}
				$scope.$on(Events.CreateTag, refresh);

				$scope.deleteTag = function (tag) {

				};
				$scope.setDisplayedTagIndex = function (index) {
					$scope.currentTag = currentTag(index);

					setTitle();
				};

				$scope.$watch("tags", function () {
					var index = 0; // use $stateParams.tagId to derive index

					$scope.currentTag = currentTag(index);

					setTitle();

					// get index of active tag
					$ionicSlideBoxDelegate.slide(index);

					$ionicSlideBoxDelegate.update();
				});

				refresh();
			}
		])

		.controller("TagDetailController", [
			"$scope",
			"$stateParams",
			"$ionicModal",
			"TagsService",
			function ($scope, $stateParams, $ionicModal, TagsService) {
				$scope.init = function (tag) {
					$scope.tag = tag;
				};

				$scope.displayTag = function (tagId) {

				};
			}
		])

		.controller("NewTagController", [
			"$scope",
			"$ionicModal",
			"TagsService",
			function ($scope, $ionicModal, TagsService) {
				// // @todo: use instances of Tag where applicable
				// function Tag(attributes) {
				// 	this.id = attributes.id;
				// 	this.name = attributes.name;
				// 	this.issuer = attributes.issuer;
				// 	this.description = attributes.description;
				// 	this.barcode = attributes.barcode;
				// }

				$scope.tag = {};

				$scope.manualSuccess = function (barcode) {
					// @todo: prompt for name, issuer, description
					barcode.entryMethod = "manual";
					$scope.tag.barcode = barcode;
					$scope.createTag();
				};
				$scope.scanSuccess = function (barcode) {
					// @todo: prompt for name, issuer, description
					barcode.entryMethod = "scanner";
					$scope.tag.barcode = barcode;
					$scope.createTag();
				};
				$scope.scanError = function (error) {
					$scope.setError(error);
				};
				$scope.cancelCreation = function () {
					$scope.trackEvent("Cancel Tag Scan");
				};

				$scope.$watch("tag", function (tag) {
					$scope.saveable = tag && tag.barcode;
				});

				$scope.createTag = function () {
					TagsService.save($scope.tag).then(function (tag) {
						$scope.$emit(Events.CreateTag, tag);
					}, function (message) {
						$scope.setError(message);
						$scope.trackEvent("TagDetail Error: " + message);
					});
				};
			}
		])
	;
})(window.TagsApp, window.angular, window.AdMob);
