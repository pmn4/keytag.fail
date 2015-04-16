;(function (TagsApp, angular, undefined) {
	"use strict";

	function Barcode(attributes) {
		if (!attributes) { return; }

		this.entryMethod = attributes.entryMethod;
		this.cancelled = attributes.cancelled;
		this.text = attributes.text;
		this.format = attributes.format;
	}

	function Tag(attributes) {
		if (!attributes) { return; }

		this.id = attributes.id;
		this.name = attributes.name;
		this.issuer = attributes.issuer;
		this.description = attributes.description;
		this.barcode = new Barcode(attributes.barcode);
	}

	angular.module(TagsApp.name + ".factories", [])
		.factory("TagsService", [
			"$q",
			"localStorageService",
			function ($q, localStorageService) {
				var KEY_PREFIX = "tag.";

				function _key(id) {
					return KEY_PREFIX + id;
				}

				function _get(key) {
					return localStorageService.get(key);
				}
				function _set(key, obj) {
					return localStorageService.set(key, obj);
				}

				return {
					newId: function () {
						// this is as good as anything, I guess
						return new Date().getTime();
					},
					fetch: function (id) {
						var deferred = $q.defer();
						try {
							deferred.resolve(_get(_key(id)) || {});
						} catch (e) {
							deferred.reject(e);
						}

						return deferred.promise;
					},
					list: function () {
						var deferred = $q.defer(), tags = [];

						try {
							angular.forEach(localStorageService.keys(), function (key) {
								if (key.indexOf(KEY_PREFIX) !== 0) { return; }

								tags.push(_get(key));
							}, this);

							deferred.resolve(tags);
						} catch (e) {
							deferred.reject(e);
						}

						return deferred.promise;
					},
					save: function (tagObj) {
						var deferred = $q.defer();

						if (!tagObj) {
							return $q.reject("Nothing to save.");
						}

						if (!tagObj.id) {
							tagObj.id = this.newId();
						}

						try {
							deferred.resolve(_set(_key(tagObj.id), new Tag(tagObj)));
						} catch (e) {
							deferred.reject(e);
						}

						return deferred.promise;
					}
				};
			}
		])
	;
})(window.TagsApp, window.angular);
