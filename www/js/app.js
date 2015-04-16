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
			TagsApp.name + ".filters"
		])
		.run(function ($ionicPlatform) {
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
			});
		})

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

					.state("app.tag-list", {
						url: "/tags?tagId",
						views: {
							"menuContent": {
								templateUrl: "templates/key-tags.html",
								controller: "TagListController"
							}
						}
					})
				;

				// if none of the above states are matched, use this as the fallback
				$urlRouterProvider.otherwise("/app/tags");
			}
		])
	;
})(window.TagsApp, window.angular);
