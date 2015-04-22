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
					if (window.cordova && cordova.plugins.Keyboard) {
						cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
					}
					if (window.StatusBar) {
						StatusBar.styleDefault();
					}

					if (window.AdMob) {
						$cordovaGoogleAds.createBanner({
							adId: TagsApp.AdMobIds.footerBanner,
							position: AdMob.AD_POSITION.BOTTOM_CENTER,
							bgColor: "black",
							autoShow: true
						});
					}

					if (window.navigator && navigator.splashscreen) {
						navigator.splashscreen.hide();
					}
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
