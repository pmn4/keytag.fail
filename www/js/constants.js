;(function (TagsApp, angular, location, undefined) {
	"use strict";

	// Google Analytics

	var scripts = document.getElementsByTagName("script"),
	    currentScriptPath = scripts[scripts.length-1].src,
	    wwwIndex = currentScriptPath.indexOf("/www/"),
	    templatesPath = (wwwIndex >= 0 ? currentScriptPath.substring(0, wwwIndex + 5) : "/") + "templates/";

	angular.module(TagsApp.name + ".constants", [])
		.constant("AppConfig", {
			templatesPath: templatesPath,
			gaTrackingId: location.href.indexOf("localhost") >= 0 ? "UA-58511871-0" : "UA-45875189-4"
		})
		.constant("AppEnvironment", {
			device: !!window.cordova ? "native" : "webapp",
			webApp: !window.cordova,
			nativeApp: !!window.cordova
		})
	;
})(window.TagsApp, window.angular, window.location);
