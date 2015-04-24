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

				if (!tag) { return usage; }

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

				if (!tag) { return usage; }

				angular.forEach(tag.usage, function (use) {
					if (use.success === false) {
						this.push(use);
					}
				}, usage);

				return usage;
			};
		})
		.filter("tagSort", [
			"_",
			"OrderByOptions",
			function (_, OrderByOptions) {
				return function (tags, sortOrder) {
					return _.sortBy(tags, function (tag) {
						if (!tag) { return undefined; }

						switch (sortOrder) {
							// cases should align with OrderByOptions.keys
							case "mostRecent":
								return -1 * tag.createdAt;

							case "mostRecentUse":
								var mostRecent;

								if (!tag.usage || !tag.usage.length) { return Infinity; }

								mostRecent = _.chain(tag.usage)
									.max(function (use) { return use.timestamp; })
									.value();

								return mostRecent ? -1 * mostRecent.timestamp : Infinity;

							case "mostRecentSuccess":
								var mostRecent;

								if (!tag.usage || !tag.usage.length) { return Infinity; }

								mostRecent = _.chain(tag.usage)
									.filter(function (use) { return use.success; })
									.max(function (use) { return use.timestamp; })
									.value();

								return mostRecent ? -1 * mostRecent.timestamp : Infinity;

							case "mostRecentFailure":
								var mostRecent;

								if (!tag.usage || !tag.usage.length) { return Infinity; }

								mostRecent = _.chain(tag.usage)
									.filter(function (use) { return !use.success; })
									.max(function (use) { return use.timestamp; })
									.value();

								return mostRecent ? -1 * mostRecent.timestamp : Infinity;

							case "mostUsed":
								if (!tag.usage) { return Infinity; }

								return -1 * tag.usage.length;

							case "mostSuccessful":
								if (!tag.usage || !tag.usage.length) { return Infinity; }

								return -1 * _.chain(tag.usage)
									.filter(function (use) { return use.success; })
									.size()
									.value();

							case "mostFailed":
								if (!tag.usage || !tag.usage.length) { return Infinity; }

								return -1 * _.chain(tag.usage)
									.filter(function (use) { return !use.success; })
									.size()
									.value();

							case "byName":
							default:
								return tag.name;
						}
					});
				};
			}
		])
	;
})("tagsApp", window.angular);
