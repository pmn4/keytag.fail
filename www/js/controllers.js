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
			"$rootScope",
			"$scope",
			"$cordovaGoogleAnalytics",
			"$cordovaToast",
			"AppConfig",
			"SettingsService",
			function ($rootScope, $scope, $cordovaGoogleAnalytics, $cordovaToast, AppConfig, SettingsService) {
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
							$rootScope.settings = settings;
						});
				}
				$rootScope.$on(Events.UpdatedSettings, fetchSettings);
				fetchSettings();

				// iterate over all settings?
				// use localService.bind?
				$scope.$watch("settings.showHistory", function (val) {
					SettingsService.setShowHistory(val)
						.then(function () {
							$rootScope.$broadcast(Events.UpdatedSettings);
						});
				});
				$scope.$watch("settings.sortOrder", function (val) {
					SettingsService.setSortOrder(val)
						.then(function () {
							$rootScope.$broadcast(Events.UpdatedSettings);
						});
				});
			}
		])

		.controller("TagListController", [
			"$rootScope",
			"$scope",
			"TagsService",
			"OrderByOptions",
			function ($rootScope, $scope, TagsService, OrderByOptions) {
				$scope.tags = [];
				$scope.orderByOptions = OrderByOptions;

				function refresh() {
					TagsService.list()
						.then(function (tags) {
							$scope.tags = tags;
						}, function (message) {
							$scope.showError(message);
							$scope.trackEvent("TagList Error: " + message);
						});
				}
				$rootScope.$on(Events.CreateTag, refresh);
				$rootScope.$on(Events.DeleteTag, refresh);
				$rootScope.$on(Events.UpdateTag, refresh);

				refresh();

				$scope.$on("$ionicView.enter", function () {
					$scope.trackView("TagList");
				});
				$scope.$on("$ionicView.enter", refresh);
			}
		])

		.controller("TagsController", [
			"$rootScope",
			"$scope",
			"$filter",
			"$timeout",
			"$stateParams",
			"$ionicModal",
			"$ionicSlideBoxDelegate",
			"TagsService",
			function ($rootScope, $scope, $filter, $timeout, $stateParams, $ionicModal, $ionicSlideBoxDelegate, TagsService) {
				var tagToDisplay = $stateParams.tagId;
				$scope.tags = [];

				function currentTag(index) {
					if (!$scope.tags || $scope.tags.length < index) {
						// log this error
						return;
					}

					return $scope.tags[index];
				}

				function setTags(tags) {
					if (!tags) { tags = $scope.tags; }

					$scope.tags = $filter("tagSort")(tags, $scope.settings.sortOrder);
				}
				$rootScope.$watch("settings.sortOrder", function () {
					setTags();
				});

				function refresh() {
					TagsService.list()
						.then(function (tags) {
							setTags(tags);
						}, function (message) {
							$scope.showError(message);
							$scope.trackEvent("TagList Error: " + message);
						});
				}
				$rootScope.$on(Events.CreateTag, refresh);
				$rootScope.$on(Events.DeleteTag, refresh);
				$rootScope.$on(Events.UpdateTag, refresh);

				$scope.deleteCurrentTag = function () {
					TagsService.destroy($scope.currentTag.id)
						.then(function (tag) {
							$rootScope.$broadcast(Events.DeleteTag, tag);
						});
				};
				$scope.currentTagFailure = function () {
					$rootScope.$broadcast(Events.ScanFailure, $scope.currentTag.id);
				};
				$scope.currentTagSuccess = function () {
					$rootScope.$broadcast(Events.ScanSuccess, $scope.currentTag.id);
				};
				$scope.setDisplayedTagIndex = function (index) {
					$scope.currentTag = currentTag(index);

					$scope.trackView("TagDetail", $scope.currentTag);
				};

				$scope.save = function (tag) {
					TagsService.save(tag)
						.then(function (tag) {
							$rootScope.$broadcast(Events.UpdateTag, tag);
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
			"$rootScope",
			"$scope",
			"$timeout",
			"$stateParams",
			"$ionicModal",
			"AppConfig",
			"TagsService",
			function ($rootScope, $scope, $timeout, $stateParams, $ionicModal, AppConfig, TagsService) {
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
				$rootScope.$on(Events.ScanSuccess, function (_event, tagId) {
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
				$rootScope.$on(Events.ScanFailure, function (_event, tagId) {
					if ($scope.tag.id !== tagId) { return; }

					$scope.scanFailure();
				});

				$scope.save = function () {
					$scope.showMessage("Tag Saved");
					TagsService.save($scope.tag)
						.then(function (tag) {
							$rootScope.$broadcast(Events.UpdateTag, tag);
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
			"$rootScope",
			"$scope",
			"$state",
			"$ionicModal",
			"$ionicPopup",
			"TagsService",
			function ($rootScope, $scope, $state, $ionicModal, $ionicPopup, TagsService) {
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
							$rootScope.$broadcast(Events.CreateTag, tag);
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
			"$rootScope",
			"$scope",
			"SettingsService",
			"OrderByOptions",
			function ($rootScope, $scope, SettingsService, OrderByOptions) {
				$scope.orderByOptions = OrderByOptions;

				function refresh() {
					SettingsService.list()
						.then(function (settings) {
							$rootScope.settings = settings;
						});
				}
				refresh();

				$rootScope.$on(Events.UpdatedSettings, refresh);

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
