;(function (TagsApp, angular, undefined) {
	"use strict";

	var Events = {
		UpdatedSettings: "settings:updated",
		CreateTag: "tag:new",
		UpdateTag: "tag:save",
		DeleteTag: "tag:delete",
		ScanSuccess: "tag:scan:success", // trigger with tagId
		ScanFailure: "tag:scan:failure" // trigger with tagId
	};

	angular.module(TagsApp.name + ".controllers", [])
		.controller("AppController", [
			"$scope",
			"$cordovaGoogleAnalytics",
			"$cordovaToast",
			"AppConfig",
			"SettingsService",
			function ($scope, $cordovaGoogleAnalytics, $cordovaToast, AppConfig, SettingsService) {
				if (window.analytics) {
					$cordovaGoogleAnalytics.startTrackerWithId(AppConfig.gaTrackingId);
				}

				$scope.showMessage = function (message) {
					if (!window.plugins || !window.plugins.toast) {
						// testing in browser?
						console.log(arguments);
						return;
					}

					$cordovaToast.showShortBottom(message);
				};

				$scope.showError = function (message) {
					if (!window.plugins || !window.plugins.toast) {
						// testing in browser?
						console.log(arguments);
						return;
					}

					$cordovaToast.showLongBottom(message);
				};

				$scope.trackEvent = function (category, action, label, value) {
					if (!window.analytics) {
						// testing in browser?
						console.log(arguments);
						return;
					}


					$cordovaGoogleAnalytics.trackEvent(category, action, label, value);
				};

				$scope.trackView = function (view, tag) {
					var trackView = view;

					if (!window.analytics) {
						// testing in browser?
						console.log(arguments);
						return;
					}

					if (tag) {
						view = [
							view,
							tag && tag.issuer || ""
						].join(":");
					}

					$cordovaGoogleAnalytics.trackView(trackView);
				};

				function fetchSettings() {
					SettingsService.list()
						.then(function (settings) {
							$scope.settings = settings;
						});
				}
				$scope.$on(Events.UpdatedSettings, fetchSettings);
				fetchSettings();

				// iterate over all settings?
				// use localService.bind?
				$scope.$watch("settings.showHistory", function (val) {
					SettingsService.setShowHistory(val)
						.then(function () {
							$scope.$emit(Events.UpdatedSettings);
						});
				});
			}
		])

		.controller("TagListController", [
			"$scope",
			"TagsService",
			function ($scope, TagsService) {
				$scope.tags = [];

				function refresh() {
					TagsService.list()
						.then(function (tags) {
							$scope.tags = tags;
						}, function (message) {
							$scope.showError(message);
							$scope.trackEvent("TagList Error: " + message);
						});
				}
				$scope.$on(Events.CreateTag, refresh);
				$scope.$on(Events.DeleteTag, refresh);
				$scope.$on(Events.UpdateTag, refresh);

				refresh();

				$scope.$on("$ionicView.enter", function () {
					$scope.trackView("TagList");
				});
			}
		])

		.controller("TagsController", [
			"$scope",
			"$timeout",
			"$stateParams",
			"$ionicModal",
			"$ionicSlideBoxDelegate",
			"SettingsService",
			"TagsService",
			function ($scope, $timeout, $stateParams, $ionicModal, $ionicSlideBoxDelegate, SettingsService, TagsService) {
				var tagToDisplay = $stateParams.tagId;
				$scope.tags = [];

				function currentTag(index) {
					if (!$scope.tags || $scope.tags.length < index) {
						// log this error
						return;
					}

					return $scope.tags[index];
				}

				function refresh() {
					TagsService.list()
						.then(function (tags) {
							$scope.tags = tags;
						}, function (message) {
							$scope.showError(message);
							$scope.trackEvent("TagList Error: " + message);
						});
				}
				$scope.$on(Events.CreateTag, refresh);
				$scope.$on(Events.DeleteTag, refresh);
				$scope.$on(Events.UpdateTag, refresh);

				$scope.deleteCurrentTag = function () {
					TagsService.destroy($scope.currentTag.id)
						.then(function () {
							$scope.$broadcast(Events.DeleteTag, tag);
						});
				};
				$scope.currentTagFailure = function () {
					$scope.$broadcast(Events.ScanFailure, $scope.currentTag.id);
				};
				$scope.currentTagSuccess = function () {
					$scope.$broadcast(Events.ScanSuccess, $scope.currentTag.id);
				};
				$scope.setDisplayedTagIndex = function (index) {
					$scope.currentTag = currentTag(index);

					$scope.trackView("TagDetail", $scope.currentTag);
				};

				$scope.save = function (tag) {
					TagsService.save(tag)
						.then(function (tag) {
							$scope.$emit(Events.UpdateTag, tag);
						});
				};

				$scope.$watch("tags", function () {
					var index = 0; // use $stateParams.tagId to derive index

					$scope.currentTag = currentTag(index);

					// get index of active tag
					$ionicSlideBoxDelegate.slide(index);

					$timeout(function () {
						var index = 0;
						$ionicSlideBoxDelegate.update();

						for (index; index < $scope.tags.length; index++) {
							if (String($scope.tags[index].id) === tagToDisplay) {
								tagToDisplay = undefined; // just do it once
								break;
							}
						}

						$ionicSlideBoxDelegate.slide(index % $scope.tags.length);
					});
				});

				refresh();

				$scope.$on("$ionicView.enter", function () {
					$scope.trackView("Tags");
				});
			}
		])

		.controller("TagDetailController", [
			"$scope",
			"$timeout",
			"$stateParams",
			"$ionicModal",
			"AppConfig",
			"TagsService",
			function ($scope, $timeout, $stateParams, $ionicModal, AppConfig, TagsService) {
				$scope.hasUsed = false;
				$scope.init = function (tag) {
					$scope.tag = tag;
				};

				$scope.displayTag = function (tagId) {
					$scope.tagModal.show();
				};

				$scope.hideTag = function (tagId) {
					$scope.tagModal.hide();
				};

				$scope.scanSuccess = function () {
					$scope.trackEvent("Tag", "Use", $scope.tag.issuer, 1);

					$scope.tag.success();
					$scope.save();

					$scope.success = true;
					$timeout(function () {
						$scope.hideTag();
						$scope.success = undefined;
					}, 2500);
				};
				$scope.$on(Events.ScanSuccess, function (_event, tagId) {
					if ($scope.tag.id !== tagId) { return; }

					$scope.scanSuccess();
				});

				$scope.scanFailure = function (tagId) {
					$scope.trackEvent("Tag", "Use", $scope.tag.issuer, 0);

					$scope.tag.failure();
					$scope.save();

					$scope.success = false;
					$timeout(function () {
						$scope.hideTag();
						$scope.success = undefined;
					}, 2500);
				};
				$scope.$on(Events.ScanFailure, function (_event, tagId) {
					if ($scope.tag.id !== tagId) { return; }

					$scope.scanFailure();
				});

				$scope.save = function () {
					$scope.showMessage("Tag Saved");
					TagsService.save($scope.tag)
						.then(function (tag) {
							$scope.$emit(Events.UpdateTag, tag);
						});
				};

				$ionicModal.fromTemplateUrl(AppConfig.templatesPath + "modals/tag.html", function (modal) {
					$scope.tagModal = modal;
					$scope.hasUsed = true;
				}, {
					scope: $scope,
					animation: "slide-in-up",
					focusFirstInput: true
				});
			}
		])

		.controller("TagCreateController", [
			"$scope",
			"$state",
			"$ionicModal",
			"TagsService",
			function ($scope, $state, $ionicModal, TagsService) {
				$scope.tag = {};

				$scope.manualSuccess = function (barcode) {
					barcode.entryMethod = "manual";
					$scope.tag.barcode = barcode;
					$scope.createTag();

					$scope.showMessage("Tag Saved");
					$scope.trackEvent("Tag", "Scan", barcode.entryMethod, 1);
				};
				$scope.scanSuccess = function (barcode) {
					barcode.entryMethod = "scanner";
					$scope.tag.barcode = barcode;
					$scope.createTag();

					$scope.showMessage("Tag Saved");
					$scope.trackEvent("Tag", "Scan", barcode.entryMethod, 1);
				};
				$scope.scanError = function (error) {
					$scope.showError(error);

					$scope.trackEvent("Tag", "Scan", "scanner", 0);
				};
				$scope.cancelCreation = function () {
					$scope.trackEvent("Tag", "Scan", "cancel", 1);
				};

				$scope.createTag = function () {
					TagsService.save($scope.tag)
						.then(function (tag) {
							$scope.$emit(Events.CreateTag, tag);
							$state.go("app.tag", { tagId: tag.id });
						}, function (message) {
							$scope.showError(message);
							$scope.trackEvent("TagDetail Error: " + message);
						});
				};

				$scope.$on("$ionicView.enter", function () {
					$scope.trackView("NewTag");
				});
			}
		])

		.controller("SettingsListController", [
			"$scope",
			"SettingsService",
			function ($scope, SettingsService) {
				$scope.settings = [];

				SettingsService.list()
					.then(function (settings) {
						$scope.settings = settings;
					});

				$scope.$on("$ionicView.enter", function () {
					$scope.trackView("settings");
				});
			}
		])

		.controller("FaqController", [
			"$scope",
			"$stateParams",
			function ($scope, $stateParams) {
				$scope.$on("$ionicView.enter", function () {
					$scope.trackView("faq");
				});
			}
		])

		.controller("WelcomeController", [
			"$scope",
			"$state",
			"TagsService",
			function ($scope, $state, TagsService) {
				function welcome() {
					// highlight the menu button
					// peek the menu
				}

				TagsService.list()
					.then(function (tags) {
						if (tags && tags.length) {
							$state.go("app.tag-list", {}, { location: "replace" });
						} else {
							welcome();
						}
					});

				$scope.$on("$ionicView.enter", function () {
					$scope.trackView("welcome");
				});
			}
		])
	;
})(window.TagsApp, window.angular);
