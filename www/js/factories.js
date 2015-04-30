;(function (TagsApp, angular, _, undefined) {
	"use strict";

	function LocalStorageStore(prefix, localStorageService) {
		this.prefix = prefix;
		this.localStorageService = localStorageService;
	}
	LocalStorageStore.prototype._key = function (id) {
		return this.prefix + id;
	};
	LocalStorageStore.prototype._get = function (key, DataClass) {
		var value = this.localStorageService.get(key);

		return DataClass ? new DataClass(value) : value;
	};
	LocalStorageStore.prototype.get = function (id, DataClass) {
		return this._get(this._key(id), DataClass);
	};
	LocalStorageStore.prototype._set = function (key, obj) {
		var success = this.localStorageService.set(key, obj);

		return success ? obj : null;
	};
	LocalStorageStore.prototype.set = function (id, obj) {
		return this._set(this._key(id), obj);
	};
	LocalStorageStore.prototype.list = function (DataClass) {
		var list = [];

		angular.forEach(this.localStorageService.keys(), function (key) {
			if (key.indexOf(this.prefix) !== 0) { return; }

			list.push(this._get(key, DataClass));
		}, this);

		return list;
	};
	LocalStorageStore.prototype._remove = function (key) {
		return this.localStorageService.remove(key);
	};
	LocalStorageStore.prototype.remove = function (key) {
		return this._remove(this._key(key));
	};


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
		return (this.issuer || "").toLowerCase();
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
				var defaults = {
					showHistory: true,
					sortOrder: (function (options) {
						for (var first in options) { return first; }
					})(OrderByOptions)
				};

				var Store = new LocalStorageStore("settings.", localStorageService);

				return {
					fetch: function (id) {
						var deferred = $q.defer();

						try {
							var settingObj = Store.get(id);

							deferred.resolve(settingObj ? settingObj.value : defaults[id]);
						} catch (e) {
							deferred.reject(e);
						}

						return deferred.promise;
					},
					// returns a dictionary, not an array
					list: function () {
						var deferred = $q.defer(), settings = {};

						try {
							var settingObjs = Store.list(), settings = {};

							angular.forEach(settingsObjs, function (settingObj) {
								this[settingObj.key] = settingObj.value;
							}, settings);

							deferred.resolve(settings);
						} catch (e) {
							deferred.reject(e);
						}

						return deferred.promise;
					},
					save: function (id, val) {
						var deferred = $q.defer();

						try {
							deferred.resolve(Store.set(id, {
								key: id,
								value: val
							}));
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

				var Store = new LocalStorageStore("tag.", localStorageService);

				return {
					newId: function () {
						// this is as good as anything, I guess
						return new Date().getTime();
					},
					fetch: function (id) {
						var deferred = $q.defer();

						try {
							deferred.resolve(Store.get(id, Tag) || {});
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
						var deferred = $q.defer();

						if (cache.lastUpdated === lastUpdated && cache.data) {
							deferred.resolve(new TagSort(cache.data).sort(sortOrder));
							return deferred.promise;
						}

						try {
							cache = {
								lastUpdated: lastUpdated,
								data: Store.list(Tag)
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
							deferred.resolve(Store.set(tagObj.id, tagObj));
						} catch (e) {
							deferred.reject(e);
						}

						return deferred.promise;
					},
					destroy: function (id) {
						var deferred = $q.defer();

						lastUpdated = new Date();

						try {
							Store.remove(id);

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
