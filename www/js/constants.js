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
			AZTEC: "azteccode",
			CODABAR: "",
			CODE_39: "code39",
			CODE_93: "code93",
			CODE_128: "code128",
			DATA_MATRIX: "datamatrix",
			EAN_8: "ean8",
			EAN_13: "ean13",
			ITF: "itf14",
			MAXICODE: "msi", // maybe?
			PDF_417: "pdf417",
			QR_CODE: "qrcode",
			RSS_14: "",
			RSS_EXPANDED: "",
			UPC_A: "upca",
			UPC_E: "upce",
			UPC_EAN_EXTENSION: ""
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
