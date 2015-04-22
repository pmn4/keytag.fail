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
				$scope.$on("$ionicView.enter", refresh);
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
						.then(function (tag) {
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

				function goToTag(tagId) {
					var index = 0;
					for (index; index < $scope.tags.length; index++) {
						if (String($scope.tags[index].id) === tagId) {
							break;
						}
					}

					$scope.currentTag = currentTag(index);
					$ionicSlideBoxDelegate.slide(index % $scope.tags.length);
				}

				$scope.$watch("tags", function () {
					$ionicSlideBoxDelegate.update();
					$timeout(function () {
						$ionicSlideBoxDelegate.update();
						if (tagToDisplay) {
							goToTag(tagToDisplay);
						}
						tagToDisplay = undefined; // just do it once
					}, 250); // I hate this so much, and I'm not even sure it works
				});

				refresh();

				$scope.$on("$ionicView.enter", function () {
					$scope.trackView("Tags");

					goToTag($stateParams.tagId);
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
			"$ionicPopup",
			"TagsService",
			function ($scope, $state, $ionicModal, $ionicPopup, TagsService) {
				$scope.tag = {};

				$scope.manualSuccess = function (barcode) {
					barcode.entryMethod = "manual";
					$scope.tag.barcode = barcode;
					completeCreate();

					$scope.showMessage("Tag Saved");
					$scope.trackEvent("Tag", "Scan", barcode.entryMethod, 1);
				};
				$scope.scanSuccess = function (barcode) {
					barcode.entryMethod = "scanner";
					$scope.tag.barcode = barcode;
					completeCreate();

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

				function completeCreate() {
					$ionicPopup.show({
						template: '<input type="text" ng-model="tag.issuer" placeholder="ex. Starbucks, A&amp;P">',
						title: "Enter Issuer",
						scope: $scope,
						buttons: [
							{
								text: "Cancel",
								onTap: cancelCreateTag
							}, {
								text: "Save",
								type: "button-positive",
								onTap: createTag
							}
						]
					}).then(function () {
						console.log("success", arguments);
					}, function () {
						console.log("failure", arguments);
					});
				}

				function createTag() {
					TagsService.save($scope.tag)
						.then(function (tag) {
							$scope.$emit(Events.CreateTag, tag);
							$state.go("app.tags", { tagId: $scope.tag.id }, { location: "replace" });
						}, function (message) {
							$scope.showError(message);
							$scope.trackEvent("TagCreate Error: " + message);
						});
				};

				function cancelCreateTag() {
					$scope.trackEvent("TagCreate Cancel");
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
				$scope.q = $stateParams.q;

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
