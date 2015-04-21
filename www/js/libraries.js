;(function (TagsApp, angular, BWIPJS, undefined) {
	"use strict";

	angular.module(TagsApp.name + ".libraries", [])
		.constant("BWIPJS", BWIPJS)
	;
})(window.TagsApp, window.angular, window.BWIPJS);
