;(function (TagsApp, angular, undefined) {
	"use strict";

	function Barcode(attributes) {
		if (!attributes) { return; }

		this.entryMethod = attributes.entryMethod;
		this.cancelled = attributes.cancelled;
		this.text = attributes.text;
		this.format = attributes.format;
	}

	function Usage(attributes) {
		if (!attributes) { return; }

		this.success = attributes.success;
		this.description = attributes.description;
		this.timestamp = new Date(Date.parse(attributes.timestamp) || Date.now());
	}

	function Tag(attributes) {
		if (!attributes) { return; }

		this.id = attributes.id;
		this.issuer = attributes.issuer;
		this.description = attributes.description;
		this.barcode = new Barcode(attributes.barcode);

		this.usage = [];
		angular.forEach(attributes.usage, function (u) {
			this.push(new Usage(u));
		}, this.usage);
	}
	Tag.prototype.success = function (description) {
		this.usage.push(new Usage({
			success: true,
			description: description
		}));
	};
	Tag.prototype.failure = function (description) {
		this.usage.push(new Usage({
			success: false,
			description: description
		}));
	};

	angular.module(TagsApp.name + ".factories", [])
		.factory("SettingsService", [
			"$q",
			"localStorageService",
			function ($q, localStorageService) {
				var KEY_PREFIX = "settings.", defaults;

				defaults = {
					showHistory: true,
					sortOrder: "name"
				};

				function _key(id) {
					return KEY_PREFIX + id;
				}

				function _get(key) {
					var settingObj = localStorageService.get(key);

					if (!settingObj) {
						settingObj = { value: defaults[key] };
					}

					return settingObj.value;
				}
				function _set(key, obj) {
					var settingObj = { value: obj };
					return localStorageService.set(key, settingObj);
				}

				return {
					fetch: function (id) {
						var deferred = $q.defer();

						try {
							deferred.resolve(_get(_key(id)));
						} catch (e) {
							deferred.reject(e);
						}

						return deferred.promise;
					},
					list: function () {
						var deferred = $q.defer(), settings = {};

						try {
							angular.forEach(localStorageService.keys(), function (key) {
								if (key.indexOf(KEY_PREFIX) !== 0) { return; }

								settings[key.replace(KEY_PREFIX, "")] = _get(key);
							}, this);

							deferred.resolve(settings);
						} catch (e) {
							deferred.reject(e);
						}

						return deferred.promise;
					},
					save: function (key, value) {
						var deferred = $q.defer();

						try {
							deferred.resolve(_set(_key(key), value));
						} catch (e) {
							deferred.reject(e);
						}

						return deferred.promise;
					},
					getShowHistory: function () {
						return this.fetch("showHistory");
					},
					setShowHistory: function (val) {
						return this.save("showHistory", val);
					}
				};
			}
		])
		.factory("TagsService", [
			"$q",
			"localStorageService",
			function ($q, localStorageService) {
				var KEY_PREFIX = "tag.";

				function _key(id) {
					return KEY_PREFIX + id;
				}

				function _get(key) {
					return new Tag(localStorageService.get(key));
				}
				function _set(key, obj) {
					return localStorageService.set(key, obj);
				}
				function _remove(key) {
					return localStorageService.remove(key);
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
						if (!(tagObj instanceof Tag)) {
							tagObj = new Tag(tagObj);
						}

						try {
							deferred.resolve(_set(_key(tagObj.id), tagObj));
						} catch (e) {
							deferred.reject(e);
						}

						return deferred.promise;
					},
					destroy: function (id) {
						var deferred = $q.defer();

						try {
							_remove(_key(id));

							deferred.resolve();
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
