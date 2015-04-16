var TagsApp = {
	name: "tagsApp",
	Controllers: {},
	Directives: {},
	Factories: {},
	Validators: {},
	platform: function (fnCordova, fnWebsite) {
		return window.cordova ? fnCordova() : fnWebsite();
	},
	Ads: {}
};

// // git rid of this once $webappGa is working
// if (!window.analytics){
// 	TagsApp.Analytics = {
// 		trackView: function () { return false; },
// 		trackEvent: function () { return false; },
// 		startTrackerWithId: function () { return false; },
// 	};
// }

TagsApp.AdMobIds = (function prepadAdMob(TagsApp, userAgent) {
	// for android
	if (/(android)/i.test(userAgent) ) {
		return {
			footerBanner: "ca-app-pub-2575801038037289/4282339856"
		};
	}

	// for ios
	if (/(ipod|iphone|ipad)/i.test(userAgent)) {
		return {
			footerBanner: "ca-app-pub-2575801038037289/7235806251"
		};
	}

	// for windows phone
	return {
		footerBanner: "ca-app-pub-xxx/zzz"
	};
})(TagsApp, navigator.userAgent);

(function () {
	var bootstrap = function () {
		angular.element(document).ready(function () {
			// retrieve the DOM element that had the ng-app attribute
			var domElement = document.getElementById("appElement");
			angular.bootstrap(domElement, [TagsApp.name]);
		});
	};

	TagsApp.platform(function () {
		document.addEventListener("deviceready", bootstrap, false);
	}, function () {
		document.addEventListener("DOMContentLoaded", bootstrap, false);
	});
})();
