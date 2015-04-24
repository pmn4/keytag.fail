;(function (TagsApp, angular, _, BWIPJS, undefined) {
	"use strict";

	angular.module(TagsApp.name + ".libraries", [])
		.constant("_", _)
		.constant("BWIPJS", BWIPJS)
	;
})(window.TagsApp, window.angular, window._, window.BWIPJS);
