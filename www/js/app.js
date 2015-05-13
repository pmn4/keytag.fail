;(function (TagsApp, angular, undefined) {
	"use strict";

	angular
		.module(TagsApp.name, [
			"ionic",
			"ionic.service.core",
			"ionic.service.deploy",
			"LocalStorageModule",
			"ngCordova",
			TagsApp.name + ".constants",
			TagsApp.name + ".controllers",
			TagsApp.name + ".directives",
			TagsApp.name + ".factories",
			TagsApp.name + ".filters",
			TagsApp.name + ".libraries"
		])
		.run([
			"$window",
			"$ionicPlatform",
			"$cordovaGoogleAds",
			function ($window, $ionicPlatform, $cordovaGoogleAds) {
				$ionicPlatform.ready(function () {
					// Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
					// for form inputs)
					if (window.cordova && cordova.plugins.Keyboard) {
						cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
					}
					if (window.StatusBar) {
						StatusBar.styleDefault();
					}

					if (window.AdMob) {
						$cordovaGoogleAds.createBanner({
							adId: TagsApp.AdMobIds.footerBanner,
							bannerId: TagsApp.AdMobIds.footerBanner,
							position: AdMob.AD_POSITION.BOTTOM_CENTER,
							bgColor: "black",
							autoShow: true,
							overlap: true,
							orientationRenew: false
						});
					}

					if (window.navigator && navigator.splashscreen) {
						navigator.splashscreen.hide();
					}
				});
			}
		])

		.run([
			"$ionicPlatform",
			"$ionicDeploy",
			"$rootScope",
			"$state",
			"$q",
			function ($ionicPlatform, $ionicDeploy, $rootScope, $state, $q) {
				// var check = $q.defer();

				// Check for updates
				$ionicDeploy.check()
				// check.promise
					.then(function (newVersionAvailable) {
						if (newVersionAvailable) {
							$ionicPlatform.ready(function () {
								$state.go("app.update", {}, {
									location: false // maintain the URL so we know where to go when done
								});
							});
						} else {
							// No updates, load the most up to date version of the app
							$ionicDeploy.load();
						}
					}, function (error) {
						// Error checking for updates
					})

				// check.resolve(true);
			}
		])

		.config([
			"$ionicAppProvider",
			"$stateProvider",
			"$urlRouterProvider",
			"localStorageServiceProvider",
			function ($ionicAppProvider, $stateProvider, $urlRouterProvider, localStorageServiceProvider) {
				$ionicAppProvider.identify({
					// The App ID (from apps.ionic.io) for the server
					app_id: "eff6a445",
					// The public API key all services will use for this app
					api_key: "1d8513daa93e0f97ec4c2ce0cbd1c694a4f0fe45714cc59f",
					// The GCM project ID (project number) from your Google Developer Console
					gcm_id: "826581724252"
				});

				localStorageServiceProvider.setPrefix(TagsApp.name);

				$stateProvider
					.state("app", {
						url: "/app",
						abstract: true,
						templateUrl: "templates/menu.html",
						controller: "AppController"
					})

					.state("app.update", {
						url: "/update",
						views: {
							"menuContent": {
								templateUrl: "templates/app-update.html",
								controller: "AppUpdateController"
							}
						}
					})

					.state("app.welcome", {
						url: "/welcome",
						views: {
							"menuContent": {
								templateUrl: "templates/welcome.html",
								controller: "WelcomeController"
							}
						}
					})

					.state("app.tag-list", {
						url: "/tags",
						views: {
							"menuContent": {
								templateUrl: "templates/key-tag-list.html",
								controller: "TagListController"
							}
						}
					})

					.state("app.tag-create", {
						url: "/tags/new",
						views: {
							"menuContent": {
								templateUrl: "templates/tag-create.html",
								controller: "TagCreateController"
							}
						}
					})

					.state("app.tag-detail", {
						url: "/tags/:tagId",
						views: {
							"menuContent": {
								templateUrl: "templates/key-tag-detail.html",
								controller: "TagDetailController"
							}
						}
					})

					.state("app.faq", {
						url: "/faq?q",
						views: {
							"menuContent": {
								templateUrl: "templates/faq.html",
								controller: "FaqController"
							}
						}
					})

					.state("app.settings", {
						url: "/settings",
						views: {
							"menuContent": {
								templateUrl: "templates/settings.html",
								controller: "SettingsListController"
							}
						}
					})
				;

				// if none of the above states are matched, use this as the fallback
				$urlRouterProvider.otherwise("/app/welcome");
			}
		])
	;
})(window.TagsApp, window.angular);
