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
						trackView = [
							view,
							tag && tag.issuer || ""
						].join(":");
					}

					$cordovaGoogleAnalytics.trackView(trackView);
				};

				// initialize
				$rootScope.settings = {};
				function fetchSettings() {
					SettingsService.list()
						.then(function (settings) {
							// can we hide the action from $watchers?
							$rootScope.settings = settings;
						}, function (message) {
							$scope.trackEvent("Settings", "List", message, 1);
						});
				}
				$rootScope.$on(Events.UpdatedSettings, fetchSettings);
				fetchSettings();

				// iterate over all settings?
				// use localService.bind?
				$scope.$watch("settings.showHistory", function (val, previousVal) {
					if (previousVal === undefined || val === previousVal) { return; }

					SettingsService.setShowHistory(val)
						.then(function () {
							$rootScope.$broadcast(Events.UpdatedSettings);
							$scope.trackEvent("Settings", "ShowHistory", val, 1);
						}, function (message) {
							$scope.trackEvent("Settings", "ShowHistory", message, 1);
						});
				});
				$scope.$watch("settings.sortOrder", function (val, previousVal) {
					if (previousVal === undefined || val === previousVal) { return; }

					SettingsService.setSortOrder(val)
						.then(function () {
							$rootScope.$broadcast(Events.UpdatedSettings);
							$scope.trackEvent("Settings", "SortOrder", val, 1);
						}, function (message) {
							$scope.trackEvent("Settings", "SortOrder", message, 1);
						});
				});
			}
		])

		.controller("AppUpdateController", [
			"$scope",
			"$ionicDeploy",
			"$q",
			"$timeout",
			function ($scope, $ionicDeploy, $q, $timeout) {
				$scope.downloadProgress = 0;
				$scope.extractionProgress = 0;

				// var download = $q.defer(), extract = $q.defer();

				// function fakeIt(deferred) {
				// 	deferred.progress = deferred.progress || 0;

				// 	if (deferred.progress > 1) {
				// 		return deferred.resolve(1.0);
				// 	}

				// 	deferred.progress = deferred.progress + 0.1;
				// 	deferred.notify(deferred.progress);

				// 	$timeout(function () {
				// 		fakeIt(deferred);
				// 	}, 300);
				// }

				// Download the updates
				$ionicDeploy.download()
					.then(function () {
						// Extract the updates
						$ionicDeploy.extract()
							.then(function () {
								// Load the updated version
								$ionicDeploy.load();
								$scope.trackEvent("AppUpdate", "Extract", "success", 1);
							}, function (message) {
								$scope.showError(message);
								$scope.trackEvent("AppUpdate", "Extract", message, 1);
							}, function (progress) {
								$scope.extractionProgress = progress;
							});

						$scope.trackEvent("AppUpdate", "Download", "success", 1);
						// fakeIt(extract);
					}, function (message) {
						$scope.showError(message);
						$scope.trackEvent("AppUpdate", "Download", message, 1);
					}, function (progress) {
						$scope.downloadProgress = progress;
					});

				// fakeIt(download);

				$scope.$on("$ionicView.enter", function () {
					$scope.trackView("AppUpdate");
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
							$scope.trackEvent("TagList", "List", message, 1);
						});
				}
				// if we refresh on each page load, I think these are unnecessary
				// $rootScope.$on(Events.CreateTag, refresh);
				// $rootScope.$on(Events.DeleteTag, refresh);
				// $rootScope.$on(Events.UpdateTag, refresh);
				$rootScope.$on(Events.UpdatedSettings, refresh);
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
							$scope.trackEvent("TagNavigation", "List", message, 1);
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
			"$ionicPopup",
			"AppConfig",
			"TagsService",
			function ($rootScope, $scope, $state, $timeout, $stateParams, $ionicModal, $ionicPopup, AppConfig, TagsService) {
				$scope.hasUsed = false;

				if (!$stateParams.tagId) {
					$state.go("app.tag-list", {}, { location: "replace" });
				}

				$scope.displayTag = function (tagId) {
					$scope.tagModal.show();
				};

				$scope.hideTag = function (tagId) {
					$scope.tagModal.hide();
				};

				$scope.scanSuccess = function () {
					$scope.trackEvent("TagDetail", "ScanSuccess", $scope.tag.issuer, 1);

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
					$scope.trackEvent("TagDetail", "ScanFailure", $scope.tag.issuer, 1);

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

							if (notify) {
								// save happens a lot, so if it warrants notifying the user, log it
								$scope.trackEvent("TagDetail", "Save", tag.issuer, 1);
							}
						}, function (message) {
							$scope.trackEvent("TagDetail", "Save", message, 1);
						});
				};

				$scope.delete = function () {
					$ionicPopup.confirm({
						title: "Delete Tag",
						template: "Are you sure? This tag cannot be recovered once deleted."
					}).then(function (res) {
						if (res) {
							var issuer = $scope.tag.issuer;
							TagsService.destroy($scope.tag.id)
								.then(function (tag) {
									$scope.trackEvent("TagDetail", "Destroy", issuer, 1);
									$rootScope.$broadcast(Events.DeleteTag, tag);
									$state.go("app.tag-list")
								}, function (message) {
									$scope.trackEvent("TagDetail", "Destroy", message, 1);
								});
						} else {
							$scope.trackEvent("TagDetail", "Cancel Destroy", issuer, 1);
						}
					}, function (message) {
						$scope.trackEvent("TagDetail", "IonicPopup#confirm", message, 1);
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
					}, function (message) {
						$scope.trackEvent("TagDetail", "Fetch", message, 1);
					});

				$scope.$on("$ionicView.enter", function () {
					var unwatch = $scope.$watch("tag", function (tag) {
						$scope.trackView("TagDetail", tag);

						unwatch();
					});
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
					$scope.trackEvent("TagCreate", "Scan", barcode.entryMethod, 1);
				};
				$scope.scanSuccess = function (barcode) {
					barcode.entryMethod = "scanner";
					$scope.tag.barcode = barcode;
					completeCreate();

					$scope.showMessage("Tag Saved");
					$scope.trackEvent("TagCreate", "Scan", barcode.entryMethod, 1);
				};
				$scope.scanError = function (error) {
					$scope.showError(error);

					$scope.trackEvent("TagCreate", "Scan", "scanner", 1);
				};
				$scope.cancelCreation = function () {
					$scope.trackEvent("TagCreate", "Scan", "cancel", 1);
				};

				function completeCreate() {
					$ionicPopup.show({
						template: '<input type="text" ng-model="tag.issuer" placeholder="ex. Starbucks, A&amp;P" autofocus="autofocus">',
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
					});
				}

				function createTag() {
					TagsService.save($scope.tag)
						.then(function (tag) {
							$rootScope.$broadcast(Events.CreateTag, tag);
							$state.go("app.tag-detail", { tagId: tag.id }, { location: "replace" });
						}, function (message) {
							$scope.showError(message);
							$scope.trackEvent("TagCreate", "Save", message, 1);
						});
				};

				function cancelCreateTag() {
					$scope.trackEvent("TagCreate", "Cancel", $scope.tag.issuer, 1);
				};

				$scope.$on("$ionicView.enter", function () {
					$scope.trackView("TagCreate");
				});

				$rootScope.$on(Events.CreateTag, function () {
					$scope.tag = {};
					$scope.showMessage("Tag Created");
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
						}, function (message) {
							$scope.trackEvent("SettingsList", "List", message, 1);
						});
				}
				refresh();

				$rootScope.$on(Events.UpdatedSettings, refresh);

				$scope.$on("$ionicView.enter", function () {
					$scope.trackView("Settings");
				});
			}
		])

		.controller("FaqController", [
			"$scope",
			"$stateParams",
			function ($scope, $stateParams) {
				$scope.q = $stateParams.q;

				$scope.$watch("q", function (val) {
					$scope.trackView(["Faq", val].join("#"));
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
					}, function (message) {
						$scope.trackEvent("Welcome", "List", message, 1);
					});

				$scope.$on("$ionicView.enter", function () {
					$scope.trackView("Welcome");
				});
			}
		])
	;
})(window.TagsApp, window.angular);
