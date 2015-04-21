;(function (TagsApp, angular, undefined) {
	"use strict";

	angular
		.module(TagsApp.name, [
			"ionic",
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
					if (window.cordova && window.cordova.plugins.Keyboard) {
						cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
					}
					if (window.StatusBar) {
						// org.apache.cordova.statusbar required
						StatusBar.styleDefault();
					}

					// if (window.AdMob) {
						if (!$window.plugins) { $window.plugins = {}; }
						if (!$window.plugins.AdMob) { $window.plugins.AdMob = window.AdMob; }
						$window.plugins.AdMob.createBannerView = $window.plugins.AdMob.createBanner;
						$window.plugins.AdMob.showAd = $window.plugins.AdMob.showBanner;

						$cordovaGoogleAds.setOptions({
							position: AdMob.AD_POSITION.BOTTOM_CENTER,
							bgColor: "black",
							autoShow: true
						}).then(function () {
							console.log("AdMob:setOptions Success.", arguments);

							$cordovaGoogleAds.createBanner(TagsApp.AdMobIds.footerBanner)
								.then(function () {
									console.log("AdMob:createBannerView Success.", arguments);

									$cordovaGoogleAds.showBanner()
										.then(function () {
											console.log("AdMob:showAd Success.", arguments);
										}, function () {
											console.log("AdMob:showAd Failure.", arguments);
										});
								}, function () {
									console.log("AdMob:createBannerView Failure.", arguments);
								});
						}, function () {
							console.log("AdMob:setOptions Failure.", arguments);
						});
					// }
				});
			}
		])

		.config([
			"$stateProvider",
			"$urlRouterProvider",
			"localStorageServiceProvider",
			function ($stateProvider, $urlRouterProvider, localStorageServiceProvider) {
				localStorageServiceProvider.setPrefix(TagsApp.name);

				$stateProvider
					.state("app", {
						url: "/app",
						abstract: true,
						templateUrl: "templates/menu.html",
						controller: "AppController"
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

					.state("app.tags", {
						url: "/tags/:tagId",
						views: {
							"menuContent": {
								templateUrl: "templates/key-tags.html",
								controller: "TagsController"
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
