;(function (appName, angular, undefined) {
	"use strict";

	angular.module(appName + ".filters", [])
		.filter("jsonFormatter", function () {
			return function (obj) {
				return JSON.stringify(obj, null, "  ");
			};
		})
	;
})("tagsApp", window.angular);
