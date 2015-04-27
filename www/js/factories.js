;(function (TagsApp, angular, _, undefined) {
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
		this.createdAt = new Date(Date.parse(attributes.createdAt) || Date.now());

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

	/// sorting algorithms
	Tag.prototype.mostRecentSort = function () {
		return -1 * this.createdAt;
	};
	Tag.prototype.mostRecentUseSort = function () {
		var mostRecent;

		if (!this.usage || !this.usage.length) { return Infinity; }

		mostRecent = _.chain(this.usage)
			.max(function (use) { return use.timestamp; })
			.value();

		return mostRecent ? -1 * mostRecent.timestamp : Infinity;
	};
	Tag.prototype.mostRecentSuccessSort = function () {
		var mostRecent;

		if (!this.usage || !this.usage.length) { return Infinity; }

		mostRecent = _.chain(this.usage)
			.filter(function (use) { return use.success; })
			.max(function (use) { return use.timestamp; })
			.value();

		return mostRecent ? -1 * mostRecent.timestamp : Infinity;
	};
	Tag.prototype.mostRecentFailureSort = function () {
		var mostRecent;

		if (!this.usage || !this.usage.length) { return Infinity; }

		mostRecent = _.chain(this.usage)
			.filter(function (use) { return !use.success; })
			.max(function (use) { return use.timestamp; })
			.value();

		return mostRecent ? -1 * mostRecent.timestamp : Infinity;
	};
	Tag.prototype.mostUsedSort = function () {
		if (!this.usage) { return Infinity; }

		return -1 * this.usage.length;
	};
	Tag.prototype.mostSuccessfulSort = function () {
		if (!this.usage || !this.usage.length) { return Infinity; }

		return -1 * _.chain(this.usage)
			.filter(function (use) { return use.success; })
			.size()
			.value();
	};
	Tag.prototype.mostFailedSort = function () {
		if (!this.usage || !this.usage.length) { return Infinity; }

		return -1 * _.chain(this.usage)
			.filter(function (use) { return !use.success; })
			.size()
			.value();
	};
	Tag.prototype.nameSort = function () {
		return this.issuer;
	};
	/// sorting algorithms

	function TagSort(tags) {
		this.tags = tags;
	}

	TagSort.prototype.sort = function (sortOrder) {
		return _.sortBy(this.tags, function (tag) {
			var fnSort = sortOrder + "Sort";

			if (!tag) { return undefined; }

			return fnSort in tag ? tag[fnSort]() : tag.nameSort();
		});
	};


	angular.module(TagsApp.name + ".factories", [])
		.factory("SettingsService", [
			"$q",
			"localStorageService",
			"OrderByOptions",
			function ($q, localStorageService, OrderByOptions) {
				var KEY_PREFIX = "settings.", defaults;

				defaults = {
					showHistory: true,
					sortOrder: (function (options) {
						for (var first in options) { return first; }
					})(OrderByOptions)
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
					list: function (sortOrder) {
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
					},
					getSortOrder: function () {
						return this.fetch("sortOrder");
					},
					setSortOrder: function (val) {
						return this.save("sortOrder", val);
					}
				};
			}
		])
		.factory("TagsService", [
			"$q",
			"localStorageService",
			function ($q, localStorageService) {
				var KEY_PREFIX = "tag.", lastUpdated, cache = {};

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
					fetchByBarcodeText: function (barcodeText) {
						var deferred = $q.defer();

						this.list()
							.then(function (tags) {
								for (var i=0; i<tags.length; i++) {
									if (tags[i] && tags[i].barcode && tags[i].barcode.text === barcodeText) {
										deferred.resolve(tags[i]);
										break;
									}
								}
								deferred.reject();
							}, function (e) {
								deferred.reject(e);
							});

						return deferred.promise;
					},
					list: function (sortOrder) {
						var deferred = $q.defer(), tags = [];

						if (cache.lastUpdated === lastUpdated && cache.data) {
							deferred.resolve(new TagSort(cache.data).sort(sortOrder));
							return deferred.promise;
						}

						try {
							angular.forEach(localStorageService.keys(), function (key) {
								if (key.indexOf(KEY_PREFIX) !== 0) { return; }

								tags.push(_get(key));
							}, this);

							cache = {
								lastUpdated: lastUpdated,
								data: tags
							}
							deferred.resolve(new TagSort(cache.data).sort(sortOrder));
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

						lastUpdated = new Date();

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

						lastUpdated = new Date();

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
})(window.TagsApp, window.angular, window._);
