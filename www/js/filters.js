;(function (appName, angular, undefined) {
	"use strict";

	angular.module(appName + ".filters", [])
		.filter("jsonFormatter", function () {
			return function (obj) {
				return JSON.stringify(obj, null, "  ");
			};
		})
		.filter("length", function () {
			return function (arr) {
				return arr ? arr.length : 0;
			};
		})
		.filter("humanReadableTimestamp", function () {
			var months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
			return function (dt) {
				return months[dt.getMonth()] + " " +
					dt.getDate() + ", " +
					dt.getFullYear() + " " +
					(dt.getHours() % 12) + ":" +
					(dt.getMinutes() < 10 ? "0" : "") +
					dt.getMinutes() +
					["am", "pm"][Math.floor(dt.getHours() / 12)];
			};
		})
		.filter("usageSuccess", function () {
			return function (tag) {
				var usage = [];

				angular.forEach(tag.usage, function (use) {
					if (use.success === true) {
						this.push(use);
					}
				}, usage);

				return usage;
			};
		})
		.filter("usageFailure", function () {
			return function (tag) {
				var usage = [];

				angular.forEach(tag.usage, function (use) {
					if (use.success === false) {
						this.push(use);
					}
				}, usage);

				return usage;
			};
		})
	;
})("tagsApp", window.angular);
