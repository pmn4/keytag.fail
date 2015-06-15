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
		.constant("BarCodeFormatMap", {
			// AZTEC: "azteccode", // cannot scan
			CODABAR: "rationalizedCodabar", // does not display
			CODE_39: "code39", // success
			CODE_93: "code93", // success
			CODE_128: "code128", // success
			DATA_MATRIX: "datamatrix", // success
			EAN_8: "ean8", // success scan/display, missing #s
			EAN_13: "ean13", // success scan/display, missing #s
			ITF: "itf14", // success
			MAXICODE: "msi", // cannot scan
			// PDF_417: "pdf417", // cannot scan
			QR_CODE: "qrcode", // success
			// RSS_14: "", // cannot display
			// RSS_EXPANDED: "", // cannot display
			UPC_A: "upca", // success
			UPC_E: "upce" // success
			// UPC_EAN_EXTENSION: ""
		})
		.constant("OrderByOptions", [
			{ key: "name", display: "Alphabetical" },
			{ key: "mostRecent", display: "Most Recently Created" },
			{ key: "mostRecentUse", display: "Most Recently Used" },
			{ key: "mostRecentSuccess", display: "Most Recent Success" },
			{ key: "mostRecentFailure", display: "Most Recent Failure" },
			{ key: "mostUsed", display: "Most Used" },
			{ key: "mostSuccessful", display: "Most Successful" },
			{ key: "mostFailed", display: "Least Successful" }
		])
	;
})(window.TagsApp, window.angular, window.location);
