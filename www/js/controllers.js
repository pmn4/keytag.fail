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

				// initialize
				$rootScope.settings = {
					showHistory: true,
					sortOrder: "byName"
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
					TagsService.list($scope.settings.sortOrder)
						.then(function (tags) {
							$scope.tags = tags;
						}, function (message) {
							$scope.showError(message);
							$scope.trackEvent("TagList Error: " + message);
						});
				}
				// if we refresh on each page load, I think these are unnecessary
				// $rootScope.$on(Events.CreateTag, refresh);
				// $rootScope.$on(Events.DeleteTag, refresh);
				// $rootScope.$on(Events.UpdateTag, refresh);
				$scope.$watch("settings.sortOrder", refresh);

				refresh();

				$scope.$on("$ionicView.enter", function () {
					$scope.trackView("TagList");
				});
				$scope.$on("$ionicView.enter", refresh);
			}
		])

		.controller("TagNavigationController", [
			"$scope",
			"$state",
			"TagsService",
			function ($scope, $state, TagsService) {
				function goToTag(anchorTag, offset) {
					TagsService.list($scope.settings.sortOrder)
						.then(function (tags) {
							var tagIndex = _.chain(tags)
								.pluck("id")
								.indexOf(anchorTag.id)
								.value();

							if (tagIndex === -1) { return; }

							$scope.go("app.tag-detail", {
								tagId: tags[tagIndex + offset % tags.length]
							});
						}, function (message) {
							$scope.trackEvent("TagNavigation Error: " + message);
						});
				}
			}
		])

		.controller("TagDetailController", [
			"$rootScope",
			"$scope",
			"$state",
			"$timeout",
			"$stateParams",
			"$ionicModal",
			"AppConfig",
			"TagsService",
			function ($rootScope, $scope, $state, $timeout, $stateParams, $ionicModal, AppConfig, TagsService) {
				$scope.hasUsed = false;

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
				// $rootScope.$on(Events.ScanSuccess, function (_event, tagId) {
				// 	if ($scope.tag.id !== tagId) { return; }

				// 	$scope.scanSuccess();
				// });

				$scope.scanFailure = function () {
					$scope.trackEvent("Tag", "Use", $scope.tag.issuer, 0);

					$scope.tag.failure();
					$scope.save();

					$scope.success = false;
					$timeout(function () {
						$scope.hideTag();
						$scope.success = undefined;
					}, 2500);
				};
				// $rootScope.$on(Events.ScanFailure, function (_event, tagId) {
				// 	if ($scope.tag.id !== tagId) { return; }

				// 	$scope.scanFailure();
				// });

				$scope.save = function (notify) {
					if (notify) {
						$scope.showMessage("Tag Saved");
					}

					TagsService.save($scope.tag)
						.then(function (tag) {
							$rootScope.$broadcast(Events.UpdateTag, tag);
						});
				};

				$scope.delete = function () {
					// @todo: prompt
					TagsService.destroy($scope.tag.id)
						.then(function (tag) {
							$rootScope.$broadcast(Events.DeleteTag, tag);
							$state.go("app.tag-list")
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

				TagsService.fetch($stateParams.tagId)
					.then(function (tag) {
						$scope.tag = tag;
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
							$state.go("app.tag-detail", { tagId: $scope.tag.id }, { location: "replace" });
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

				$rootScope.$on(Events.CreateTag, function () {
					$scope.tag = {};
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
