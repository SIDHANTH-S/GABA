/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ "./node_modules/better-sqlite3/lib/database.js"
/*!*****************************************************!*\
  !*** ./node_modules/better-sqlite3/lib/database.js ***!
  \*****************************************************/
(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

const fs = __webpack_require__(/*! fs */ "fs");
const path = __webpack_require__(/*! path */ "path");
const util = __webpack_require__(/*! ./util */ "./node_modules/better-sqlite3/lib/util.js");
const SqliteError = __webpack_require__(/*! ./sqlite-error */ "./node_modules/better-sqlite3/lib/sqlite-error.js");

let DEFAULT_ADDON;

function Database(filenameGiven, options) {
	if (new.target == null) {
		return new Database(filenameGiven, options);
	}

	// Apply defaults
	let buffer;
	if (Buffer.isBuffer(filenameGiven)) {
		buffer = filenameGiven;
		filenameGiven = ':memory:';
	}
	if (filenameGiven == null) filenameGiven = '';
	if (options == null) options = {};

	// Validate arguments
	if (typeof filenameGiven !== 'string') throw new TypeError('Expected first argument to be a string');
	if (typeof options !== 'object') throw new TypeError('Expected second argument to be an options object');
	if ('readOnly' in options) throw new TypeError('Misspelled option "readOnly" should be "readonly"');
	if ('memory' in options) throw new TypeError('Option "memory" was removed in v7.0.0 (use ":memory:" filename instead)');

	// Interpret options
	const filename = filenameGiven.trim();
	const anonymous = filename === '' || filename === ':memory:';
	const readonly = util.getBooleanOption(options, 'readonly');
	const fileMustExist = util.getBooleanOption(options, 'fileMustExist');
	const timeout = 'timeout' in options ? options.timeout : 5000;
	const verbose = 'verbose' in options ? options.verbose : null;
	const nativeBinding = 'nativeBinding' in options ? options.nativeBinding : null;

	// Validate interpreted options
	if (readonly && anonymous && !buffer) throw new TypeError('In-memory/temporary databases cannot be readonly');
	if (!Number.isInteger(timeout) || timeout < 0) throw new TypeError('Expected the "timeout" option to be a positive integer');
	if (timeout > 0x7fffffff) throw new RangeError('Option "timeout" cannot be greater than 2147483647');
	if (verbose != null && typeof verbose !== 'function') throw new TypeError('Expected the "verbose" option to be a function');
	if (nativeBinding != null && typeof nativeBinding !== 'string' && typeof nativeBinding !== 'object') throw new TypeError('Expected the "nativeBinding" option to be a string or addon object');

	// Load the native addon
	let addon;
	if (nativeBinding == null) {
		addon = DEFAULT_ADDON || (DEFAULT_ADDON = __webpack_require__(/*! bindings */ "./node_modules/bindings/bindings.js")('better_sqlite3.node'));
	} else if (typeof nativeBinding === 'string') {
		// See <https://webpack.js.org/api/module-variables/#__non_webpack_require__-webpack-specific>
		const requireFunc = typeof require === 'function' ? require : __webpack_require__("./node_modules/better-sqlite3/lib sync recursive");
		addon = requireFunc(path.resolve(nativeBinding).replace(/(\.node)?$/, '.node'));
	} else {
		// See <https://github.com/WiseLibs/better-sqlite3/issues/972>
		addon = nativeBinding;
	}

	if (!addon.isInitialized) {
		addon.setErrorConstructor(SqliteError);
		addon.isInitialized = true;
	}

	// Make sure the specified directory exists
	if (!anonymous && !fs.existsSync(path.dirname(filename))) {
		throw new TypeError('Cannot open database because the directory does not exist');
	}

	Object.defineProperties(this, {
		[util.cppdb]: { value: new addon.Database(filename, filenameGiven, anonymous, readonly, fileMustExist, timeout, verbose || null, buffer || null) },
		...wrappers.getters,
	});
}

const wrappers = __webpack_require__(/*! ./methods/wrappers */ "./node_modules/better-sqlite3/lib/methods/wrappers.js");
Database.prototype.prepare = wrappers.prepare;
Database.prototype.transaction = __webpack_require__(/*! ./methods/transaction */ "./node_modules/better-sqlite3/lib/methods/transaction.js");
Database.prototype.pragma = __webpack_require__(/*! ./methods/pragma */ "./node_modules/better-sqlite3/lib/methods/pragma.js");
Database.prototype.backup = __webpack_require__(/*! ./methods/backup */ "./node_modules/better-sqlite3/lib/methods/backup.js");
Database.prototype.serialize = __webpack_require__(/*! ./methods/serialize */ "./node_modules/better-sqlite3/lib/methods/serialize.js");
Database.prototype.function = __webpack_require__(/*! ./methods/function */ "./node_modules/better-sqlite3/lib/methods/function.js");
Database.prototype.aggregate = __webpack_require__(/*! ./methods/aggregate */ "./node_modules/better-sqlite3/lib/methods/aggregate.js");
Database.prototype.table = __webpack_require__(/*! ./methods/table */ "./node_modules/better-sqlite3/lib/methods/table.js");
Database.prototype.loadExtension = wrappers.loadExtension;
Database.prototype.exec = wrappers.exec;
Database.prototype.close = wrappers.close;
Database.prototype.defaultSafeIntegers = wrappers.defaultSafeIntegers;
Database.prototype.unsafeMode = wrappers.unsafeMode;
Database.prototype[util.inspect] = __webpack_require__(/*! ./methods/inspect */ "./node_modules/better-sqlite3/lib/methods/inspect.js");

module.exports = Database;


/***/ },

/***/ "./node_modules/better-sqlite3/lib/index.js"
/*!**************************************************!*\
  !*** ./node_modules/better-sqlite3/lib/index.js ***!
  \**************************************************/
(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

module.exports = __webpack_require__(/*! ./database */ "./node_modules/better-sqlite3/lib/database.js");
module.exports.SqliteError = __webpack_require__(/*! ./sqlite-error */ "./node_modules/better-sqlite3/lib/sqlite-error.js");


/***/ },

/***/ "./node_modules/better-sqlite3/lib/methods/aggregate.js"
/*!**************************************************************!*\
  !*** ./node_modules/better-sqlite3/lib/methods/aggregate.js ***!
  \**************************************************************/
(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

const { getBooleanOption, cppdb } = __webpack_require__(/*! ../util */ "./node_modules/better-sqlite3/lib/util.js");

module.exports = function defineAggregate(name, options) {
	// Validate arguments
	if (typeof name !== 'string') throw new TypeError('Expected first argument to be a string');
	if (typeof options !== 'object' || options === null) throw new TypeError('Expected second argument to be an options object');
	if (!name) throw new TypeError('User-defined function name cannot be an empty string');

	// Interpret options
	const start = 'start' in options ? options.start : null;
	const step = getFunctionOption(options, 'step', true);
	const inverse = getFunctionOption(options, 'inverse', false);
	const result = getFunctionOption(options, 'result', false);
	const safeIntegers = 'safeIntegers' in options ? +getBooleanOption(options, 'safeIntegers') : 2;
	const deterministic = getBooleanOption(options, 'deterministic');
	const directOnly = getBooleanOption(options, 'directOnly');
	const varargs = getBooleanOption(options, 'varargs');
	let argCount = -1;

	// Determine argument count
	if (!varargs) {
		argCount = Math.max(getLength(step), inverse ? getLength(inverse) : 0);
		if (argCount > 0) argCount -= 1;
		if (argCount > 100) throw new RangeError('User-defined functions cannot have more than 100 arguments');
	}

	this[cppdb].aggregate(start, step, inverse, result, name, argCount, safeIntegers, deterministic, directOnly);
	return this;
};

const getFunctionOption = (options, key, required) => {
	const value = key in options ? options[key] : null;
	if (typeof value === 'function') return value;
	if (value != null) throw new TypeError(`Expected the "${key}" option to be a function`);
	if (required) throw new TypeError(`Missing required option "${key}"`);
	return null;
};

const getLength = ({ length }) => {
	if (Number.isInteger(length) && length >= 0) return length;
	throw new TypeError('Expected function.length to be a positive integer');
};


/***/ },

/***/ "./node_modules/better-sqlite3/lib/methods/backup.js"
/*!***********************************************************!*\
  !*** ./node_modules/better-sqlite3/lib/methods/backup.js ***!
  \***********************************************************/
(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

const fs = __webpack_require__(/*! fs */ "fs");
const path = __webpack_require__(/*! path */ "path");
const { promisify } = __webpack_require__(/*! util */ "util");
const { cppdb } = __webpack_require__(/*! ../util */ "./node_modules/better-sqlite3/lib/util.js");
const fsAccess = promisify(fs.access);

module.exports = async function backup(filename, options) {
	if (options == null) options = {};

	// Validate arguments
	if (typeof filename !== 'string') throw new TypeError('Expected first argument to be a string');
	if (typeof options !== 'object') throw new TypeError('Expected second argument to be an options object');

	// Interpret options
	filename = filename.trim();
	const attachedName = 'attached' in options ? options.attached : 'main';
	const handler = 'progress' in options ? options.progress : null;

	// Validate interpreted options
	if (!filename) throw new TypeError('Backup filename cannot be an empty string');
	if (filename === ':memory:') throw new TypeError('Invalid backup filename ":memory:"');
	if (typeof attachedName !== 'string') throw new TypeError('Expected the "attached" option to be a string');
	if (!attachedName) throw new TypeError('The "attached" option cannot be an empty string');
	if (handler != null && typeof handler !== 'function') throw new TypeError('Expected the "progress" option to be a function');

	// Make sure the specified directory exists
	await fsAccess(path.dirname(filename)).catch(() => {
		throw new TypeError('Cannot save backup because the directory does not exist');
	});

	const isNewFile = await fsAccess(filename).then(() => false, () => true);
	return runBackup(this[cppdb].backup(this, attachedName, filename, isNewFile), handler || null);
};

const runBackup = (backup, handler) => {
	let rate = 0;
	let useDefault = true;

	return new Promise((resolve, reject) => {
		setImmediate(function step() {
			try {
				const progress = backup.transfer(rate);
				if (!progress.remainingPages) {
					backup.close();
					resolve(progress);
					return;
				}
				if (useDefault) {
					useDefault = false;
					rate = 100;
				}
				if (handler) {
					const ret = handler(progress);
					if (ret !== undefined) {
						if (typeof ret === 'number' && ret === ret) rate = Math.max(0, Math.min(0x7fffffff, Math.round(ret)));
						else throw new TypeError('Expected progress callback to return a number or undefined');
					}
				}
				setImmediate(step);
			} catch (err) {
				backup.close();
				reject(err);
			}
		});
	});
};


/***/ },

/***/ "./node_modules/better-sqlite3/lib/methods/function.js"
/*!*************************************************************!*\
  !*** ./node_modules/better-sqlite3/lib/methods/function.js ***!
  \*************************************************************/
(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

const { getBooleanOption, cppdb } = __webpack_require__(/*! ../util */ "./node_modules/better-sqlite3/lib/util.js");

module.exports = function defineFunction(name, options, fn) {
	// Apply defaults
	if (options == null) options = {};
	if (typeof options === 'function') { fn = options; options = {}; }

	// Validate arguments
	if (typeof name !== 'string') throw new TypeError('Expected first argument to be a string');
	if (typeof fn !== 'function') throw new TypeError('Expected last argument to be a function');
	if (typeof options !== 'object') throw new TypeError('Expected second argument to be an options object');
	if (!name) throw new TypeError('User-defined function name cannot be an empty string');

	// Interpret options
	const safeIntegers = 'safeIntegers' in options ? +getBooleanOption(options, 'safeIntegers') : 2;
	const deterministic = getBooleanOption(options, 'deterministic');
	const directOnly = getBooleanOption(options, 'directOnly');
	const varargs = getBooleanOption(options, 'varargs');
	let argCount = -1;

	// Determine argument count
	if (!varargs) {
		argCount = fn.length;
		if (!Number.isInteger(argCount) || argCount < 0) throw new TypeError('Expected function.length to be a positive integer');
		if (argCount > 100) throw new RangeError('User-defined functions cannot have more than 100 arguments');
	}

	this[cppdb].function(fn, name, argCount, safeIntegers, deterministic, directOnly);
	return this;
};


/***/ },

/***/ "./node_modules/better-sqlite3/lib/methods/inspect.js"
/*!************************************************************!*\
  !*** ./node_modules/better-sqlite3/lib/methods/inspect.js ***!
  \************************************************************/
(module) {

"use strict";

const DatabaseInspection = function Database() {};

module.exports = function inspect(depth, opts) {
	return Object.assign(new DatabaseInspection(), this);
};



/***/ },

/***/ "./node_modules/better-sqlite3/lib/methods/pragma.js"
/*!***********************************************************!*\
  !*** ./node_modules/better-sqlite3/lib/methods/pragma.js ***!
  \***********************************************************/
(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

const { getBooleanOption, cppdb } = __webpack_require__(/*! ../util */ "./node_modules/better-sqlite3/lib/util.js");

module.exports = function pragma(source, options) {
	if (options == null) options = {};
	if (typeof source !== 'string') throw new TypeError('Expected first argument to be a string');
	if (typeof options !== 'object') throw new TypeError('Expected second argument to be an options object');
	const simple = getBooleanOption(options, 'simple');

	const stmt = this[cppdb].prepare(`PRAGMA ${source}`, this, true);
	return simple ? stmt.pluck().get() : stmt.all();
};


/***/ },

/***/ "./node_modules/better-sqlite3/lib/methods/serialize.js"
/*!**************************************************************!*\
  !*** ./node_modules/better-sqlite3/lib/methods/serialize.js ***!
  \**************************************************************/
(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

const { cppdb } = __webpack_require__(/*! ../util */ "./node_modules/better-sqlite3/lib/util.js");

module.exports = function serialize(options) {
	if (options == null) options = {};

	// Validate arguments
	if (typeof options !== 'object') throw new TypeError('Expected first argument to be an options object');

	// Interpret and validate options
	const attachedName = 'attached' in options ? options.attached : 'main';
	if (typeof attachedName !== 'string') throw new TypeError('Expected the "attached" option to be a string');
	if (!attachedName) throw new TypeError('The "attached" option cannot be an empty string');

	return this[cppdb].serialize(attachedName);
};


/***/ },

/***/ "./node_modules/better-sqlite3/lib/methods/table.js"
/*!**********************************************************!*\
  !*** ./node_modules/better-sqlite3/lib/methods/table.js ***!
  \**********************************************************/
(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

const { cppdb } = __webpack_require__(/*! ../util */ "./node_modules/better-sqlite3/lib/util.js");

module.exports = function defineTable(name, factory) {
	// Validate arguments
	if (typeof name !== 'string') throw new TypeError('Expected first argument to be a string');
	if (!name) throw new TypeError('Virtual table module name cannot be an empty string');

	// Determine whether the module is eponymous-only or not
	let eponymous = false;
	if (typeof factory === 'object' && factory !== null) {
		eponymous = true;
		factory = defer(parseTableDefinition(factory, 'used', name));
	} else {
		if (typeof factory !== 'function') throw new TypeError('Expected second argument to be a function or a table definition object');
		factory = wrapFactory(factory);
	}

	this[cppdb].table(factory, name, eponymous);
	return this;
};

function wrapFactory(factory) {
	return function virtualTableFactory(moduleName, databaseName, tableName, ...args) {
		const thisObject = {
			module: moduleName,
			database: databaseName,
			table: tableName,
		};

		// Generate a new table definition by invoking the factory
		const def = apply.call(factory, thisObject, args);
		if (typeof def !== 'object' || def === null) {
			throw new TypeError(`Virtual table module "${moduleName}" did not return a table definition object`);
		}

		return parseTableDefinition(def, 'returned', moduleName);
	};
}

function parseTableDefinition(def, verb, moduleName) {
	// Validate required properties
	if (!hasOwnProperty.call(def, 'rows')) {
		throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition without a "rows" property`);
	}
	if (!hasOwnProperty.call(def, 'columns')) {
		throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition without a "columns" property`);
	}

	// Validate "rows" property
	const rows = def.rows;
	if (typeof rows !== 'function' || Object.getPrototypeOf(rows) !== GeneratorFunctionPrototype) {
		throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "rows" property (should be a generator function)`);
	}

	// Validate "columns" property
	let columns = def.columns;
	if (!Array.isArray(columns) || !(columns = [...columns]).every(x => typeof x === 'string')) {
		throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "columns" property (should be an array of strings)`);
	}
	if (columns.length !== new Set(columns).size) {
		throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with duplicate column names`);
	}
	if (!columns.length) {
		throw new RangeError(`Virtual table module "${moduleName}" ${verb} a table definition with zero columns`);
	}

	// Validate "parameters" property
	let parameters;
	if (hasOwnProperty.call(def, 'parameters')) {
		parameters = def.parameters;
		if (!Array.isArray(parameters) || !(parameters = [...parameters]).every(x => typeof x === 'string')) {
			throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "parameters" property (should be an array of strings)`);
		}
	} else {
		parameters = inferParameters(rows);
	}
	if (parameters.length !== new Set(parameters).size) {
		throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with duplicate parameter names`);
	}
	if (parameters.length > 32) {
		throw new RangeError(`Virtual table module "${moduleName}" ${verb} a table definition with more than the maximum number of 32 parameters`);
	}
	for (const parameter of parameters) {
		if (columns.includes(parameter)) {
			throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with column "${parameter}" which was ambiguously defined as both a column and parameter`);
		}
	}

	// Validate "safeIntegers" option
	let safeIntegers = 2;
	if (hasOwnProperty.call(def, 'safeIntegers')) {
		const bool = def.safeIntegers;
		if (typeof bool !== 'boolean') {
			throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "safeIntegers" property (should be a boolean)`);
		}
		safeIntegers = +bool;
	}

	// Validate "directOnly" option
	let directOnly = false;
	if (hasOwnProperty.call(def, 'directOnly')) {
		directOnly = def.directOnly;
		if (typeof directOnly !== 'boolean') {
			throw new TypeError(`Virtual table module "${moduleName}" ${verb} a table definition with an invalid "directOnly" property (should be a boolean)`);
		}
	}

	// Generate SQL for the virtual table definition
	const columnDefinitions = [
		...parameters.map(identifier).map(str => `${str} HIDDEN`),
		...columns.map(identifier),
	];
	return [
		`CREATE TABLE x(${columnDefinitions.join(', ')});`,
		wrapGenerator(rows, new Map(columns.map((x, i) => [x, parameters.length + i])), moduleName),
		parameters,
		safeIntegers,
		directOnly,
	];
}

function wrapGenerator(generator, columnMap, moduleName) {
	return function* virtualTable(...args) {
		/*
			We must defensively clone any buffers in the arguments, because
			otherwise the generator could mutate one of them, which would cause
			us to return incorrect values for hidden columns, potentially
			corrupting the database.
		 */
		const output = args.map(x => Buffer.isBuffer(x) ? Buffer.from(x) : x);
		for (let i = 0; i < columnMap.size; ++i) {
			output.push(null); // Fill with nulls to prevent gaps in array (v8 optimization)
		}
		for (const row of generator(...args)) {
			if (Array.isArray(row)) {
				extractRowArray(row, output, columnMap.size, moduleName);
				yield output;
			} else if (typeof row === 'object' && row !== null) {
				extractRowObject(row, output, columnMap, moduleName);
				yield output;
			} else {
				throw new TypeError(`Virtual table module "${moduleName}" yielded something that isn't a valid row object`);
			}
		}
	};
}

function extractRowArray(row, output, columnCount, moduleName) {
	if (row.length !== columnCount) {
		throw new TypeError(`Virtual table module "${moduleName}" yielded a row with an incorrect number of columns`);
	}
	const offset = output.length - columnCount;
	for (let i = 0; i < columnCount; ++i) {
		output[i + offset] = row[i];
	}
}

function extractRowObject(row, output, columnMap, moduleName) {
	let count = 0;
	for (const key of Object.keys(row)) {
		const index = columnMap.get(key);
		if (index === undefined) {
			throw new TypeError(`Virtual table module "${moduleName}" yielded a row with an undeclared column "${key}"`);
		}
		output[index] = row[key];
		count += 1;
	}
	if (count !== columnMap.size) {
		throw new TypeError(`Virtual table module "${moduleName}" yielded a row with missing columns`);
	}
}

function inferParameters({ length }) {
	if (!Number.isInteger(length) || length < 0) {
		throw new TypeError('Expected function.length to be a positive integer');
	}
	const params = [];
	for (let i = 0; i < length; ++i) {
		params.push(`$${i + 1}`);
	}
	return params;
}

const { hasOwnProperty } = Object.prototype;
const { apply } = Function.prototype;
const GeneratorFunctionPrototype = Object.getPrototypeOf(function*(){});
const identifier = str => `"${str.replace(/"/g, '""')}"`;
const defer = x => () => x;


/***/ },

/***/ "./node_modules/better-sqlite3/lib/methods/transaction.js"
/*!****************************************************************!*\
  !*** ./node_modules/better-sqlite3/lib/methods/transaction.js ***!
  \****************************************************************/
(module, __unused_webpack_exports, __webpack_require__) {

"use strict";

const { cppdb } = __webpack_require__(/*! ../util */ "./node_modules/better-sqlite3/lib/util.js");
const controllers = new WeakMap();

module.exports = function transaction(fn) {
	if (typeof fn !== 'function') throw new TypeError('Expected first argument to be a function');

	const db = this[cppdb];
	const controller = getController(db, this);
	const { apply } = Function.prototype;

	// Each version of the transaction function has these same properties
	const properties = {
		default: { value: wrapTransaction(apply, fn, db, controller.default) },
		deferred: { value: wrapTransaction(apply, fn, db, controller.deferred) },
		immediate: { value: wrapTransaction(apply, fn, db, controller.immediate) },
		exclusive: { value: wrapTransaction(apply, fn, db, controller.exclusive) },
		database: { value: this, enumerable: true },
	};

	Object.defineProperties(properties.default.value, properties);
	Object.defineProperties(properties.deferred.value, properties);
	Object.defineProperties(properties.immediate.value, properties);
	Object.defineProperties(properties.exclusive.value, properties);

	// Return the default version of the transaction function
	return properties.default.value;
};

// Return the database's cached transaction controller, or create a new one
const getController = (db, self) => {
	let controller = controllers.get(db);
	if (!controller) {
		const shared = {
			commit: db.prepare('COMMIT', self, false),
			rollback: db.prepare('ROLLBACK', self, false),
			savepoint: db.prepare('SAVEPOINT `\t_bs3.\t`', self, false),
			release: db.prepare('RELEASE `\t_bs3.\t`', self, false),
			rollbackTo: db.prepare('ROLLBACK TO `\t_bs3.\t`', self, false),
		};
		controllers.set(db, controller = {
			default: Object.assign({ begin: db.prepare('BEGIN', self, false) }, shared),
			deferred: Object.assign({ begin: db.prepare('BEGIN DEFERRED', self, false) }, shared),
			immediate: Object.assign({ begin: db.prepare('BEGIN IMMEDIATE', self, false) }, shared),
			exclusive: Object.assign({ begin: db.prepare('BEGIN EXCLUSIVE', self, false) }, shared),
		});
	}
	return controller;
};

// Return a new transaction function by wrapping the given function
const wrapTransaction = (apply, fn, db, { begin, commit, rollback, savepoint, release, rollbackTo }) => function sqliteTransaction() {
	let before, after, undo;
	if (db.inTransaction) {
		before = savepoint;
		after = release;
		undo = rollbackTo;
	} else {
		before = begin;
		after = commit;
		undo = rollback;
	}
	before.run();
	try {
		const result = apply.call(fn, this, arguments);
		if (result && typeof result.then === 'function') {
			throw new TypeError('Transaction function cannot return a promise');
		}
		after.run();
		return result;
	} catch (ex) {
		if (db.inTransaction) {
			undo.run();
			if (undo !== rollback) after.run();
		}
		throw ex;
	}
};


/***/ },

/***/ "./node_modules/better-sqlite3/lib/methods/wrappers.js"
/*!*************************************************************!*\
  !*** ./node_modules/better-sqlite3/lib/methods/wrappers.js ***!
  \*************************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

const { cppdb } = __webpack_require__(/*! ../util */ "./node_modules/better-sqlite3/lib/util.js");

exports.prepare = function prepare(sql) {
	return this[cppdb].prepare(sql, this, false);
};

exports.exec = function exec(sql) {
	this[cppdb].exec(sql);
	return this;
};

exports.close = function close() {
	this[cppdb].close();
	return this;
};

exports.loadExtension = function loadExtension(...args) {
	this[cppdb].loadExtension(...args);
	return this;
};

exports.defaultSafeIntegers = function defaultSafeIntegers(...args) {
	this[cppdb].defaultSafeIntegers(...args);
	return this;
};

exports.unsafeMode = function unsafeMode(...args) {
	this[cppdb].unsafeMode(...args);
	return this;
};

exports.getters = {
	name: {
		get: function name() { return this[cppdb].name; },
		enumerable: true,
	},
	open: {
		get: function open() { return this[cppdb].open; },
		enumerable: true,
	},
	inTransaction: {
		get: function inTransaction() { return this[cppdb].inTransaction; },
		enumerable: true,
	},
	readonly: {
		get: function readonly() { return this[cppdb].readonly; },
		enumerable: true,
	},
	memory: {
		get: function memory() { return this[cppdb].memory; },
		enumerable: true,
	},
};


/***/ },

/***/ "./node_modules/better-sqlite3/lib/sqlite-error.js"
/*!*********************************************************!*\
  !*** ./node_modules/better-sqlite3/lib/sqlite-error.js ***!
  \*********************************************************/
(module) {

"use strict";

const descriptor = { value: 'SqliteError', writable: true, enumerable: false, configurable: true };

function SqliteError(message, code) {
	if (new.target !== SqliteError) {
		return new SqliteError(message, code);
	}
	if (typeof code !== 'string') {
		throw new TypeError('Expected second argument to be a string');
	}
	Error.call(this, message);
	descriptor.value = '' + message;
	Object.defineProperty(this, 'message', descriptor);
	Error.captureStackTrace(this, SqliteError);
	this.code = code;
}
Object.setPrototypeOf(SqliteError, Error);
Object.setPrototypeOf(SqliteError.prototype, Error.prototype);
Object.defineProperty(SqliteError.prototype, 'name', descriptor);
module.exports = SqliteError;


/***/ },

/***/ "./node_modules/better-sqlite3/lib/util.js"
/*!*************************************************!*\
  !*** ./node_modules/better-sqlite3/lib/util.js ***!
  \*************************************************/
(__unused_webpack_module, exports) {

"use strict";


exports.getBooleanOption = (options, key) => {
	let value = false;
	if (key in options && typeof (value = options[key]) !== 'boolean') {
		throw new TypeError(`Expected the "${key}" option to be a boolean`);
	}
	return value;
};

exports.cppdb = Symbol();
exports.inspect = Symbol.for('nodejs.util.inspect.custom');


/***/ },

/***/ "./node_modules/better-sqlite3/lib sync recursive"
/*!***********************************************!*\
  !*** ./node_modules/better-sqlite3/lib/ sync ***!
  \***********************************************/
(module) {

function webpackEmptyContext(req) {
	const e = new Error("Cannot find module '" + req + "'");
	e.code = 'MODULE_NOT_FOUND';
	throw e;
}
webpackEmptyContext.keys = () => ([]);
webpackEmptyContext.resolve = webpackEmptyContext;
webpackEmptyContext.id = "./node_modules/better-sqlite3/lib sync recursive";
module.exports = webpackEmptyContext;

/***/ },

/***/ "./node_modules/bindings/bindings.js"
/*!*******************************************!*\
  !*** ./node_modules/bindings/bindings.js ***!
  \*******************************************/
(module, exports, __webpack_require__) {

/**
 * Module dependencies.
 */

var fs = __webpack_require__(/*! fs */ "fs"),
  path = __webpack_require__(/*! path */ "path"),
  fileURLToPath = __webpack_require__(/*! file-uri-to-path */ "./node_modules/file-uri-to-path/index.js"),
  join = path.join,
  dirname = path.dirname,
  exists =
    (fs.accessSync &&
      function(path) {
        try {
          fs.accessSync(path);
        } catch (e) {
          return false;
        }
        return true;
      }) ||
    fs.existsSync ||
    path.existsSync,
  defaults = {
    arrow: process.env.NODE_BINDINGS_ARROW || ' → ',
    compiled: process.env.NODE_BINDINGS_COMPILED_DIR || 'compiled',
    platform: process.platform,
    arch: process.arch,
    nodePreGyp:
      'node-v' +
      process.versions.modules +
      '-' +
      process.platform +
      '-' +
      process.arch,
    version: process.versions.node,
    bindings: 'bindings.node',
    try: [
      // node-gyp's linked version in the "build" dir
      ['module_root', 'build', 'bindings'],
      // node-waf and gyp_addon (a.k.a node-gyp)
      ['module_root', 'build', 'Debug', 'bindings'],
      ['module_root', 'build', 'Release', 'bindings'],
      // Debug files, for development (legacy behavior, remove for node v0.9)
      ['module_root', 'out', 'Debug', 'bindings'],
      ['module_root', 'Debug', 'bindings'],
      // Release files, but manually compiled (legacy behavior, remove for node v0.9)
      ['module_root', 'out', 'Release', 'bindings'],
      ['module_root', 'Release', 'bindings'],
      // Legacy from node-waf, node <= 0.4.x
      ['module_root', 'build', 'default', 'bindings'],
      // Production "Release" buildtype binary (meh...)
      ['module_root', 'compiled', 'version', 'platform', 'arch', 'bindings'],
      // node-qbs builds
      ['module_root', 'addon-build', 'release', 'install-root', 'bindings'],
      ['module_root', 'addon-build', 'debug', 'install-root', 'bindings'],
      ['module_root', 'addon-build', 'default', 'install-root', 'bindings'],
      // node-pre-gyp path ./lib/binding/{node_abi}-{platform}-{arch}
      ['module_root', 'lib', 'binding', 'nodePreGyp', 'bindings']
    ]
  };

/**
 * The main `bindings()` function loads the compiled bindings for a given module.
 * It uses V8's Error API to determine the parent filename that this function is
 * being invoked from, which is then used to find the root directory.
 */

function bindings(opts) {
  // Argument surgery
  if (typeof opts == 'string') {
    opts = { bindings: opts };
  } else if (!opts) {
    opts = {};
  }

  // maps `defaults` onto `opts` object
  Object.keys(defaults).map(function(i) {
    if (!(i in opts)) opts[i] = defaults[i];
  });

  // Get the module root
  if (!opts.module_root) {
    opts.module_root = exports.getRoot(exports.getFileName());
  }

  // Ensure the given bindings name ends with .node
  if (path.extname(opts.bindings) != '.node') {
    opts.bindings += '.node';
  }

  // https://github.com/webpack/webpack/issues/4175#issuecomment-342931035
  var requireFunc =
     true
      ? require
      : 0;

  var tries = [],
    i = 0,
    l = opts.try.length,
    n,
    b,
    err;

  for (; i < l; i++) {
    n = join.apply(
      null,
      opts.try[i].map(function(p) {
        return opts[p] || p;
      })
    );
    tries.push(n);
    try {
      b = opts.path ? requireFunc.resolve(n) : requireFunc(n);
      if (!opts.path) {
        b.path = n;
      }
      return b;
    } catch (e) {
      if (e.code !== 'MODULE_NOT_FOUND' &&
          e.code !== 'QUALIFIED_PATH_RESOLUTION_FAILED' &&
          !/not find/i.test(e.message)) {
        throw e;
      }
    }
  }

  err = new Error(
    'Could not locate the bindings file. Tried:\n' +
      tries
        .map(function(a) {
          return opts.arrow + a;
        })
        .join('\n')
  );
  err.tries = tries;
  throw err;
}
module.exports = exports = bindings;

/**
 * Gets the filename of the JavaScript file that invokes this function.
 * Used to help find the root directory of a module.
 * Optionally accepts an filename argument to skip when searching for the invoking filename
 */

exports.getFileName = function getFileName(calling_file) {
  var origPST = Error.prepareStackTrace,
    origSTL = Error.stackTraceLimit,
    dummy = {},
    fileName;

  Error.stackTraceLimit = 10;

  Error.prepareStackTrace = function(e, st) {
    for (var i = 0, l = st.length; i < l; i++) {
      fileName = st[i].getFileName();
      if (fileName !== __filename) {
        if (calling_file) {
          if (fileName !== calling_file) {
            return;
          }
        } else {
          return;
        }
      }
    }
  };

  // run the 'prepareStackTrace' function above
  Error.captureStackTrace(dummy);
  dummy.stack;

  // cleanup
  Error.prepareStackTrace = origPST;
  Error.stackTraceLimit = origSTL;

  // handle filename that starts with "file://"
  var fileSchema = 'file://';
  if (fileName.indexOf(fileSchema) === 0) {
    fileName = fileURLToPath(fileName);
  }

  return fileName;
};

/**
 * Gets the root directory of a module, given an arbitrary filename
 * somewhere in the module tree. The "root directory" is the directory
 * containing the `package.json` file.
 *
 *   In:  /home/nate/node-native-module/lib/index.js
 *   Out: /home/nate/node-native-module
 */

exports.getRoot = function getRoot(file) {
  var dir = dirname(file),
    prev;
  while (true) {
    if (dir === '.') {
      // Avoids an infinite loop in rare cases, like the REPL
      dir = process.cwd();
    }
    if (
      exists(join(dir, 'package.json')) ||
      exists(join(dir, 'node_modules'))
    ) {
      // Found the 'package.json' file or 'node_modules' dir; we're done
      return dir;
    }
    if (prev === dir) {
      // Got to the top
      throw new Error(
        'Could not find module root given file: "' +
          file +
          '". Do you have a `package.json` file? '
      );
    }
    // Try the parent dir next
    prev = dir;
    dir = join(dir, '..');
  }
};


/***/ },

/***/ "./node_modules/dotenv/lib/main.js"
/*!*****************************************!*\
  !*** ./node_modules/dotenv/lib/main.js ***!
  \*****************************************/
(module, __unused_webpack_exports, __webpack_require__) {

const fs = __webpack_require__(/*! fs */ "fs")
const path = __webpack_require__(/*! path */ "path")
const os = __webpack_require__(/*! os */ "os")
const crypto = __webpack_require__(/*! crypto */ "crypto")

// Array of tips to display randomly
const TIPS = [
  '◈ encrypted .env [www.dotenvx.com]',
  '◈ secrets for agents [www.dotenvx.com]',
  '⌁ auth for agents [www.vestauth.com]',
  '⌘ custom filepath { path: \'/custom/path/.env\' }',
  '⌘ enable debugging { debug: true }',
  '⌘ override existing { override: true }',
  '⌘ suppress logs { quiet: true }',
  '⌘ multiple files { path: [\'.env.local\', \'.env\'] }'
]

// Get a random tip from the tips array
function _getRandomTip () {
  return TIPS[Math.floor(Math.random() * TIPS.length)]
}

function parseBoolean (value) {
  if (typeof value === 'string') {
    return !['false', '0', 'no', 'off', ''].includes(value.toLowerCase())
  }
  return Boolean(value)
}

function supportsAnsi () {
  return process.stdout.isTTY // && process.env.TERM !== 'dumb'
}

function dim (text) {
  return supportsAnsi() ? `\x1b[2m${text}\x1b[0m` : text
}

const LINE = /(?:^|^)\s*(?:export\s+)?([\w.-]+)(?:\s*=\s*?|:\s+?)(\s*'(?:\\'|[^'])*'|\s*"(?:\\"|[^"])*"|\s*`(?:\\`|[^`])*`|[^#\r\n]+)?\s*(?:#.*)?(?:$|$)/mg

// Parse src into an Object
function parse (src) {
  const obj = {}

  // Convert buffer to string
  let lines = src.toString()

  // Convert line breaks to same format
  lines = lines.replace(/\r\n?/mg, '\n')

  let match
  while ((match = LINE.exec(lines)) != null) {
    const key = match[1]

    // Default undefined or null to empty string
    let value = (match[2] || '')

    // Remove whitespace
    value = value.trim()

    // Check if double quoted
    const maybeQuote = value[0]

    // Remove surrounding quotes
    value = value.replace(/^(['"`])([\s\S]*)\1$/mg, '$2')

    // Expand newlines if double quoted
    if (maybeQuote === '"') {
      value = value.replace(/\\n/g, '\n')
      value = value.replace(/\\r/g, '\r')
    }

    // Add to object
    obj[key] = value
  }

  return obj
}

function _parseVault (options) {
  options = options || {}

  const vaultPath = _vaultPath(options)
  options.path = vaultPath // parse .env.vault
  const result = DotenvModule.configDotenv(options)
  if (!result.parsed) {
    const err = new Error(`MISSING_DATA: Cannot parse ${vaultPath} for an unknown reason`)
    err.code = 'MISSING_DATA'
    throw err
  }

  // handle scenario for comma separated keys - for use with key rotation
  // example: DOTENV_KEY="dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=prod,dotenv://:key_7890@dotenvx.com/vault/.env.vault?environment=prod"
  const keys = _dotenvKey(options).split(',')
  const length = keys.length

  let decrypted
  for (let i = 0; i < length; i++) {
    try {
      // Get full key
      const key = keys[i].trim()

      // Get instructions for decrypt
      const attrs = _instructions(result, key)

      // Decrypt
      decrypted = DotenvModule.decrypt(attrs.ciphertext, attrs.key)

      break
    } catch (error) {
      // last key
      if (i + 1 >= length) {
        throw error
      }
      // try next key
    }
  }

  // Parse decrypted .env string
  return DotenvModule.parse(decrypted)
}

function _warn (message) {
  console.error(`⚠ ${message}`)
}

function _debug (message) {
  console.log(`┆ ${message}`)
}

function _log (message) {
  console.log(`◇ ${message}`)
}

function _dotenvKey (options) {
  // prioritize developer directly setting options.DOTENV_KEY
  if (options && options.DOTENV_KEY && options.DOTENV_KEY.length > 0) {
    return options.DOTENV_KEY
  }

  // secondary infra already contains a DOTENV_KEY environment variable
  if (process.env.DOTENV_KEY && process.env.DOTENV_KEY.length > 0) {
    return process.env.DOTENV_KEY
  }

  // fallback to empty string
  return ''
}

function _instructions (result, dotenvKey) {
  // Parse DOTENV_KEY. Format is a URI
  let uri
  try {
    uri = new URL(dotenvKey)
  } catch (error) {
    if (error.code === 'ERR_INVALID_URL') {
      const err = new Error('INVALID_DOTENV_KEY: Wrong format. Must be in valid uri format like dotenv://:key_1234@dotenvx.com/vault/.env.vault?environment=development')
      err.code = 'INVALID_DOTENV_KEY'
      throw err
    }

    throw error
  }

  // Get decrypt key
  const key = uri.password
  if (!key) {
    const err = new Error('INVALID_DOTENV_KEY: Missing key part')
    err.code = 'INVALID_DOTENV_KEY'
    throw err
  }

  // Get environment
  const environment = uri.searchParams.get('environment')
  if (!environment) {
    const err = new Error('INVALID_DOTENV_KEY: Missing environment part')
    err.code = 'INVALID_DOTENV_KEY'
    throw err
  }

  // Get ciphertext payload
  const environmentKey = `DOTENV_VAULT_${environment.toUpperCase()}`
  const ciphertext = result.parsed[environmentKey] // DOTENV_VAULT_PRODUCTION
  if (!ciphertext) {
    const err = new Error(`NOT_FOUND_DOTENV_ENVIRONMENT: Cannot locate environment ${environmentKey} in your .env.vault file.`)
    err.code = 'NOT_FOUND_DOTENV_ENVIRONMENT'
    throw err
  }

  return { ciphertext, key }
}

function _vaultPath (options) {
  let possibleVaultPath = null

  if (options && options.path && options.path.length > 0) {
    if (Array.isArray(options.path)) {
      for (const filepath of options.path) {
        if (fs.existsSync(filepath)) {
          possibleVaultPath = filepath.endsWith('.vault') ? filepath : `${filepath}.vault`
        }
      }
    } else {
      possibleVaultPath = options.path.endsWith('.vault') ? options.path : `${options.path}.vault`
    }
  } else {
    possibleVaultPath = path.resolve(process.cwd(), '.env.vault')
  }

  if (fs.existsSync(possibleVaultPath)) {
    return possibleVaultPath
  }

  return null
}

function _resolveHome (envPath) {
  return envPath[0] === '~' ? path.join(os.homedir(), envPath.slice(1)) : envPath
}

function _configVault (options) {
  const debug = parseBoolean(process.env.DOTENV_CONFIG_DEBUG || (options && options.debug))
  const quiet = parseBoolean(process.env.DOTENV_CONFIG_QUIET || (options && options.quiet))

  if (debug || !quiet) {
    _log('loading env from encrypted .env.vault')
  }

  const parsed = DotenvModule._parseVault(options)

  let processEnv = process.env
  if (options && options.processEnv != null) {
    processEnv = options.processEnv
  }

  DotenvModule.populate(processEnv, parsed, options)

  return { parsed }
}

function configDotenv (options) {
  const dotenvPath = path.resolve(process.cwd(), '.env')
  let encoding = 'utf8'
  let processEnv = process.env
  if (options && options.processEnv != null) {
    processEnv = options.processEnv
  }
  let debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || (options && options.debug))
  let quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || (options && options.quiet))

  if (options && options.encoding) {
    encoding = options.encoding
  } else {
    if (debug) {
      _debug('no encoding is specified (UTF-8 is used by default)')
    }
  }

  let optionPaths = [dotenvPath] // default, look for .env
  if (options && options.path) {
    if (!Array.isArray(options.path)) {
      optionPaths = [_resolveHome(options.path)]
    } else {
      optionPaths = [] // reset default
      for (const filepath of options.path) {
        optionPaths.push(_resolveHome(filepath))
      }
    }
  }

  // Build the parsed data in a temporary object (because we need to return it).  Once we have the final
  // parsed data, we will combine it with process.env (or options.processEnv if provided).
  let lastError
  const parsedAll = {}
  for (const path of optionPaths) {
    try {
      // Specifying an encoding returns a string instead of a buffer
      const parsed = DotenvModule.parse(fs.readFileSync(path, { encoding }))

      DotenvModule.populate(parsedAll, parsed, options)
    } catch (e) {
      if (debug) {
        _debug(`failed to load ${path} ${e.message}`)
      }
      lastError = e
    }
  }

  const populated = DotenvModule.populate(processEnv, parsedAll, options)

  // handle user settings DOTENV_CONFIG_ options inside .env file(s)
  debug = parseBoolean(processEnv.DOTENV_CONFIG_DEBUG || debug)
  quiet = parseBoolean(processEnv.DOTENV_CONFIG_QUIET || quiet)

  if (debug || !quiet) {
    const keysCount = Object.keys(populated).length
    const shortPaths = []
    for (const filePath of optionPaths) {
      try {
        const relative = path.relative(process.cwd(), filePath)
        shortPaths.push(relative)
      } catch (e) {
        if (debug) {
          _debug(`failed to load ${filePath} ${e.message}`)
        }
        lastError = e
      }
    }

    _log(`injected env (${keysCount}) from ${shortPaths.join(',')} ${dim(`// tip: ${_getRandomTip()}`)}`)
  }

  if (lastError) {
    return { parsed: parsedAll, error: lastError }
  } else {
    return { parsed: parsedAll }
  }
}

// Populates process.env from .env file
function config (options) {
  // fallback to original dotenv if DOTENV_KEY is not set
  if (_dotenvKey(options).length === 0) {
    return DotenvModule.configDotenv(options)
  }

  const vaultPath = _vaultPath(options)

  // dotenvKey exists but .env.vault file does not exist
  if (!vaultPath) {
    _warn(`you set DOTENV_KEY but you are missing a .env.vault file at ${vaultPath}`)

    return DotenvModule.configDotenv(options)
  }

  return DotenvModule._configVault(options)
}

function decrypt (encrypted, keyStr) {
  const key = Buffer.from(keyStr.slice(-64), 'hex')
  let ciphertext = Buffer.from(encrypted, 'base64')

  const nonce = ciphertext.subarray(0, 12)
  const authTag = ciphertext.subarray(-16)
  ciphertext = ciphertext.subarray(12, -16)

  try {
    const aesgcm = crypto.createDecipheriv('aes-256-gcm', key, nonce)
    aesgcm.setAuthTag(authTag)
    return `${aesgcm.update(ciphertext)}${aesgcm.final()}`
  } catch (error) {
    const isRange = error instanceof RangeError
    const invalidKeyLength = error.message === 'Invalid key length'
    const decryptionFailed = error.message === 'Unsupported state or unable to authenticate data'

    if (isRange || invalidKeyLength) {
      const err = new Error('INVALID_DOTENV_KEY: It must be 64 characters long (or more)')
      err.code = 'INVALID_DOTENV_KEY'
      throw err
    } else if (decryptionFailed) {
      const err = new Error('DECRYPTION_FAILED: Please check your DOTENV_KEY')
      err.code = 'DECRYPTION_FAILED'
      throw err
    } else {
      throw error
    }
  }
}

// Populate process.env with parsed values
function populate (processEnv, parsed, options = {}) {
  const debug = Boolean(options && options.debug)
  const override = Boolean(options && options.override)
  const populated = {}

  if (typeof parsed !== 'object') {
    const err = new Error('OBJECT_REQUIRED: Please check the processEnv argument being passed to populate')
    err.code = 'OBJECT_REQUIRED'
    throw err
  }

  // Set process.env
  for (const key of Object.keys(parsed)) {
    if (Object.prototype.hasOwnProperty.call(processEnv, key)) {
      if (override === true) {
        processEnv[key] = parsed[key]
        populated[key] = parsed[key]
      }

      if (debug) {
        if (override === true) {
          _debug(`"${key}" is already defined and WAS overwritten`)
        } else {
          _debug(`"${key}" is already defined and was NOT overwritten`)
        }
      }
    } else {
      processEnv[key] = parsed[key]
      populated[key] = parsed[key]
    }
  }

  return populated
}

const DotenvModule = {
  configDotenv,
  _configVault,
  _parseVault,
  config,
  decrypt,
  parse,
  populate
}

module.exports.configDotenv = DotenvModule.configDotenv
module.exports._configVault = DotenvModule._configVault
module.exports._parseVault = DotenvModule._parseVault
module.exports.config = DotenvModule.config
module.exports.decrypt = DotenvModule.decrypt
module.exports.parse = DotenvModule.parse
module.exports.populate = DotenvModule.populate

module.exports = DotenvModule


/***/ },

/***/ "./node_modules/file-uri-to-path/index.js"
/*!************************************************!*\
  !*** ./node_modules/file-uri-to-path/index.js ***!
  \************************************************/
(module, __unused_webpack_exports, __webpack_require__) {


/**
 * Module dependencies.
 */

var sep = (__webpack_require__(/*! path */ "path").sep) || '/';

/**
 * Module exports.
 */

module.exports = fileUriToPath;

/**
 * File URI to Path function.
 *
 * @param {String} uri
 * @return {String} path
 * @api public
 */

function fileUriToPath (uri) {
  if ('string' != typeof uri ||
      uri.length <= 7 ||
      'file://' != uri.substring(0, 7)) {
    throw new TypeError('must pass in a file:// URI to convert to a file path');
  }

  var rest = decodeURI(uri.substring(7));
  var firstSlash = rest.indexOf('/');
  var host = rest.substring(0, firstSlash);
  var path = rest.substring(firstSlash + 1);

  // 2.  Scheme Definition
  // As a special case, <host> can be the string "localhost" or the empty
  // string; this is interpreted as "the machine from which the URL is
  // being interpreted".
  if ('localhost' == host) host = '';

  if (host) {
    host = sep + sep + host;
  }

  // 3.2  Drives, drive letters, mount points, file system root
  // Drive letters are mapped into the top of a file URI in various ways,
  // depending on the implementation; some applications substitute
  // vertical bar ("|") for the colon after the drive letter, yielding
  // "file:///c|/tmp/test.txt".  In some cases, the colon is left
  // unchanged, as in "file:///c:/tmp/test.txt".  In other cases, the
  // colon is simply omitted, as in "file:///c/tmp/test.txt".
  path = path.replace(/^(.+)\|/, '$1:');

  // for Windows, we need to invert the path separators from what a URI uses
  if (sep == '\\') {
    path = path.replace(/\//g, '\\');
  }

  if (/^.+\:/.test(path)) {
    // has Windows drive at beginning of path
  } else {
    // unix path…
    path = sep + path;
  }

  return host + path;
}


/***/ },

/***/ "./node_modules/papaparse/papaparse.js"
/*!*********************************************!*\
  !*** ./node_modules/papaparse/papaparse.js ***!
  \*********************************************/
(module, exports, __webpack_require__) {

var __WEBPACK_AMD_DEFINE_FACTORY__, __WEBPACK_AMD_DEFINE_ARRAY__, __WEBPACK_AMD_DEFINE_RESULT__;/* @license
Papa Parse
v5.5.4
https://github.com/mholt/PapaParse
License: MIT
*/

(function(root, factory)
{
	/* globals define */
	if (true)
	{
		// AMD. Register as an anonymous module.
		!(__WEBPACK_AMD_DEFINE_ARRAY__ = [], __WEBPACK_AMD_DEFINE_FACTORY__ = (factory),
		__WEBPACK_AMD_DEFINE_RESULT__ = (typeof __WEBPACK_AMD_DEFINE_FACTORY__ === 'function' ?
		(__WEBPACK_AMD_DEFINE_FACTORY__.apply(exports, __WEBPACK_AMD_DEFINE_ARRAY__)) : __WEBPACK_AMD_DEFINE_FACTORY__),
		__WEBPACK_AMD_DEFINE_RESULT__ !== undefined && (module.exports = __WEBPACK_AMD_DEFINE_RESULT__));
	}
	else // removed by dead control flow
{}
	// in strict mode we cannot access arguments.callee, so we need a named reference to
	// stringify the factory method for the blob worker
	// eslint-disable-next-line func-name
}(this, function moduleFactory()
{
	'use strict';

	var global = (function() {
		// alternative method, similar to `Function('return this')()`
		// but without using `eval` (which is disabled when
		// using Content Security Policy).

		if (typeof self !== 'undefined') { return self; }
		if (typeof window !== 'undefined') { return window; }
		if (typeof global !== 'undefined') { return global; }

		// When running tests none of the above have been defined
		return {};
	})();


	function getWorkerBlob() {
		var URL = global.URL || global.webkitURL || null;
		var code = moduleFactory.toString();
		return Papa.BLOB_URL || (Papa.BLOB_URL = URL.createObjectURL(new Blob(["var global = (function() { if (typeof self !== 'undefined') { return self; } if (typeof window !== 'undefined') { return window; } if (typeof global !== 'undefined') { return global; } return {}; })(); global.IS_PAPA_WORKER=true; ", '(', code, ')();'], {type: 'text/javascript'})));
	}

	var IS_WORKER = !global.document && !!global.postMessage,
		IS_PAPA_WORKER = global.IS_PAPA_WORKER || false;

	var workers = {}, workerIdCounter = 0;

	var Papa = {};

	Papa.parse = CsvToJson;
	Papa.unparse = JsonToCsv;

	Papa.RECORD_SEP = String.fromCharCode(30);
	Papa.UNIT_SEP = String.fromCharCode(31);
	Papa.BYTE_ORDER_MARK = '\ufeff';
	Papa.BAD_DELIMITERS = ['\r', '\n', '"', Papa.BYTE_ORDER_MARK];
	Papa.WORKERS_SUPPORTED = !IS_WORKER && !!global.Worker;
	Papa.NODE_STREAM_INPUT = 1;

	// Configurable chunk sizes for local and remote files, respectively
	Papa.LocalChunkSize = 1024 * 1024 * 10;	// 10 MB
	Papa.RemoteChunkSize = 1024 * 1024 * 5;	// 5 MB
	Papa.DefaultDelimiter = ',';			// Used if not specified and detection fails

	// Exposed for testing and development only
	Papa.Parser = Parser;
	Papa.ParserHandle = ParserHandle;
	Papa.NetworkStreamer = NetworkStreamer;
	Papa.FileStreamer = FileStreamer;
	Papa.StringStreamer = StringStreamer;
	Papa.ReadableStreamStreamer = ReadableStreamStreamer;
	if (typeof PAPA_BROWSER_CONTEXT === 'undefined') {
		Papa.DuplexStreamStreamer = DuplexStreamStreamer;
	}

	if (global.jQuery)
	{
		var $ = global.jQuery;
		$.fn.parse = function(options)
		{
			var config = options.config || {};
			var queue = [];

			this.each(function(idx)
			{
				var supported = $(this).prop('tagName').toUpperCase() === 'INPUT'
								&& $(this).attr('type').toLowerCase() === 'file'
								&& global.FileReader;

				if (!supported || !this.files || this.files.length === 0)
					return true;	// continue to next input element

				for (var i = 0; i < this.files.length; i++)
				{
					queue.push({
						file: this.files[i],
						inputElem: this,
						instanceConfig: $.extend({}, config)
					});
				}
			});

			parseNextFile();	// begin parsing
			return this;		// maintains chainability


			function parseNextFile()
			{
				if (queue.length === 0)
				{
					if (isFunction(options.complete))
						options.complete();
					return;
				}

				var f = queue[0];

				if (isFunction(options.before))
				{
					var returned = options.before(f.file, f.inputElem);

					if (typeof returned === 'object')
					{
						if (returned.action === 'abort')
						{
							error('AbortError', f.file, f.inputElem, returned.reason);
							return;	// Aborts all queued files immediately
						}
						else if (returned.action === 'skip')
						{
							fileComplete();	// parse the next file in the queue, if any
							return;
						}
						else if (typeof returned.config === 'object')
							f.instanceConfig = $.extend(f.instanceConfig, returned.config);
					}
					else if (returned === 'skip')
					{
						fileComplete();	// parse the next file in the queue, if any
						return;
					}
				}

				// Wrap up the user's complete callback, if any, so that ours also gets executed
				var userCompleteFunc = f.instanceConfig.complete;
				f.instanceConfig.complete = function(results)
				{
					if (isFunction(userCompleteFunc))
						userCompleteFunc(results, f.file, f.inputElem);
					fileComplete();
				};

				Papa.parse(f.file, f.instanceConfig);
			}

			function error(name, file, elem, reason)
			{
				if (isFunction(options.error))
					options.error({name: name}, file, elem, reason);
			}

			function fileComplete()
			{
				queue.splice(0, 1);
				parseNextFile();
			}
		};
	}


	if (IS_PAPA_WORKER)
	{
		global.onmessage = workerThreadReceivedMessage;
	}

	// Strip character from UTF-8 BOM encoded files that cause issue parsing the file
	function stripBom(string) {
		if (string.charCodeAt(0) === 0xfeff) {
			return string.slice(1);
		}
		return string;
	}

	function CsvToJson(_input, _config)
	{
		_config = _config || {};
		var dynamicTyping = _config.dynamicTyping || false;
		if (isFunction(dynamicTyping)) {
			_config.dynamicTypingFunction = dynamicTyping;
			// Will be filled on first row call
			dynamicTyping = {};
		}
		_config.dynamicTyping = dynamicTyping;

		_config.transform = isFunction(_config.transform) ? _config.transform : false;

		if (_config.worker && Papa.WORKERS_SUPPORTED)
		{
			var w = newWorker();

			w.userStep = _config.step;
			w.userChunk = _config.chunk;
			w.userComplete = _config.complete;
			w.userError = _config.error;

			_config.step = isFunction(_config.step);
			_config.chunk = isFunction(_config.chunk);
			_config.complete = isFunction(_config.complete);
			_config.error = isFunction(_config.error);
			delete _config.worker;	// prevent infinite loop

			w.postMessage({
				input: _input,
				config: _config,
				workerId: w.id
			});

			return;
		}

		var streamer = null;
		if (_input === Papa.NODE_STREAM_INPUT && typeof PAPA_BROWSER_CONTEXT === 'undefined')
		{
			// create a node Duplex stream for use
			// with .pipe
			streamer = new DuplexStreamStreamer(_config);
			return streamer.getStream();
		}
		else if (typeof _input === 'string')
		{
			_input = stripBom(_input);
			if (_config.download)
				streamer = new NetworkStreamer(_config);
			else
				streamer = new StringStreamer(_config);
		}
		else if (_input.readable === true && isFunction(_input.read) && isFunction(_input.on))
		{
			streamer = new ReadableStreamStreamer(_config);
		}
		else if ((global.File && _input instanceof File) || _input instanceof Object)	// ...Safari. (see issue #106)
			streamer = new FileStreamer(_config);

		return streamer.stream(_input);
	}






	function JsonToCsv(_input, _config)
	{
		// Default configuration

		/** whether to surround every datum with quotes */
		var _quotes = false;

		/** whether to write headers */
		var _writeHeader = true;

		/** delimiting character(s) */
		var _delimiter = ',';

		/** newline character(s) */
		var _newline = '\r\n';

		/** quote character */
		var _quoteChar = '"';

		/** escaped quote character, either "" or <config.escapeChar>" */
		var _escapedQuote = _quoteChar + _quoteChar;

		/** whether to skip empty lines */
		var _skipEmptyLines = false;

		/** the columns (keys) we expect when we unparse objects */
		var _columns = null;

		/** whether to prevent outputting cells that can be parsed as formulae by spreadsheet software (Excel and LibreOffice) */
		var _escapeFormulae = false;

		unpackConfig();

		var quoteCharRegex = new RegExp(escapeRegExp(_quoteChar), 'g');

		if (typeof _input === 'string')
			_input = JSON.parse(_input);

		if (Array.isArray(_input))
		{
			if (!_input.length || Array.isArray(_input[0]))
				return serialize(null, _input, _skipEmptyLines);
			else if (typeof _input[0] === 'object')
				return serialize(_columns || Object.keys(_input[0]), _input, _skipEmptyLines);
		}
		else if (typeof _input === 'object')
		{
			if (typeof _input.data === 'string')
				_input.data = JSON.parse(_input.data);

			if (Array.isArray(_input.data))
			{
				if (!_input.fields)
					_input.fields = _input.meta && _input.meta.fields || _columns;

				if (!_input.fields)
					_input.fields =  Array.isArray(_input.data[0])
						? _input.fields
						: typeof _input.data[0] === 'object'
							? Object.keys(_input.data[0])
							: [];

				if (!(Array.isArray(_input.data[0])) && typeof _input.data[0] !== 'object')
					_input.data = [_input.data];	// handles input like [1,2,3] or ['asdf']
			}

			return serialize(_input.fields || [], _input.data || [], _skipEmptyLines);
		}

		// Default (any valid paths should return before this)
		throw new Error('Unable to serialize unrecognized input');


		function unpackConfig()
		{
			if (typeof _config !== 'object')
				return;

			if (typeof _config.delimiter === 'string'
                && !Papa.BAD_DELIMITERS.filter(function(value) { return _config.delimiter.indexOf(value) !== -1; }).length)
			{
				_delimiter = _config.delimiter;
			}

			if (typeof _config.quotes === 'boolean'
				|| typeof _config.quotes === 'function'
				|| Array.isArray(_config.quotes))
				_quotes = _config.quotes;

			if (typeof _config.skipEmptyLines === 'boolean'
				|| typeof _config.skipEmptyLines === 'string')
				_skipEmptyLines = _config.skipEmptyLines;

			if (typeof _config.newline === 'string')
				_newline = _config.newline;

			if (typeof _config.quoteChar === 'string') {
				_quoteChar = _config.quoteChar;
				_escapedQuote = _quoteChar + _quoteChar;
			}

			if (typeof _config.header === 'boolean')
				_writeHeader = _config.header;

			if (Array.isArray(_config.columns)) {

				if (_config.columns.length === 0) throw new Error('Option columns is empty');

				_columns = _config.columns;
			}

			if (_config.escapeChar !== undefined) {
				_escapedQuote = _config.escapeChar + _quoteChar;
			}

			if (_config.escapeFormulae instanceof RegExp) {
				_escapeFormulae = _config.escapeFormulae;
			} else if (typeof _config.escapeFormulae === 'boolean' && _config.escapeFormulae) {
				_escapeFormulae =  /^[=+\-@\t\r].*$/;
			}
		}

		/** The double for loop that iterates the data and writes out a CSV string including header row */
		function serialize(fields, data, skipEmptyLines)
		{
			var csv = '';

			if (typeof fields === 'string')
				fields = JSON.parse(fields);
			if (typeof data === 'string')
				data = JSON.parse(data);

			var hasHeader = Array.isArray(fields) && fields.length > 0;
			var dataKeyedByField = !(Array.isArray(data[0]));

			// If there a header row, write it first
			if (hasHeader && _writeHeader)
			{
				for (var i = 0; i < fields.length; i++)
				{
					if (i > 0)
						csv += _delimiter;
					csv += safe(fields[i], i);
				}
				if (data.length > 0)
					csv += _newline;
			}

			// Then write out the data
			for (var row = 0; row < data.length; row++)
			{
				var maxCol = hasHeader ? fields.length : data[row].length;

				var emptyLine = false;
				var nullLine = hasHeader ? Object.keys(data[row]).length === 0 : data[row].length === 0;
				if (skipEmptyLines && !hasHeader)
				{
					emptyLine = skipEmptyLines === 'greedy' ? data[row].join('').trim() === '' : data[row].length === 1 && data[row][0].length === 0;
				}
				if (skipEmptyLines === 'greedy' && hasHeader) {
					var line = [];
					for (var c = 0; c < maxCol; c++) {
						var cx = dataKeyedByField ? fields[c] : c;
						line.push(data[row][cx]);
					}
					emptyLine = line.join('').trim() === '';
				}
				if (!emptyLine)
				{
					for (var col = 0; col < maxCol; col++)
					{
						if (col > 0 && !nullLine)
							csv += _delimiter;
						var colIdx = hasHeader && dataKeyedByField ? fields[col] : col;
						csv += safe(data[row][colIdx], col);
					}
					if (row < data.length - 1 && (!skipEmptyLines || (maxCol > 0 && !nullLine)))
					{
						csv += _newline;
					}
				}
			}
			return csv;
		}

		/** Encloses a value around quotes if needed (makes a value safe for CSV insertion) */
		function safe(str, col)
		{
			if (typeof str === 'undefined' || str === null)
				return '';

			if (str.constructor === Date)
				return JSON.stringify(str).slice(1, 25);

			var needsQuotes = false;

			if (_escapeFormulae && typeof str === "string" && _escapeFormulae.test(str)) {
				str = "'" + str;
				needsQuotes = true;
			}

			var strValue = str.toString();
			var escapedQuoteStr = strValue.replace(quoteCharRegex, _escapedQuote);

			needsQuotes = needsQuotes
							|| _quotes === true
							|| (typeof _quotes === 'function' && _quotes(str, col))
							|| (Array.isArray(_quotes) && _quotes[col])
							|| hasAny(escapedQuoteStr, Papa.BAD_DELIMITERS)
							|| escapedQuoteStr.indexOf(_delimiter) > -1
							|| strValue.indexOf(_quoteChar) > -1
							|| escapedQuoteStr.charAt(0) === ' '
							|| escapedQuoteStr.charAt(escapedQuoteStr.length - 1) === ' ';

			return needsQuotes ? _quoteChar + escapedQuoteStr + _quoteChar : escapedQuoteStr;
		}

		function hasAny(str, substrings)
		{
			for (var i = 0; i < substrings.length; i++)
				if (str.indexOf(substrings[i]) > -1)
					return true;
			return false;
		}
	}


	/** ChunkStreamer is the base prototype for various streamer implementations. */
	function ChunkStreamer(config)
	{
		this._handle = null;
		this._finished = false;
		this._completed = false;
		this._halted = false;
		this._input = null;
		this._baseIndex = 0;
		this._partialLine = '';
		this._rowCount = 0;
		this._start = 0;
		this._nextChunk = null;
		this.isFirstChunk = true;
		this._completeResults = {
			data: [],
			errors: [],
			meta: {}
		};
		replaceConfig.call(this, config);

		this.parseChunk = function(chunk, isFakeChunk)
		{
			// First chunk pre-processing
			const skipFirstNLines = parseInt(this._config.skipFirstNLines) || 0;
			if (this.isFirstChunk && skipFirstNLines > 0) {
				let _newline = this._config.newline;
				if (!_newline) {
					const quoteChar = this._config.quoteChar || '"';
					_newline = this._handle.guessLineEndings(chunk, quoteChar);
				}
				const splitChunk = chunk.split(_newline);
				chunk = [...splitChunk.slice(skipFirstNLines)].join(_newline);
			}
			if (this.isFirstChunk && isFunction(this._config.beforeFirstChunk))
			{
				var modifiedChunk = this._config.beforeFirstChunk(chunk);
				if (modifiedChunk !== undefined)
					chunk = modifiedChunk;
			}
			this.isFirstChunk = false;
			this._halted = false;

			// Rejoin the line we likely just split in two by chunking the file
			var aggregate = this._partialLine + chunk;
			this._partialLine = '';
			var results = this._handle.parse(aggregate, this._baseIndex, !this._finished);

			if (this._handle.paused() || this._handle.aborted()) {
				this._halted = true;
				return;
			}

			var lastIndex = results.meta.cursor;

			if (!this._finished)
			{
				this._partialLine = aggregate.substring(lastIndex - this._baseIndex);
				this._baseIndex = lastIndex;
			}

			if (results && results.data)
				this._rowCount += results.data.length;

			var finishedIncludingPreview = this._finished || (this._config.preview && this._rowCount >= this._config.preview);

			if (IS_PAPA_WORKER)
			{
				global.postMessage({
					results: results,
					workerId: Papa.WORKER_ID,
					finished: finishedIncludingPreview
				});
			}
			else if (isFunction(this._config.chunk) && !isFakeChunk)
			{
				this._config.chunk(results, this._handle);
				if (this._handle.paused() || this._handle.aborted()) {
					this._halted = true;
					return;
				}
				results = undefined;
				this._completeResults = undefined;
			}

			if (!this._config.step && !this._config.chunk) {
				this._completeResults.data = this._completeResults.data.concat(results.data);
				this._completeResults.errors = this._completeResults.errors.concat(results.errors);
				this._completeResults.meta = results.meta;
			}

			if (!this._completed && finishedIncludingPreview && isFunction(this._config.complete) && (!results || !results.meta.aborted)) {
				this._config.complete(this._completeResults, this._input);
				this._completed = true;
			}

			if (!finishedIncludingPreview && (!results || !results.meta.paused))
				this._nextChunk();

			return results;
		};

		this._sendError = function(error)
		{
			if (isFunction(this._config.error))
				this._config.error(error);
			else if (IS_PAPA_WORKER && this._config.error)
			{
				global.postMessage({
					workerId: Papa.WORKER_ID,
					error: error,
					finished: false
				});
			}
		};

		function replaceConfig(config)
		{
			// Deep-copy the config so we can edit it
			var configCopy = copy(config);
			configCopy.chunkSize = parseInt(configCopy.chunkSize);	// parseInt VERY important so we don't concatenate strings!
			if (!config.step && !config.chunk)
				configCopy.chunkSize = null;  // disable Range header if not streaming; bad values break IIS - see issue #196
			this._handle = new ParserHandle(configCopy);
			this._handle.streamer = this;
			this._config = configCopy;	// persist the copy to the caller
		}
	}


	function NetworkStreamer(config)
	{
		config = config || {};
		if (!config.chunkSize)
			config.chunkSize = Papa.RemoteChunkSize;
		ChunkStreamer.call(this, config);

		var xhr;

		if (IS_WORKER)
		{
			this._nextChunk = function()
			{
				this._readChunk();
				this._chunkLoaded();
			};
		}
		else
		{
			this._nextChunk = function()
			{
				this._readChunk();
			};
		}

		this.stream = function(url)
		{
			this._input = url;
			this._nextChunk();	// Starts streaming
		};

		this._readChunk = function()
		{
			if (this._finished)
			{
				this._chunkLoaded();
				return;
			}

			xhr = new XMLHttpRequest();

			if (this._config.withCredentials)
			{
				xhr.withCredentials = this._config.withCredentials;
			}

			if (!IS_WORKER)
			{
				xhr.onload = bindFunction(this._chunkLoaded, this);
				xhr.onerror = bindFunction(this._chunkError, this);
			}

			xhr.open(this._config.downloadRequestBody ? 'POST' : 'GET', this._input, !IS_WORKER);
			// Headers can only be set when once the request state is OPENED
			if (this._config.downloadRequestHeaders)
			{
				var headers = this._config.downloadRequestHeaders;

				for (var headerName in headers)
				{
					xhr.setRequestHeader(headerName, headers[headerName]);
				}
			}

			if (this._config.chunkSize)
			{
				var end = this._start + this._config.chunkSize - 1;	// minus one because byte range is inclusive
				xhr.setRequestHeader('Range', 'bytes=' + this._start + '-' + end);
			}

			try {
				xhr.send(this._config.downloadRequestBody);
			}
			catch (err) {
				this._chunkError(err.message);
			}

			if (IS_WORKER && xhr.status === 0)
				this._chunkError();
		};

		this._chunkLoaded = function()
		{
			if (xhr.readyState !== 4)
				return;

			if (xhr.status < 200 || xhr.status >= 400)
			{
				this._chunkError();
				return;
			}

			// Use chunckSize as it may be a diference on reponse lentgh due to characters with more than 1 byte
			this._start += this._config.chunkSize ? this._config.chunkSize : xhr.responseText.length;
			this._finished = !this._config.chunkSize || this._start >= getFileSize(xhr);
			this.parseChunk(xhr.responseText);
		};

		this._chunkError = function(errorMessage)
		{
			var errorText = xhr.statusText || errorMessage;
			this._sendError(new Error(errorText));
		};

		function getFileSize(xhr)
		{
			var contentRange = xhr.getResponseHeader('Content-Range');
			if (contentRange === null) { // no content range, then finish!
				return -1;
			}
			return parseInt(contentRange.substring(contentRange.lastIndexOf('/') + 1));
		}
	}
	NetworkStreamer.prototype = Object.create(ChunkStreamer.prototype);
	NetworkStreamer.prototype.constructor = NetworkStreamer;


	function FileStreamer(config)
	{
		config = config || {};
		if (!config.chunkSize)
			config.chunkSize = Papa.LocalChunkSize;
		ChunkStreamer.call(this, config);

		var reader, slice;

		// FileReader is better than FileReaderSync (even in worker) - see http://stackoverflow.com/q/24708649/1048862
		// But Firefox is a pill, too - see issue #76: https://github.com/mholt/PapaParse/issues/76
		var usingAsyncReader = typeof FileReader !== 'undefined';	// Safari doesn't consider it a function - see issue #105

		this.stream = function(file)
		{
			this._input = file;
			slice = file.slice || file.webkitSlice || file.mozSlice;

			if (usingAsyncReader)
			{
				reader = new FileReader();		// Preferred method of reading files, even in workers
				reader.onload = bindFunction(this._chunkLoaded, this);
				reader.onerror = bindFunction(this._chunkError, this);
			}
			else
				reader = new FileReaderSync();	// Hack for running in a web worker in Firefox

			this._nextChunk();	// Starts streaming
		};

		this._nextChunk = function()
		{
			if (!this._finished && (!this._config.preview || this._rowCount < this._config.preview))
				this._readChunk();
		};

		this._readChunk = function()
		{
			var input = this._input;
			if (this._config.chunkSize)
			{
				var end = Math.min(this._start + this._config.chunkSize, this._input.size);
				input = slice.call(input, this._start, end);
			}
			var txt = reader.readAsText(input, this._config.encoding);
			if (!usingAsyncReader)
				this._chunkLoaded({ target: { result: txt } });	// mimic the async signature
		};

		this._chunkLoaded = function(event)
		{
			// Very important to increment start each time before handling results
			this._start += this._config.chunkSize;
			this._finished = !this._config.chunkSize || this._start >= this._input.size;
			this.parseChunk(event.target.result);
		};

		this._chunkError = function()
		{
			this._sendError(reader.error);
		};

	}
	FileStreamer.prototype = Object.create(ChunkStreamer.prototype);
	FileStreamer.prototype.constructor = FileStreamer;


	function StringStreamer(config)
	{
		config = config || {};
		ChunkStreamer.call(this, config);

		var remaining;
		this.stream = function(s)
		{
			remaining = s;
			return this._nextChunk();
		};
		this._nextChunk = function()
		{
			if (this._finished) return;
			var size = this._config.chunkSize;
			var chunk;
			if(size) {
				chunk = remaining.substring(0, size);
				remaining = remaining.substring(size);
			} else {
				chunk = remaining;
				remaining = '';
			}
			this._finished = !remaining;
			return this.parseChunk(chunk);
		};
	}
	StringStreamer.prototype = Object.create(StringStreamer.prototype);
	StringStreamer.prototype.constructor = StringStreamer;


	function ReadableStreamStreamer(config)
	{
		config = config || {};

		ChunkStreamer.call(this, config);

		var queue = [];
		var parseOnData = true;
		var streamHasEnded = false;

		this.pause = function()
		{
			ChunkStreamer.prototype.pause.apply(this, arguments);
			this._input.pause();
		};

		this.resume = function()
		{
			ChunkStreamer.prototype.resume.apply(this, arguments);
			this._input.resume();
		};

		this.stream = function(stream)
		{
			this._input = stream;

			this._input.on('data', this._streamData);
			this._input.on('end', this._streamEnd);
			this._input.on('error', this._streamError);
		};

		this._checkIsFinished = function()
		{
			if (streamHasEnded && queue.length === 1) {
				this._finished = true;
			}
		};

		this._nextChunk = function()
		{
			this._checkIsFinished();
			if (queue.length)
			{
				this.parseChunk(queue.shift());
			}
			else
			{
				parseOnData = true;
			}
		};

		this._streamData = bindFunction(function(chunk)
		{
			try
			{
				queue.push(typeof chunk === 'string' ? chunk : chunk.toString(this._config.encoding));

				if (parseOnData)
				{
					parseOnData = false;
					this._checkIsFinished();
					this.parseChunk(queue.shift());
				}
			}
			catch (error)
			{
				this._streamError(error);
			}
		}, this);

		this._streamError = bindFunction(function(error)
		{
			this._streamCleanUp();
			this._sendError(error);
		}, this);

		this._streamEnd = bindFunction(function()
		{
			this._streamCleanUp();
			streamHasEnded = true;
			this._streamData('');
		}, this);

		this._streamCleanUp = bindFunction(function()
		{
			this._input.removeListener('data', this._streamData);
			this._input.removeListener('end', this._streamEnd);
			this._input.removeListener('error', this._streamError);
		}, this);
	}
	ReadableStreamStreamer.prototype = Object.create(ChunkStreamer.prototype);
	ReadableStreamStreamer.prototype.constructor = ReadableStreamStreamer;


	function DuplexStreamStreamer(_config) {
		var Duplex = (__webpack_require__(/*! stream */ "stream").Duplex);
		var config = copy(_config);
		var parseOnWrite = true;
		var writeStreamHasFinished = false;
		var parseCallbackQueue = [];
		var stream = null;

		this._onCsvData = function(results)
		{
			var data = results.data;
			if (!stream.push(data) && !this._handle.paused()) {
				// the writeable consumer buffer has filled up
				// so we need to pause until more items
				// can be processed
				this._handle.pause();
			}
		};

		this._onCsvComplete = function()
		{
			// node will finish the read stream when
			// null is pushed
			stream.push(null);
		};

		config.step = bindFunction(this._onCsvData, this);
		config.complete = bindFunction(this._onCsvComplete, this);
		ChunkStreamer.call(this, config);

		this._nextChunk = function()
		{
			if (writeStreamHasFinished && parseCallbackQueue.length === 1) {
				this._finished = true;
			}
			if (parseCallbackQueue.length) {
				parseCallbackQueue.shift()();
			} else {
				parseOnWrite = true;
			}
		};

		this._addToParseQueue = function(chunk, callback)
		{
			// add to queue so that we can indicate
			// completion via callback
			// node will automatically pause the incoming stream
			// when too many items have been added without their
			// callback being invoked
			parseCallbackQueue.push(bindFunction(function() {
				this.parseChunk(typeof chunk === 'string' ? chunk : chunk.toString(config.encoding));
				if (isFunction(callback)) {
					return callback();
				}
			}, this));
			if (parseOnWrite) {
				parseOnWrite = false;
				this._nextChunk();
			}
		};

		this._onRead = function()
		{
			if (this._handle.paused()) {
				// the writeable consumer can handle more data
				// so resume the chunk parsing
				this._handle.resume();
			}
		};

		this._onWrite = function(chunk, encoding, callback)
		{
			this._addToParseQueue(chunk, callback);
		};

		this._onWriteComplete = function()
		{
			writeStreamHasFinished = true;
			// have to write empty string
			// so parser knows its done
			this._addToParseQueue('');
		};

		this.getStream = function()
		{
			return stream;
		};
		stream = new Duplex({
			readableObjectMode: true,
			decodeStrings: false,
			read: bindFunction(this._onRead, this),
			write: bindFunction(this._onWrite, this)
		});
		stream.once('finish', bindFunction(this._onWriteComplete, this));
	}
	if (typeof PAPA_BROWSER_CONTEXT === 'undefined') {
		DuplexStreamStreamer.prototype = Object.create(ChunkStreamer.prototype);
		DuplexStreamStreamer.prototype.constructor = DuplexStreamStreamer;
	}


	// Use one ParserHandle per entire CSV file or string
	function ParserHandle(_config)
	{
		// One goal is to minimize the use of regular expressions...
		var MAX_FLOAT = Math.pow(2, 53);
		var MIN_FLOAT = -MAX_FLOAT;
		var FLOAT = /^\s*-?(\d+\.?|\.\d+|\d+\.\d+)([eE][-+]?\d+)?\s*$/;
		var ISO_DATE = /^((\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z))|(\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d([+-][0-2]\d:[0-5]\d|Z)))$/;
		var self = this;
		var _stepCounter = 0;	// Number of times step was called (number of rows parsed)
		var _rowCounter = 0;	// Number of rows that have been parsed so far
		var _input;				// The input being parsed
		var _parser;			// The core parser being used
		var _paused = false;	// Whether we are paused or not
		var _aborted = false;	// Whether the parser has aborted or not
		var _delimiterError;	// Temporary state between delimiter detection and processing results
		var _fields = [];		// Fields are from the header row of the input, if there is one
		var _results = {		// The last results returned from the parser
			data: [],
			errors: [],
			meta: {}
		};

		if (isFunction(_config.step))
		{
			var userStep = _config.step;
			_config.step = function(results)
			{
				_results = results;

				if (needsHeaderRow())
					processResults();
				else	// only call user's step function after header row
				{
					processResults();

					// It's possbile that this line was empty and there's no row here after all
					if (_results.data.length === 0)
						return;

					_stepCounter += results.data.length;
					if (_config.preview && _stepCounter > _config.preview)
						_parser.abort();
					else {
						_results.data = _results.data[0];
						userStep(_results, self);
					}
				}
			};
		}

		/**
		 * Parses input. Most users won't need, and shouldn't mess with, the baseIndex
		 * and ignoreLastRow parameters. They are used by streamers (wrapper functions)
		 * when an input comes in multiple chunks, like from a file.
		 */
		this.parse = function(input, baseIndex, ignoreLastRow)
		{
			var quoteChar = _config.quoteChar || '"';
			if (!_config.newline)
				_config.newline = this.guessLineEndings(input, quoteChar);

			_delimiterError = false;
			if (!_config.delimiter)
			{
				var delimGuess = guessDelimiter(input, _config.newline, _config.skipEmptyLines, _config.comments, _config.delimitersToGuess);
				if (delimGuess.successful)
					_config.delimiter = delimGuess.bestDelimiter;
				else
				{
					_delimiterError = true;	// add error after parsing (otherwise it would be overwritten)
					_config.delimiter = Papa.DefaultDelimiter;
				}
				_results.meta.delimiter = _config.delimiter;
			}
			else if(isFunction(_config.delimiter))
			{
				_config.delimiter = _config.delimiter(input);
				_results.meta.delimiter = _config.delimiter;
			}

			var parserConfig = copy(_config);
			if (_config.preview && _config.header)
				parserConfig.preview++;	// to compensate for header row

			_input = input;
			_parser = new Parser(parserConfig);
			_results = _parser.parse(_input, baseIndex, ignoreLastRow);
			processResults();
			return _paused ? { meta: { paused: true } } : (_results || { meta: { paused: false } });
		};

		this.paused = function()
		{
			return _paused;
		};

		this.pause = function()
		{
			_paused = true;
			_parser.abort();

			// If it is streaming via "chunking", the reader will start appending correctly already so no need to substring,
			// otherwise we can get duplicate content within a row
			_input = isFunction(_config.chunk) ? "" : _input.substring(_parser.getCharIndex());
		};

		this.resume = function()
		{
			if(self.streamer._halted) {
				_paused = false;
				self.streamer.parseChunk(_input, true);
			} else {
				// Bugfix: #636 In case the processing hasn't halted yet
				// wait for it to halt in order to resume
				setTimeout(self.resume, 3);
			}
		};

		this.aborted = function()
		{
			return _aborted;
		};

		this.abort = function()
		{
			_aborted = true;
			_parser.abort();
			_results.meta.aborted = true;
			if (isFunction(_config.complete))
				_config.complete(_results);
			_input = '';
		};

		this.guessLineEndings = function(input, quoteChar)
		{
			input = input.substring(0, 1024 * 1024);	// max length 1 MB
			// Replace all the text inside quotes
			var re = new RegExp(escapeRegExp(quoteChar) + '([^]*?)' + escapeRegExp(quoteChar), 'gm');
			input = input.replace(re, '');

			var r = input.split('\r');

			var n = input.split('\n');

			var nAppearsFirst = (n.length > 1 && n[0].length < r[0].length);

			if (r.length === 1 || nAppearsFirst)
				return '\n';

			var numWithN = 0;
			for (var i = 0; i < r.length; i++)
			{
				if (r[i][0] === '\n')
					numWithN++;
			}

			return numWithN >= r.length / 2 ? '\r\n' : '\r';
		};

		function testEmptyLine(s) {
			return _config.skipEmptyLines === 'greedy' ? s.join('').trim() === '' : s.length === 1 && s[0].length === 0;
		}

		function testFloat(s) {
			if (FLOAT.test(s)) {
				var floatValue = parseFloat(s);
				if (floatValue > MIN_FLOAT && floatValue < MAX_FLOAT) {
					return true;
				}
			}
			return false;
		}

		function processResults()
		{
			if (_results && _delimiterError)
			{
				addError('Delimiter', 'UndetectableDelimiter', 'Unable to auto-detect delimiting character; defaulted to \'' + Papa.DefaultDelimiter + '\'');
				_delimiterError = false;
			}

			if (_config.skipEmptyLines)
			{
				_results.data = _results.data.filter(function(d) {
					return !testEmptyLine(d);
				});
			}

			if (needsHeaderRow())
				fillHeaderFields();

			return applyHeaderAndDynamicTypingAndTransformation();
		}

		function needsHeaderRow()
		{
			return _config.header && _fields.length === 0;
		}

		function fillHeaderFields()
		{
			if (!_results)
				return;

			function addHeader(header, i)
			{
				header = stripBom(header);
				if (isFunction(_config.transformHeader))
					header = _config.transformHeader(header, i);

				_fields.push(header);
			}

			if (Array.isArray(_results.data[0]))
			{
				for (var i = 0; needsHeaderRow() && i < _results.data.length; i++)
					_results.data[i].forEach(addHeader);

				_results.data.splice(0, 1);
			}
			// if _results.data[0] is not an array, we are in a step where _results.data is the row.
			else
				_results.data.forEach(addHeader);
		}

		function shouldApplyDynamicTyping(field) {
			// Cache function values to avoid calling it for each row
			if (_config.dynamicTypingFunction && _config.dynamicTyping[field] === undefined) {
				_config.dynamicTyping[field] = _config.dynamicTypingFunction(field);
			}
			return (_config.dynamicTyping[field] || _config.dynamicTyping) === true;
		}

		function parseDynamic(field, value)
		{
			if (shouldApplyDynamicTyping(field))
			{
				if (value === 'true' || value === 'TRUE')
					return true;
				else if (value === 'false' || value === 'FALSE')
					return false;
				else if (testFloat(value))
					return parseFloat(value);
				else if (ISO_DATE.test(value))
					return new Date(value);
				else
					return (value === '' ? null : value);
			}
			return value;
		}

		function applyHeaderAndDynamicTypingAndTransformation()
		{
			if (!_results || (!_config.header && !_config.dynamicTyping && !_config.transform))
				return _results;

			function processRow(rowSource, i)
			{
				var row = _config.header ? {} : [];

				var j;
				for (j = 0; j < rowSource.length; j++)
				{
					var field = j;
					var value = rowSource[j];

					if (_config.header)
						field = j >= _fields.length ? '__parsed_extra' : _fields[j];

					if (_config.transform)
						value = _config.transform(value,field);

					value = parseDynamic(field, value);

					if (field === '__parsed_extra')
					{
						row[field] = row[field] || [];
						row[field].push(value);
					}
					else
						row[field] = value;
				}


				if (_config.header)
				{
					if (j > _fields.length)
						addError('FieldMismatch', 'TooManyFields', 'Too many fields: expected ' + _fields.length + ' fields but parsed ' + j, _rowCounter + i);
					else if (j < _fields.length)
						addError('FieldMismatch', 'TooFewFields', 'Too few fields: expected ' + _fields.length + ' fields but parsed ' + j, _rowCounter + i);
				}

				return row;
			}

			var incrementBy = 1;
			if (!_results.data.length || Array.isArray(_results.data[0]))
			{
				_results.data = _results.data.map(processRow);
				incrementBy = _results.data.length;
			}
			else
				_results.data = processRow(_results.data, 0);


			if (_config.header && _results.meta)
				_results.meta.fields = _fields;

			_rowCounter += incrementBy;
			return _results;
		}

		function guessDelimiter(input, newline, skipEmptyLines, comments, delimitersToGuess) {
			var bestDelim, bestDelta, fieldCountPrevRow, maxFieldCount;

			delimitersToGuess = delimitersToGuess || [',', '\t', '|', ';', Papa.RECORD_SEP, Papa.UNIT_SEP];

			for (var i = 0; i < delimitersToGuess.length; i++) {
				var delim = delimitersToGuess[i];
				var delta = 0, avgFieldCount = 0, emptyLinesCount = 0;
				fieldCountPrevRow = undefined;

				var preview = new Parser({
					comments: comments,
					delimiter: delim,
					newline: newline,
					preview: 10
				}).parse(input);

				for (var j = 0; j < preview.data.length; j++) {
					if (skipEmptyLines && testEmptyLine(preview.data[j])) {
						emptyLinesCount++;
						continue;
					}
					var fieldCount = preview.data[j].length;
					avgFieldCount += fieldCount;

					if (typeof fieldCountPrevRow === 'undefined') {
						fieldCountPrevRow = fieldCount;
						continue;
					}
					else if (fieldCount > 0) {
						delta += Math.abs(fieldCount - fieldCountPrevRow);
						fieldCountPrevRow = fieldCount;
					}
				}

				if (preview.data.length > 0)
					avgFieldCount /= (preview.data.length - emptyLinesCount);

				if ((typeof bestDelta === 'undefined' || delta <= bestDelta)
					&& (typeof maxFieldCount === 'undefined' || avgFieldCount > maxFieldCount) && avgFieldCount > 1.99) {
					bestDelta = delta;
					bestDelim = delim;
					maxFieldCount = avgFieldCount;
				}
			}

			_config.delimiter = bestDelim;

			return {
				successful: !!bestDelim,
				bestDelimiter: bestDelim
			};
		}

		function addError(type, code, msg, row)
		{
			var error = {
				type: type,
				code: code,
				message: msg
			};
			if(row !== undefined) {
				error.row = row;
			}
			_results.errors.push(error);
		}
	}

	/** https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions */
	function escapeRegExp(string)
	{
		return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
	}

	/** The core parser implements speedy and correct CSV parsing */
	function Parser(config)
	{
		// Unpack the config object
		config = config || {};
		var delim = config.delimiter;
		var newline = config.newline;
		var comments = config.comments;
		var step = config.step;
		var preview = config.preview;
		var fastMode = config.fastMode;
		var quoteChar;
		var renamedHeaders = null;
		var headerParsed = false;

		if (config.quoteChar === undefined || config.quoteChar === null) {
			quoteChar = '"';
		} else {
			quoteChar = config.quoteChar;
		}
		var escapeChar = quoteChar;
		if (config.escapeChar !== undefined) {
			escapeChar = config.escapeChar;
		}

		// Delimiter must be valid
		if (typeof delim !== 'string'
			|| Papa.BAD_DELIMITERS.indexOf(delim) > -1)
			delim = ',';

		// Comment character must be valid
		if (comments === delim)
			throw new Error('Comment character same as delimiter');
		else if (comments === true)
			comments = '#';
		else if (typeof comments !== 'string'
			|| Papa.BAD_DELIMITERS.indexOf(comments) > -1)
			comments = false;

		// Newline must be valid: \r, \n, or \r\n
		if (newline !== '\n' && newline !== '\r' && newline !== '\r\n')
			newline = '\n';

		// We're gonna need these at the Parser scope
		var cursor = 0;
		var aborted = false;

		this.parse = function(input, baseIndex, ignoreLastRow)
		{
			// For some reason, in Chrome, this speeds things up (!?)
			if (typeof input !== 'string')
				throw new Error('Input must be a string');

			// We don't need to compute some of these every time parse() is called,
			// but having them in a more local scope seems to perform better
			var inputLen = input.length,
				delimLen = delim.length,
				newlineLen = newline.length,
				commentsLen = comments.length;
			var stepIsFunction = isFunction(step);

			// Establish starting state
			cursor = 0;
			var data = [], errors = [], row = [], lastCursor = 0;

			if (!input)
				return returnable();

			if (fastMode || (fastMode !== false && input.indexOf(quoteChar) === -1))
			{
				var rows = input.split(newline);
				for (var i = 0; i < rows.length; i++)
				{
					row = rows[i];
					cursor += row.length;

					if (i !== rows.length - 1)
						cursor += newline.length;
					else if (ignoreLastRow)
						return returnable();
					if (comments && row.substring(0, commentsLen) === comments)
						continue;
					if (stepIsFunction)
					{
						data = [];
						pushRow(row.split(delim));
						doStep();
						if (aborted)
							return returnable();
					}
					else
						pushRow(row.split(delim));
					if (preview && i >= preview)
					{
						data = data.slice(0, preview);
						return returnable(true);
					}
				}
				return returnable();
			}

			var nextDelim = input.indexOf(delim, cursor);
			var nextNewline = input.indexOf(newline, cursor);
			var quoteCharRegex = new RegExp(escapeRegExp(escapeChar) + escapeRegExp(quoteChar), 'g');
			var quoteSearch = input.indexOf(quoteChar, cursor);

			// Parser loop
			for (;;)
			{
				// Field has opening quote
				if (input[cursor] === quoteChar)
				{
					// Start our search for the closing quote where the cursor is
					quoteSearch = cursor;

					// Skip the opening quote
					cursor++;

					for (;;)
					{
						// Find closing quote
						quoteSearch = input.indexOf(quoteChar, quoteSearch + 1);

						//No other quotes are found - no other delimiters
						if (quoteSearch === -1)
						{
							if (!ignoreLastRow) {
								// No closing quote... what a pity
								errors.push({
									type: 'Quotes',
									code: 'MissingQuotes',
									message: 'Quoted field unterminated',
									row: data.length,	// row has yet to be inserted
									index: cursor
								});
							}
							return finish();
						}

						// Closing quote at EOF
						if (quoteSearch === inputLen - 1)
						{
							var value = input.substring(cursor, quoteSearch).replace(quoteCharRegex, quoteChar);
							return finish(value);
						}

						// If this quote is escaped, it's part of the data; skip it
						// If the quote character is the escape character, then check if the next character is the escape character
						if (quoteChar === escapeChar &&  input[quoteSearch + 1] === escapeChar)
						{
							quoteSearch++;
							continue;
						}

						// If the quote character is not the escape character, then check if the previous character was the escape character
						if (quoteChar !== escapeChar && quoteSearch !== 0 && input[quoteSearch - 1] === escapeChar)
						{
							continue;
						}

						if(nextDelim !== -1 && nextDelim < (quoteSearch + 1)) {
							nextDelim = input.indexOf(delim, (quoteSearch + 1));
						}
						if(nextNewline !== -1 && nextNewline < (quoteSearch + 1)) {
							nextNewline = input.indexOf(newline, (quoteSearch + 1));
						}
						// Check up to nextDelim or nextNewline, whichever is closest
						var checkUpTo = nextNewline === -1 ? nextDelim : Math.min(nextDelim, nextNewline);
						var spacesBetweenQuoteAndDelimiter = extraSpaces(checkUpTo);

						// Closing quote followed by delimiter or 'unnecessary spaces + delimiter'
						if (input.substr(quoteSearch + 1 + spacesBetweenQuoteAndDelimiter, delimLen) === delim)
						{
							row.push(input.substring(cursor, quoteSearch).replace(quoteCharRegex, quoteChar));
							cursor = quoteSearch + 1 + spacesBetweenQuoteAndDelimiter + delimLen;

							// If char after following delimiter is not quoteChar, we find next quote char position
							if (input[quoteSearch + 1 + spacesBetweenQuoteAndDelimiter + delimLen] !== quoteChar)
							{
								quoteSearch = input.indexOf(quoteChar, cursor);
							}
							nextDelim = input.indexOf(delim, cursor);
							nextNewline = input.indexOf(newline, cursor);
							break;
						}

						var spacesBetweenQuoteAndNewLine = extraSpaces(nextNewline);

						// Closing quote followed by newline or 'unnecessary spaces + newLine'
						if (input.substring(quoteSearch + 1 + spacesBetweenQuoteAndNewLine, quoteSearch + 1 + spacesBetweenQuoteAndNewLine + newlineLen) === newline)
						{
							row.push(input.substring(cursor, quoteSearch).replace(quoteCharRegex, quoteChar));
							saveRow(quoteSearch + 1 + spacesBetweenQuoteAndNewLine + newlineLen);
							nextDelim = input.indexOf(delim, cursor);	// because we may have skipped the nextDelim in the quoted field
							quoteSearch = input.indexOf(quoteChar, cursor);	// we search for first quote in next line

							if (stepIsFunction)
							{
								doStep();
								if (aborted)
									return returnable();
							}

							if (preview && data.length >= preview)
								return returnable(true);

							break;
						}


						// Checks for valid closing quotes are complete (escaped quotes or quote followed by EOF/delimiter/newline) -- assume these quotes are part of an invalid text string
						errors.push({
							type: 'Quotes',
							code: 'InvalidQuotes',
							message: 'Trailing quote on quoted field is malformed',
							row: data.length,	// row has yet to be inserted
							index: cursor
						});

						quoteSearch++;
						continue;

					}

					continue;
				}

				// Comment found at start of new line
				if (comments && row.length === 0 && input.substring(cursor, cursor + commentsLen) === comments)
				{
					if (nextNewline === -1)	// Comment ends at EOF
						return returnable();
					cursor = nextNewline + newlineLen;
					nextNewline = input.indexOf(newline, cursor);
					nextDelim = input.indexOf(delim, cursor);
					continue;
				}

				// Next delimiter comes before next newline, so we've reached end of field
				if (nextDelim !== -1 && (nextDelim < nextNewline || nextNewline === -1))
				{
					row.push(input.substring(cursor, nextDelim));
					cursor = nextDelim + delimLen;
					// we look for next delimiter char
					nextDelim = input.indexOf(delim, cursor);
					continue;
				}

				// End of row
				if (nextNewline !== -1)
				{
					row.push(input.substring(cursor, nextNewline));
					saveRow(nextNewline + newlineLen);

					if (stepIsFunction)
					{
						doStep();
						if (aborted)
							return returnable();
					}

					if (preview && data.length >= preview)
						return returnable(true);

					continue;
				}

				break;
			}

			return finish();


			function pushRow(row)
			{
				data.push(row);
				lastCursor = cursor;
			}

			/**
             * checks if there are extra spaces after closing quote and given index without any text
             * if Yes, returns the number of spaces
             */
			function extraSpaces(index) {
				var spaceLength = 0;
				if (index !== -1) {
					var textBetweenClosingQuoteAndIndex = input.substring(quoteSearch + 1, index);
					if (textBetweenClosingQuoteAndIndex && textBetweenClosingQuoteAndIndex.trim() === '') {
						spaceLength = textBetweenClosingQuoteAndIndex.length;
					}
				}
				return spaceLength;
			}

			/**
			 * Appends the remaining input from cursor to the end into
			 * row, saves the row, calls step, and returns the results.
			 */
			function finish(value)
			{
				if (ignoreLastRow)
					return returnable();
				if (typeof value === 'undefined')
					value = input.substring(cursor);
				row.push(value);
				cursor = inputLen;	// important in case parsing is paused
				pushRow(row);
				if (stepIsFunction)
					doStep();
				return returnable();
			}

			/**
			 * Appends the current row to the results. It sets the cursor
			 * to newCursor and finds the nextNewline. The caller should
			 * take care to execute user's step function and check for
			 * preview and end parsing if necessary.
			 */
			function saveRow(newCursor)
			{
				cursor = newCursor;
				pushRow(row);
				row = [];
				nextNewline = input.indexOf(newline, cursor);
			}

			/** Returns an object with the results, errors, and meta. */
			function returnable(stopped)
			{
				if (config.header && !baseIndex && data.length && !headerParsed)
				{
					const result = data[0];
					const headerCount = Object.create(null); // To track the count of each base header
					const usedHeaders = new Set(result); // To track used headers and avoid duplicates
					let duplicateHeaders = false;

					for (let i = 0; i < result.length; i++) {
						let header = stripBom(result[i]);
						if (isFunction(config.transformHeader))
							header = config.transformHeader(header, i);

						if (!headerCount[header]) {
							headerCount[header] = 1;
							result[i] = header;
						} else {
							let newHeader;
							let suffixCount = headerCount[header];

							// Find a unique new header
							do {
								newHeader = `${header}_${suffixCount}`;
								suffixCount++;
							} while (usedHeaders.has(newHeader));

							usedHeaders.add(newHeader); // Mark this new Header as used
							result[i] = newHeader;
							headerCount[header]++;
							duplicateHeaders = true;
							if (renamedHeaders === null) {
								renamedHeaders = {};
							}
							renamedHeaders[newHeader] = header;
						}

						usedHeaders.add(header); // Ensure the original header is marked as used
					}
					if (duplicateHeaders) {
						console.warn('Duplicate headers found and renamed.');
					}
					headerParsed = true;
				}
				return {
					data: data,
					errors: errors,
					meta: {
						delimiter: delim,
						linebreak: newline,
						aborted: aborted,
						truncated: !!stopped,
						cursor: lastCursor + (baseIndex || 0),
						renamedHeaders: renamedHeaders
					}
				};
			}

			/** Executes the user's step function and resets data & errors. */
			function doStep()
			{
				step(returnable());
				data = [];
				errors = [];
			}
		};

		/** Sets the abort flag */
		this.abort = function()
		{
			aborted = true;
		};

		/** Gets the cursor position */
		this.getCharIndex = function()
		{
			return cursor;
		};
	}


	function newWorker()
	{
		if (!Papa.WORKERS_SUPPORTED)
			return false;

		var workerUrl = getWorkerBlob();
		var w = new global.Worker(workerUrl);
		w.onmessage = mainThreadReceivedMessage;
		w.id = workerIdCounter++;
		workers[w.id] = w;
		return w;
	}

	/** Callback when main thread receives a message */
	function mainThreadReceivedMessage(e)
	{
		var msg = e.data;
		var worker = workers[msg.workerId];
		var aborted = false;

		if (msg.error)
			worker.userError(msg.error, msg.file);
		else if (msg.results && msg.results.data)
		{
			var abort = function() {
				aborted = true;
				completeWorker(msg.workerId, { data: [], errors: [], meta: { aborted: true } });
			};

			var handle = {
				abort: abort,
				pause: notImplemented,
				resume: notImplemented
			};

			if (isFunction(worker.userStep))
			{
				for (var i = 0; i < msg.results.data.length; i++)
				{
					worker.userStep({
						data: msg.results.data[i],
						errors: msg.results.errors,
						meta: msg.results.meta
					}, handle);
					if (aborted)
						break;
				}
				delete msg.results;	// free memory ASAP
			}
			else if (isFunction(worker.userChunk))
			{
				worker.userChunk(msg.results, handle, msg.file);
				delete msg.results;
			}
		}

		if (msg.finished && !aborted)
			completeWorker(msg.workerId, msg.results);
	}

	function completeWorker(workerId, results) {
		var worker = workers[workerId];
		if (isFunction(worker.userComplete))
			worker.userComplete(results);
		worker.terminate();
		delete workers[workerId];
	}

	function notImplemented() {
		throw new Error('Not implemented.');
	}

	/** Callback when worker thread receives a message */
	function workerThreadReceivedMessage(e)
	{
		var msg = e.data;

		if (typeof Papa.WORKER_ID === 'undefined' && msg)
			Papa.WORKER_ID = msg.workerId;

		if (typeof msg.input === 'string')
		{
			global.postMessage({
				workerId: Papa.WORKER_ID,
				results: Papa.parse(msg.input, msg.config),
				finished: true
			});
		}
		else if ((global.File && msg.input instanceof File) || msg.input instanceof Object)	// thank you, Safari (see issue #106)
		{
			var results = Papa.parse(msg.input, msg.config);
			if (results)
				global.postMessage({
					workerId: Papa.WORKER_ID,
					results: results,
					finished: true
				});
		}
	}

	/** Makes a deep copy of an array or object (mostly) */
	function copy(obj)
	{
		if (typeof obj !== 'object' || obj === null)
			return obj;
		var cpy = Array.isArray(obj) ? [] : {};
		for (var key in obj)
			cpy[key] = copy(obj[key]);
		return cpy;
	}

	function bindFunction(f, self)
	{
		return function() { f.apply(self, arguments); };
	}
	function isFunction(func)
	{
		return typeof func === 'function';
	}

	return Papa;
}));


/***/ },

/***/ "./agent-core/executor.ts"
/*!********************************!*\
  !*** ./agent-core/executor.ts ***!
  \********************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * agent-core/executor.ts
 * Executes TaskPlan steps via CDP with retry logic
 * Dependencies: electron-main/cdp-bridge, agent-core/verifier, shared/types
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.executePlan = executePlan;
const electron_1 = __webpack_require__(/*! electron */ "electron");
const fs_1 = __webpack_require__(/*! fs */ "fs");
const path_1 = __webpack_require__(/*! path */ "path");
const utils_1 = __webpack_require__(/*! ../shared/utils */ "./shared/utils.ts");
const constants_1 = __webpack_require__(/*! ../shared/constants */ "./shared/constants.ts");
const cdp = __importStar(__webpack_require__(/*! ../electron-main/cdp-bridge */ "./electron-main/cdp-bridge.ts"));
const verifier_1 = __webpack_require__(/*! ./verifier */ "./agent-core/verifier.ts");
const semantic_model_builder_1 = __webpack_require__(/*! ../semantic-parser/semantic-model-builder */ "./semantic-parser/semantic-model-builder.ts");
const extractor_1 = __webpack_require__(/*! ./extractor */ "./agent-core/extractor.ts");
/**
 * Execute task plan step-by-step
 */
async function executePlan(plan, session, win, onProgress) {
    try {
        plan.status = 'running';
        // Handle empty plan (no steps)
        if (plan.steps.length === 0) {
            plan.status = 'complete';
            plan.completedAt = Date.now();
            onProgress({
                planId: plan.id,
                stepId: '',
                stepStatus: 'success',
                planStatus: 'complete',
                currentStepIndex: 0,
            });
            return;
        }
        for (let i = 0; i < plan.steps.length; i++) {
            const step = plan.steps[i];
            plan.currentStepIndex = i;
            // Emit starting
            step.status = 'running';
            step.startedAt = Date.now();
            onProgress({
                planId: plan.id,
                stepId: step.id,
                stepStatus: 'running',
                planStatus: 'running',
                currentStepIndex: i,
            });
            // Check if needs checkpoint
            if (step.action.requiresUserConfirmation || (0, verifier_1.isDestructiveAction)(step.action)) {
                const approved = await (0, verifier_1.requestCheckpoint)({
                    planId: plan.id,
                    stepId: step.id,
                    stepDescription: step.description,
                    action: step.action,
                    riskLevel: (0, verifier_1.calculateRiskLevel)(step.action),
                }, win);
                if (!approved) {
                    step.status = 'skipped';
                    onProgress({
                        planId: plan.id,
                        stepId: step.id,
                        stepStatus: 'skipped',
                        planStatus: 'running',
                        currentStepIndex: i,
                    });
                    continue;
                }
            }
            // Execute with retry
            let success = false;
            for (let attempt = 0; attempt <= step.maxRetries; attempt++) {
                try {
                    await executeAction(step.action, session);
                    success = true;
                    break;
                }
                catch (err) {
                    console.error(`[Executor] Step ${step.id} attempt ${attempt} failed:`, err);
                    step.retryCount = attempt + 1;
                    if (attempt < step.maxRetries) {
                        await (0, utils_1.sleep)(constants_1.EXECUTION_CONFIG.RETRY_DELAY_MS * (attempt + 1));
                    }
                    else {
                        step.error = String(err);
                    }
                }
            }
            // Update step status
            step.status = success ? 'success' : 'failed';
            step.completedAt = Date.now();
            onProgress({
                planId: plan.id,
                stepId: step.id,
                stepStatus: step.status,
                planStatus: 'running',
                currentStepIndex: i,
            });
            // Stop on critical failure
            if (!success && step.action.isDestructive) {
                throw new Error(`Critical step ${step.id} failed`);
            }
        }
        // All steps complete
        plan.status = 'complete';
        plan.completedAt = Date.now();
        const lastStep = plan.steps[plan.steps.length - 1];
        onProgress({
            planId: plan.id,
            stepId: lastStep?.id || '',
            stepStatus: 'success',
            planStatus: 'complete',
            currentStepIndex: Math.max(plan.steps.length - 1, 0),
        });
    }
    catch (err) {
        console.error('[Executor] Plan execution failed:', err);
        plan.status = 'failed';
        plan.error = String(err);
        onProgress({
            planId: plan.id,
            stepId: plan.steps[plan.currentStepIndex]?.id || '',
            stepStatus: 'failed',
            planStatus: 'failed',
            currentStepIndex: plan.currentStepIndex,
        });
    }
}
/**
 * Execute single action via CDP
 */
async function executeAction(action, session) {
    switch (action.type) {
        case 'click':
            await executeClick(action, session);
            break;
        case 'fill':
            await executeFill(action, session);
            break;
        case 'navigate':
            await executeNavigate(action, session);
            break;
        case 'wait':
            await (0, utils_1.sleep)(action.payload.duration || 1000);
            break;
        case 'scroll':
            await executeScroll(action, session);
            break;
        case 'extract':
            await executeExtract(action, session);
            break;
        default:
            console.warn(`[Executor] Unknown action type: ${action.type}`);
    }
}
/**
 * Execute click action
 */
async function executeClick(action, session) {
    const selector = action.payload.selector;
    if (!selector)
        throw new Error('No selector for click action');
    const nodeId = await cdp.querySelector(session, selector);
    if (!nodeId)
        throw new Error(`Element not found: ${selector}`);
    await cdp.clickElement(session, nodeId);
    await (0, utils_1.sleep)(500); // Wait for click to process
}
/**
 * Execute fill action
 */
async function executeFill(action, session) {
    const { selector, value } = action.payload;
    if (!selector || !value)
        throw new Error('Missing selector or value for fill action');
    const nodeId = await cdp.querySelector(session, selector);
    if (!nodeId)
        throw new Error(`Element not found: ${selector}`);
    await cdp.fillInput(session, nodeId, String(value));
    await (0, utils_1.sleep)(300); // Wait for input to register
}
/**
 * Execute navigate action
 */
async function executeNavigate(action, session) {
    const url = action.payload.url;
    if (!url)
        throw new Error('No URL for navigate action');
    await cdp.navigateTo(session, url);
    await (0, utils_1.sleep)(2000); // Wait for navigation
}
/**
 * Execute scroll action
 */
async function executeScroll(action, session) {
    const amount = action.payload.scrollAmount || 400;
    await cdp.executeScript(session, `window.scrollBy(0, ${amount})`);
    await (0, utils_1.sleep)(200);
}
async function executeExtract(action, session) {
    const format = action.payload.extractTarget === 'json' ? 'json' : 'csv';
    const pageInfo = await cdp.extractPageSource(session);
    const model = await (0, semantic_model_builder_1.buildSemanticModel)(session, pageInfo.url);
    const content = format === 'json' ? (0, extractor_1.extractToJSON)(model) : (0, extractor_1.extractToCSV)(model);
    const downloads = electron_1.app.getPath('downloads');
    const safeTitle = (model.title || model.pageIntent || 'page-data')
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 48) || 'page-data';
    const filePath = (0, path_1.join)(downloads, `${safeTitle}-${Date.now()}.${format}`);
    (0, fs_1.writeFileSync)(filePath, content, 'utf8');
    action.result = { success: true, data: { path: filePath, format } };
}


/***/ },

/***/ "./agent-core/extractor.ts"
/*!*********************************!*\
  !*** ./agent-core/extractor.ts ***!
  \*********************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * agent-core/extractor.ts
 * Converts SemanticPageModel to JSON/CSV formats
 * Dependencies: shared/types, papaparse
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.extractToJSON = extractToJSON;
exports.extractToCSV = extractToCSV;
const Papa = __importStar(__webpack_require__(/*! papaparse */ "./node_modules/papaparse/papaparse.js"));
/**
 * Extract page data to JSON
 */
function extractToJSON(model) {
    const data = {
        url: model.url,
        title: model.title,
        pageIntent: model.pageIntent,
        extractedAt: new Date().toISOString(),
        entities: model.entities.map(e => ({
            type: e.type,
            value: e.value,
            normalizedValue: e.normalizedValue,
        })),
        forms: model.forms.map(f => ({
            fields: f.fields.map(field => ({
                label: field.label,
                type: field.semanticType,
                value: field.currentValue,
            })),
        })),
        actions: model.actions.map(a => ({
            label: a.label,
            type: a.type,
            href: a.href,
        })),
        documents: model.documents,
    };
    return JSON.stringify(data, null, 2);
}
/**
 * Extract page data to CSV
 */
function extractToCSV(model) {
    // Prioritize entities as rows
    if (model.entities.length > 0) {
        const rows = model.entities.map(e => ({
            Type: e.type,
            Value: e.value,
            NormalizedValue: e.normalizedValue || '',
        }));
        return Papa.unparse(rows);
    }
    // Fallback to actions
    if (model.actions.length > 0) {
        const rows = model.actions.map(a => ({
            Label: a.label,
            Type: a.type,
            Link: a.href || '',
        }));
        return Papa.unparse(rows);
    }
    // Fallback to basic info
    return Papa.unparse([
        {
            URL: model.url,
            Title: model.title,
            Intent: model.pageIntent,
        },
    ]);
}


/***/ },

/***/ "./agent-core/llm-client.ts"
/*!**********************************!*\
  !*** ./agent-core/llm-client.ts ***!
  \**********************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * agent-core/llm-client.ts
 * NVIDIA NIM API client with PII redaction (direct HTTP)
 * Dependencies: shared/utils, shared/constants
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.callLLM = callLLM;
const utils_1 = __webpack_require__(/*! ../shared/utils */ "./shared/utils.ts");
const constants_1 = __webpack_require__(/*! ../shared/constants */ "./shared/constants.ts");
const API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
/**
 * Call LLM with PII redaction (using NVIDIA NIM API via direct HTTP)
 */
async function callLLM(systemPrompt, userMessage, options = {}) {
    // Always redact PII before sending
    const redactedUser = (0, utils_1.redactPII)(userMessage);
    // Check for mock mode
    if (process.env.MOCK_LLM === 'true') {
        console.log('[LLM] Mock mode - returning canned response');
        return mockLLMResponse(redactedUser);
    }
    const apiKey = process.env.NIM_API_KEY || process.env.NVIDIA_API_KEY || '';
    if (!apiKey) {
        throw new Error('No NVIDIA API key found. Set NIM_API_KEY or NVIDIA_API_KEY in .env');
    }
    const payload = {
        model: constants_1.LLM_CONFIG.MODEL,
        messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: redactedUser },
        ],
        temperature: options.temperature ?? constants_1.LLM_CONFIG.TEMPERATURE,
        top_p: 0.9,
        max_tokens: options.maxTokens || constants_1.LLM_CONFIG.MAX_TOKENS,
        stream: false,
    };
    let lastError = null;
    for (let attempt = 0; attempt <= constants_1.LLM_CONFIG.MAX_RETRIES; attempt++) {
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), constants_1.LLM_CONFIG.TIMEOUT_MS);
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });
            clearTimeout(timeout);
            if (response.status === 429) {
                // Rate limited - wait and retry
                const waitMs = Math.pow(2, attempt) * 1000;
                console.warn(`[LLM] Rate limited (429), retrying in ${waitMs}ms...`);
                await new Promise(r => setTimeout(r, waitMs));
                continue;
            }
            if (!response.ok) {
                const body = await response.text().catch(() => '(no body)');
                throw new Error(`HTTP ${response.status}: ${body}`);
            }
            const data = await response.json();
            if (!data.choices || data.choices.length === 0) {
                throw new Error('No choices in LLM response');
            }
            const content = data.choices[0]?.message?.content;
            return content || '';
        }
        catch (err) {
            lastError = err;
            console.error(`[LLM] Attempt ${attempt + 1} failed:`, err.message);
            if (attempt < constants_1.LLM_CONFIG.MAX_RETRIES) {
                const waitMs = Math.pow(2, attempt) * 1000;
                await new Promise(r => setTimeout(r, waitMs));
            }
        }
    }
    throw new Error(`LLM API error after ${constants_1.LLM_CONFIG.MAX_RETRIES + 1} attempts: ${lastError}`);
}
/**
 * Mock LLM response for testing
 */
function mockLLMResponse(userMessage) {
    // Simple pattern matching for common intents
    if (/fill.*form/i.test(userMessage)) {
        return JSON.stringify({
            id: 'plan_mock',
            intent: 'Fill form with user data',
            steps: [
                {
                    id: 'step_1',
                    sequence: 1,
                    description: 'Fill name field',
                    action: {
                        id: 'action_1',
                        type: 'fill',
                        payload: { selector: 'input[name="name"]', value: 'Demo User' },
                        isDestructive: false,
                        requiresUserConfirmation: false,
                    },
                    maxRetries: 3,
                    retryCount: 0,
                    status: 'pending',
                },
            ],
            estimatedDuration: 5000,
            requiresCheckpoint: false,
            status: 'pending',
            currentStepIndex: 0,
            createdAt: Date.now(),
        });
    }
    if (/extract|export/i.test(userMessage)) {
        return JSON.stringify({
            id: 'plan_mock',
            intent: 'Extract page data',
            steps: [
                {
                    id: 'step_1',
                    sequence: 1,
                    description: 'Extract data to CSV',
                    action: {
                        id: 'action_1',
                        type: 'extract',
                        payload: { extractTarget: 'csv' },
                        isDestructive: false,
                        requiresUserConfirmation: false,
                    },
                    maxRetries: 1,
                    retryCount: 0,
                    status: 'pending',
                },
            ],
            estimatedDuration: 2000,
            requiresCheckpoint: false,
            status: 'pending',
            currentStepIndex: 0,
            createdAt: Date.now(),
        });
    }
    if (/open|navigate|go to|visit/i.test(userMessage)) {
        // Try to extract URL from the message
        const urlMatch = userMessage.match(/(?:open|navigate|go to|visit)\s+(\S+)/i);
        const target = urlMatch?.[1] || 'google.com';
        const url = target.startsWith('http') ? target : `https://${target}`;
        return JSON.stringify({
            id: 'plan_mock',
            intent: `Navigate to ${target}`,
            steps: [
                {
                    id: 'step_1',
                    sequence: 1,
                    description: `Navigate to ${url}`,
                    action: {
                        id: 'action_1',
                        type: 'navigate',
                        payload: { url },
                        isDestructive: false,
                        requiresUserConfirmation: false,
                    },
                    maxRetries: 2,
                    retryCount: 0,
                    status: 'pending',
                },
            ],
            estimatedDuration: 3000,
            requiresCheckpoint: false,
            status: 'pending',
            currentStepIndex: 0,
            createdAt: Date.now(),
        });
    }
    if (/click|press|tap/i.test(userMessage)) {
        const targetMatch = userMessage.match(/(?:click|press|tap)\s+(?:on\s+)?(?:the\s+)?(.+)/i);
        const target = targetMatch?.[1] || 'button';
        return JSON.stringify({
            id: 'plan_mock',
            intent: `Click ${target}`,
            steps: [
                {
                    id: 'step_1',
                    sequence: 1,
                    description: `Click on ${target}`,
                    action: {
                        id: 'action_1',
                        type: 'click',
                        payload: { selector: target },
                        isDestructive: false,
                        requiresUserConfirmation: false,
                    },
                    maxRetries: 3,
                    retryCount: 0,
                    status: 'pending',
                },
            ],
            estimatedDuration: 2000,
            requiresCheckpoint: false,
            status: 'pending',
            currentStepIndex: 0,
            createdAt: Date.now(),
        });
    }
    if (/scroll/i.test(userMessage)) {
        return JSON.stringify({
            id: 'plan_mock',
            intent: 'Scroll page',
            steps: [
                {
                    id: 'step_1',
                    sequence: 1,
                    description: 'Scroll down the page',
                    action: {
                        id: 'action_1',
                        type: 'scroll',
                        payload: { scrollAmount: 500 },
                        isDestructive: false,
                        requiresUserConfirmation: false,
                    },
                    maxRetries: 1,
                    retryCount: 0,
                    status: 'pending',
                },
            ],
            estimatedDuration: 1000,
            requiresCheckpoint: false,
            status: 'pending',
            currentStepIndex: 0,
            createdAt: Date.now(),
        });
    }
    // Default mock response - task acknowledged
    return JSON.stringify({
        id: 'plan_mock',
        intent: userMessage,
        steps: [],
        estimatedDuration: 1000,
        requiresCheckpoint: false,
        status: 'complete',
        currentStepIndex: 0,
        createdAt: Date.now(),
    });
}


/***/ },

/***/ "./agent-core/memory-manager.ts"
/*!**************************************!*\
  !*** ./agent-core/memory-manager.ts ***!
  \**************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * agent-core/memory-manager.ts
 * CRUD operations for user profiles, domain memory, and workflows
 * Dependencies: electron-main/db, shared/types, shared/utils
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getUserProfile = getUserProfile;
exports.setUserProfile = setUserProfile;
exports.getDomainMemory = getDomainMemory;
exports.upsertDomainMemory = upsertDomainMemory;
exports.saveFormInputs = saveFormInputs;
exports.listWorkflows = listWorkflows;
exports.saveWorkflow = saveWorkflow;
exports.getWorkflow = getWorkflow;
const db_1 = __webpack_require__(/*! ../electron-main/db */ "./electron-main/db.ts");
const utils_1 = __webpack_require__(/*! ../shared/utils */ "./shared/utils.ts");
/**
 * Get user profile
 */
function getUserProfile() {
    try {
        const row = db_1.db.prepare('SELECT * FROM user_profile LIMIT 1').get();
        if (!row)
            return null;
        return {
            id: row.id,
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email,
            phone: row.phone,
            address: (0, utils_1.safeJSONParse)(row.address_json, undefined),
            custom: (0, utils_1.safeJSONParse)(row.custom_json, {}),
        };
    }
    catch (err) {
        console.error('[Memory] Failed to get user profile:', err);
        return null;
    }
}
/**
 * Set user profile
 */
function setUserProfile(profile) {
    try {
        const existing = getUserProfile();
        const merged = {
            id: profile.id || existing?.id || 'user-001',
            first_name: profile.firstName || existing?.firstName || '',
            last_name: profile.lastName || existing?.lastName || '',
            email: profile.email || existing?.email || '',
            phone: profile.phone || existing?.phone || null,
            address_json: JSON.stringify(profile.address || existing?.address || null),
            custom_json: JSON.stringify(profile.custom || existing?.custom || {}),
        };
        db_1.db.prepare(`
      INSERT OR REPLACE INTO user_profile 
      (id, first_name, last_name, email, phone, address_json, custom_json)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(merged.id, merged.first_name, merged.last_name, merged.email, merged.phone, merged.address_json, merged.custom_json);
    }
    catch (err) {
        console.error('[Memory] Failed to set user profile:', err);
    }
}
/**
 * Get domain memory
 */
function getDomainMemory(domain) {
    try {
        const row = db_1.db.prepare('SELECT * FROM domain_memory WHERE domain = ?').get(domain);
        if (!row)
            return null;
        return {
            domain: row.domain,
            lastVisited: row.last_visited,
            formInputs: (0, utils_1.safeJSONParse)(row.form_inputs, {}),
            preferences: (0, utils_1.safeJSONParse)(row.preferences, {}),
            taskHistory: (0, utils_1.safeJSONParse)(row.task_history, []),
        };
    }
    catch (err) {
        console.error('[Memory] Failed to get domain memory:', err);
        return null;
    }
}
/**
 * Upsert domain memory
 */
function upsertDomainMemory(domain, update) {
    try {
        const existing = getDomainMemory(domain);
        const merged = {
            domain,
            last_visited: Date.now(),
            form_inputs: JSON.stringify(update.formInputs || existing?.formInputs || {}),
            preferences: JSON.stringify(update.preferences || existing?.preferences || {}),
            task_history: JSON.stringify(update.taskHistory || existing?.taskHistory || []),
        };
        db_1.db.prepare(`
      INSERT OR REPLACE INTO domain_memory 
      (domain, last_visited, form_inputs, preferences, task_history)
      VALUES (?, ?, ?, ?, ?)
    `).run(merged.domain, merged.last_visited, merged.form_inputs, merged.preferences, merged.task_history);
    }
    catch (err) {
        console.error('[Memory] Failed to upsert domain memory:', err);
    }
}
/**
 * Save form inputs to domain memory
 */
function saveFormInputs(domain, inputs) {
    const existing = getDomainMemory(domain);
    const merged = { ...existing?.formInputs, ...inputs };
    upsertDomainMemory(domain, { formInputs: merged });
}
/**
 * List all workflows
 */
function listWorkflows() {
    try {
        const rows = db_1.db.prepare('SELECT * FROM workflow_recordings ORDER BY created_at DESC').all();
        return rows.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            trigger: row.trigger,
            steps: (0, utils_1.safeJSONParse)(row.steps_json, []),
            createdAt: row.created_at,
            lastUsed: row.last_used,
            runCount: row.run_count,
        }));
    }
    catch (err) {
        console.error('[Memory] Failed to list workflows:', err);
        return [];
    }
}
/**
 * Save workflow
 */
function saveWorkflow(recording) {
    try {
        db_1.db.prepare(`
      INSERT OR REPLACE INTO workflow_recordings
      (id, name, description, trigger, steps_json, created_at, last_used, run_count)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(recording.id, recording.name, recording.description || null, recording.trigger, JSON.stringify(recording.steps), recording.createdAt, recording.lastUsed || null, recording.runCount);
    }
    catch (err) {
        console.error('[Memory] Failed to save workflow:', err);
    }
}
/**
 * Get workflow by ID
 */
function getWorkflow(id) {
    try {
        const row = db_1.db.prepare('SELECT * FROM workflow_recordings WHERE id = ?').get(id);
        if (!row)
            return null;
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            trigger: row.trigger,
            steps: (0, utils_1.safeJSONParse)(row.steps_json, []),
            createdAt: row.created_at,
            lastUsed: row.last_used,
            runCount: row.run_count,
        };
    }
    catch (err) {
        console.error('[Memory] Failed to get workflow:', err);
        return null;
    }
}


/***/ },

/***/ "./agent-core/pipeline.ts"
/*!********************************!*\
  !*** ./agent-core/pipeline.ts ***!
  \********************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * agent-core/pipeline.ts
 * Top-level orchestrator: Intent → Parse → Plan → Execute → Verify
 * Dependencies: all agent-core modules, semantic-parser, electron-main
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.runPipeline = runPipeline;
const semantic_model_builder_1 = __webpack_require__(/*! ../semantic-parser/semantic-model-builder */ "./semantic-parser/semantic-model-builder.ts");
const planner_1 = __webpack_require__(/*! ./planner */ "./agent-core/planner.ts");
const executor_1 = __webpack_require__(/*! ./executor */ "./agent-core/executor.ts");
const memory_manager_1 = __webpack_require__(/*! ./memory-manager */ "./agent-core/memory-manager.ts");
const utils_1 = __webpack_require__(/*! ../shared/utils */ "./shared/utils.ts");
const constants_1 = __webpack_require__(/*! ../shared/constants */ "./shared/constants.ts");
/**
 * Run full pipeline: Parse → Plan → Execute
 */
async function runPipeline(intent, win, session) {
    try {
        console.log('[Pipeline] Starting:', intent);
        // STEP 1: Parse current page
        const url = await session.send('Page.getNavigationHistory');
        const currentURL = url?.currentEntry?.url || '';
        console.log('[Pipeline] Parsing page...');
        const model = await (0, semantic_model_builder_1.buildSemanticModel)(session, currentURL);
        // STEP 2: Get domain memory
        const domain = (0, utils_1.extractDomain)(currentURL);
        const memory = (0, memory_manager_1.getDomainMemory)(domain);
        const profile = (0, memory_manager_1.getUserProfile)();
        const plannerMemory = profile
            ? {
                domain,
                lastVisited: memory?.lastVisited || Date.now(),
                formInputs: {
                    firstName: profile.firstName,
                    lastName: profile.lastName,
                    fullName: `${profile.firstName} ${profile.lastName}`.trim(),
                    email: profile.email,
                    phone: profile.phone || '',
                    street: profile.address?.street || '',
                    address: profile.address?.street || '',
                    city: profile.address?.city || '',
                    state: profile.address?.state || '',
                    zip: profile.address?.zip || '',
                    country: profile.address?.country || '',
                    ...(memory?.formInputs || {}),
                },
                preferences: memory?.preferences || profile.custom || {},
                taskHistory: memory?.taskHistory || [],
            }
            : memory;
        // STEP 3: Plan task
        console.log('[Pipeline] Planning task...');
        const plan = await (0, planner_1.planTask)(intent, model, plannerMemory);
        // Return plan immediately (HUD can show it)
        setTimeout(() => {
            // STEP 4: Execute asynchronously
            console.log('[Pipeline] Executing plan...');
            (0, executor_1.executePlan)(plan, session, win, (update) => {
                // Push progress to renderer
                win.webContents.send(constants_1.CHANNELS.AGENT_TASK_PROGRESS, update);
            }).then(() => {
                console.log('[Pipeline] Execution complete');
                // STEP 5: Update memory
                if (plan.status === 'complete') {
                    const taskHistory = memory?.taskHistory || [];
                    taskHistory.unshift(intent);
                    (0, memory_manager_1.upsertDomainMemory)(domain, {
                        taskHistory: taskHistory.slice(0, 20), // Keep last 20
                    });
                }
            }).catch(err => {
                console.error('[Pipeline] Execution failed:', err);
            });
        }, 0);
        return plan;
    }
    catch (err) {
        console.error('[Pipeline] Failed:', err);
        throw err;
    }
}


/***/ },

/***/ "./agent-core/planner.ts"
/*!*******************************!*\
  !*** ./agent-core/planner.ts ***!
  \*******************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * agent-core/planner.ts
 * LLM-based task planner - converts intent to TaskPlan
 * Dependencies: agent-core/llm-client, shared/types, shared/utils
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.planTask = planTask;
const llm_client_1 = __webpack_require__(/*! ./llm-client */ "./agent-core/llm-client.ts");
const utils_1 = __webpack_require__(/*! ../shared/utils */ "./shared/utils.ts");
const zod_1 = __webpack_require__(/*! zod */ "./node_modules/zod/index.cjs");
// Zod schema for validation
const TaskPlanSchema = zod_1.z.object({
    intent: zod_1.z.string(),
    steps: zod_1.z.array(zod_1.z.object({
        description: zod_1.z.string(),
        action: zod_1.z.object({
            type: zod_1.z.string(),
            payload: zod_1.z.record(zod_1.z.unknown()),
            isDestructive: zod_1.z.boolean().optional(),
            requiresUserConfirmation: zod_1.z.boolean().optional(),
        }),
    })),
});
/**
 * Plan task from intent and context
 */
async function planTask(intent, model, memory) {
    try {
        // Compact model for LLM
        const compactModel = (0, utils_1.compactForLLM)(model);
        // Build system prompt
        const systemPrompt = `You are a browser automation planner. Output ONLY valid JSON matching this structure:
{
  "intent": "brief description",
  "steps": [
    {
      "description": "human-readable step description",
      "action": {
        "type": "click|fill|navigate|extract|wait|scroll",
        "payload": {
          "selector": "CSS selector (for click/fill)",
          "value": "input value (for fill)",
          "url": "URL (for navigate)",
          "extractTarget": "json|csv (for extract)"
        },
        "isDestructive": false,
        "requiresUserConfirmation": false
      }
    }
  ]
}

Rules:
- Max 10 steps
- Use only selectors from page context
- Mark isDestructive=true for form submit or payment
- Mark requiresUserConfirmation=true for destructive actions`;
        // Build user message
        const userMessage = `
Page context: ${JSON.stringify(compactModel)}

User intent: "${intent}"

${memory ? `User memory: ${JSON.stringify(memory.formInputs)}` : ''}

Generate TaskPlan JSON:`;
        // Call LLM
        const response = await (0, llm_client_1.callLLM)(systemPrompt, userMessage, {
            maxTokens: 1000,
            temperature: 0,
        });
        // Parse response
        const cleaned = cleanLLMResponse(response);
        const parsed = (0, utils_1.safeJSONParse)(cleaned, null);
        if (!parsed) {
            throw new Error('Failed to parse LLM response');
        }
        // Validate with Zod
        const validated = TaskPlanSchema.parse(parsed);
        // Convert to full TaskPlan
        return buildTaskPlan(validated, intent, model);
    }
    catch (err) {
        console.error('[Planner] Failed to plan task:', err);
        return buildHeuristicPlan(intent, model, memory, String(err));
    }
}
/**
 * Clean LLM response (remove markdown fences)
 */
function cleanLLMResponse(text) {
    // Remove markdown code fences
    return text
        .replace(/```json\s*/g, '')
        .replace(/```\s*/g, '')
        .trim();
}
/**
 * Build full TaskPlan from validated LLM response
 */
function buildTaskPlan(validated, intent, model) {
    const steps = validated.steps.map((step, index) => ({
        id: (0, utils_1.generateId)('step'),
        sequence: index + 1,
        description: step.description,
        action: {
            id: (0, utils_1.generateId)('action'),
            type: step.action.type,
            payload: step.action.payload,
            isDestructive: step.action.isDestructive || false,
            requiresUserConfirmation: step.action.requiresUserConfirmation || false,
        },
        retryCount: 0,
        maxRetries: 3,
        status: 'pending',
    }));
    const requiresCheckpoint = steps.some(s => s.action.requiresUserConfirmation);
    const estimatedDuration = steps.length * 2000; // 2s per step
    return {
        id: (0, utils_1.generateId)('plan'),
        intent: validated.intent,
        rawCommand: intent,
        steps,
        estimatedDuration,
        requiresCheckpoint,
        context: model,
        status: 'pending',
        currentStepIndex: 0,
        createdAt: Date.now(),
    };
}
function buildHeuristicPlan(intent, model, memory, sourceError) {
    const lower = intent.toLowerCase();
    const steps = [];
    const addStep = (description, action, maxRetries = 3) => {
        steps.push({
            id: (0, utils_1.generateId)('step'),
            sequence: steps.length + 1,
            description,
            action: { ...action, id: (0, utils_1.generateId)('action') },
            retryCount: 0,
            maxRetries,
            status: 'pending',
        });
    };
    const extractFormat = lower.includes('json') ? 'json' : lower.includes('text') ? 'text' : 'csv';
    if (/extract|export|save|download.*data|csv|json/.test(lower)) {
        addStep(`Extract page data as ${extractFormat.toUpperCase()}`, {
            id: '',
            type: 'extract',
            payload: { extractTarget: extractFormat },
            isDestructive: false,
            requiresUserConfirmation: false,
        }, 1);
    }
    else if (/scroll/.test(lower)) {
        addStep(lower.includes('up') ? 'Scroll up' : 'Scroll down', {
            id: '',
            type: 'scroll',
            payload: { scrollAmount: lower.includes('up') ? -600 : 600 },
            isDestructive: false,
            requiresUserConfirmation: false,
        }, 1);
    }
    else if (/open|go to|visit|navigate/.test(lower)) {
        const urlMatch = intent.match(/(?:open|go to|visit|navigate(?: to)?)\s+([^\s]+)/i);
        const target = urlMatch?.[1] || '';
        if (target) {
            addStep(`Navigate to ${target}`, {
                id: '',
                type: 'navigate',
                payload: { url: /^https?:\/\//i.test(target) ? target : `https://${target}` },
                isDestructive: false,
                requiresUserConfirmation: false,
            }, 2);
        }
    }
    else if (/fill|complete|autofill|address|profile/.test(lower) && model.forms.length > 0) {
        const values = buildFormValues(memory);
        const fields = model.forms.flatMap((form) => form.fields);
        for (const field of fields) {
            const value = values[field.semanticType] || values[field.label.toLowerCase()] || '';
            if (!value || field.currentValue)
                continue;
            addStep(`Fill ${field.label}`, {
                id: '',
                type: 'fill',
                payload: { selector: field.selector, value },
                isDestructive: false,
                requiresUserConfirmation: false,
            });
        }
        const shouldSubmit = /submit|send|checkout|book|pay|apply/.test(lower);
        const submitForm = model.forms.find((form) => form.submitSelector);
        if (shouldSubmit && submitForm?.submitSelector) {
            addStep(`Review and ${submitForm.submitLabel || 'submit'} form`, {
                id: '',
                type: 'click',
                payload: { selector: submitForm.submitSelector },
                isDestructive: true,
                requiresUserConfirmation: true,
            });
        }
    }
    else if (/click|press|tap|select/.test(lower)) {
        const target = lower.replace(/^(click|press|tap|select)\s+(on\s+)?(the\s+)?/i, '').trim();
        const action = findBestAction(model, target);
        if (action) {
            addStep(`Click ${action.label}`, {
                id: '',
                type: action.type === 'navigate' && action.href ? 'navigate' : 'click',
                payload: action.href && action.type === 'navigate' ? { url: action.href } : { selector: action.selector },
                isDestructive: action.type === 'submit',
                requiresUserConfirmation: action.type === 'submit',
            });
        }
    }
    if (steps.length === 0 && model.actions.length > 0) {
        const action = findBestAction(model, lower);
        if (action) {
            addStep(`Run page action: ${action.label}`, {
                id: '',
                type: action.type === 'navigate' && action.href ? 'navigate' : 'click',
                payload: action.href && action.type === 'navigate' ? { url: action.href } : { selector: action.selector },
                isDestructive: action.type === 'submit',
                requiresUserConfirmation: action.type === 'submit',
            });
        }
    }
    const requiresCheckpoint = steps.some((step) => step.action.requiresUserConfirmation);
    return {
        id: (0, utils_1.generateId)('plan'),
        intent,
        rawCommand: intent,
        steps,
        estimatedDuration: Math.max(steps.length * 1200, 1000),
        requiresCheckpoint,
        context: model,
        status: steps.length > 0 ? 'pending' : 'failed',
        currentStepIndex: 0,
        createdAt: Date.now(),
        error: steps.length > 0 ? undefined : `Could not produce an executable plan. ${sourceError || ''}`.trim(),
    };
}
function buildFormValues(memory) {
    const inputs = memory?.formInputs || {};
    const preferences = memory?.preferences || {};
    const merged = { ...preferences, ...inputs };
    return {
        firstName: stringValue(merged.firstName || merged.first_name),
        lastName: stringValue(merged.lastName || merged.last_name),
        fullName: stringValue(merged.fullName || merged.name),
        email: stringValue(merged.email),
        phone: stringValue(merged.phone),
        address: stringValue(merged.address || merged.street),
        city: stringValue(merged.city),
        state: stringValue(merged.state),
        zip: stringValue(merged.zip || merged.postal),
        country: stringValue(merged.country),
        username: stringValue(merged.username || merged.email),
        search: stringValue(merged.search),
    };
}
function stringValue(value) {
    return typeof value === 'string' ? value : value == null ? '' : String(value);
}
function findBestAction(model, target) {
    const normalizedTarget = target.toLowerCase();
    return model.actions.find((action) => action.label.toLowerCase().includes(normalizedTarget))
        || model.actions.find((action) => normalizedTarget.includes(action.label.toLowerCase()))
        || model.actions[0];
}


/***/ },

/***/ "./agent-core/verifier.ts"
/*!********************************!*\
  !*** ./agent-core/verifier.ts ***!
  \********************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * agent-core/verifier.ts
 * Pre-action checks and checkpoint Promise gate
 * Dependencies: shared/types, shared/constants, electron
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isDestructiveAction = isDestructiveAction;
exports.requestCheckpoint = requestCheckpoint;
exports.resolveCheckpoint = resolveCheckpoint;
exports.calculateRiskLevel = calculateRiskLevel;
const constants_1 = __webpack_require__(/*! ../shared/constants */ "./shared/constants.ts");
const utils_1 = __webpack_require__(/*! ../shared/utils */ "./shared/utils.ts");
// Map of pending checkpoint promises
const pendingCheckpoints = new Map();
/**
 * Check if action is destructive
 */
function isDestructiveAction(action) {
    // Already marked
    if (action.isDestructive)
        return true;
    // Submit actions
    if (action.type === 'submit')
        return true;
    // Fill sensitive fields
    if (action.type === 'fill') {
        const value = (action.payload.value || '').toLowerCase();
        if (value.includes('card') || value.includes('cvv')) {
            return true;
        }
    }
    return false;
}
/**
 * Request checkpoint from user (Promise gate)
 */
async function requestCheckpoint(payload, win) {
    const id = (0, utils_1.generateId)('checkpoint');
    const fullPayload = {
        id,
        ...payload,
    };
    // Send to renderer
    win.webContents.send(constants_1.CHANNELS.AGENT_CHECKPOINT_REQUEST, fullPayload);
    return new Promise((resolve) => {
        // Set timeout for auto-cancel
        const timeout = setTimeout(() => {
            pendingCheckpoints.delete(id);
            console.log('[Verifier] Checkpoint timeout - auto-cancelled');
            resolve(false);
        }, constants_1.EXECUTION_CONFIG.CHECKPOINT_TIMEOUT_MS);
        // Store resolver
        pendingCheckpoints.set(id, (approved) => {
            clearTimeout(timeout);
            resolve(approved);
        });
    });
}
/**
 * Resolve checkpoint (called from IPC handler)
 */
function resolveCheckpoint(id, approved) {
    const resolver = pendingCheckpoints.get(id);
    if (resolver) {
        resolver(approved);
        pendingCheckpoints.delete(id);
    }
}
/**
 * Calculate risk level for action
 */
function calculateRiskLevel(action) {
    if (action.type === 'submit' && action.isDestructive) {
        return 'high';
    }
    if (action.type === 'fill') {
        const selector = action.payload.selector || '';
        if (/credit|card|cvv|password/i.test(selector)) {
            return 'medium';
        }
    }
    if (action.type === 'navigate') {
        return 'low';
    }
    return 'low';
}


/***/ },

/***/ "./agent-core/workflow-recorder.ts"
/*!*****************************************!*\
  !*** ./agent-core/workflow-recorder.ts ***!
  \*****************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * agent-core/workflow-recorder.ts
 * Records user actions for workflow replay
 * Dependencies: shared/types, shared/utils
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.startRecording = startRecording;
exports.stopRecording = stopRecording;
exports.isCurrentlyRecording = isCurrentlyRecording;
exports.addRecordedStep = addRecordedStep;
const utils_1 = __webpack_require__(/*! ../shared/utils */ "./shared/utils.ts");
let isRecording = false;
let recordedSteps = [];
let recordingStartTime = 0;
/**
 * Start recording workflow
 */
function startRecording(session) {
    if (isRecording) {
        console.warn('[Recorder] Already recording');
        return;
    }
    isRecording = true;
    recordedSteps = [];
    recordingStartTime = Date.now();
    // Attach CDP listeners
    session.on('Input.dispatchKeyEvent', (params) => {
        if (params.type === 'char') {
            // Accumulate text input
            // ponytail: simplified - just log, full impl would batch chars
        }
    });
    console.log('[Recorder] Started recording');
}
/**
 * Stop recording and return workflow
 */
function stopRecording(name, description) {
    if (!isRecording) {
        throw new Error('Not currently recording');
    }
    isRecording = false;
    const recording = {
        id: (0, utils_1.generateId)('workflow'),
        name,
        description,
        trigger: name.toLowerCase(),
        steps: recordedSteps,
        createdAt: Date.now(),
        runCount: 0,
    };
    console.log(`[Recorder] Stopped. Recorded ${recordedSteps.length} steps`);
    // Reset state
    recordedSteps = [];
    recordingStartTime = 0;
    return recording;
}
/**
 * Check if currently recording
 */
function isCurrentlyRecording() {
    return isRecording;
}
/**
 * Manually add step (called from executor during recording)
 */
function addRecordedStep(step) {
    if (!isRecording)
        return;
    recordedSteps.push({
        id: (0, utils_1.generateId)('rec-step'),
        timestamp: Date.now() - recordingStartTime,
        ...step,
    });
}


/***/ },

/***/ "./agent-core/workflow-replayer.ts"
/*!*****************************************!*\
  !*** ./agent-core/workflow-replayer.ts ***!
  \*****************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * agent-core/workflow-replayer.ts
 * Replays recorded workflows
 * Dependencies: shared/types, agent-core/executor
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.replayWorkflow = replayWorkflow;
const utils_1 = __webpack_require__(/*! ../shared/utils */ "./shared/utils.ts");
/**
 * Convert workflow recording to TaskPlan for execution
 */
function replayWorkflow(recording) {
    const steps = recording.steps.map((recStep, index) => ({
        id: (0, utils_1.generateId)('step'),
        sequence: index + 1,
        description: recStep.label || `${recStep.type} action`,
        action: {
            id: (0, utils_1.generateId)('action'),
            type: recStep.type,
            payload: {
                selector: recStep.selector,
                value: recStep.value,
                url: recStep.url,
            },
            isDestructive: false,
            requiresUserConfirmation: false,
        },
        retryCount: 0,
        maxRetries: 3,
        status: 'pending',
    }));
    return {
        id: (0, utils_1.generateId)('plan'),
        intent: `Replay workflow: ${recording.name}`,
        rawCommand: recording.trigger,
        steps,
        estimatedDuration: steps.length * 2000,
        requiresCheckpoint: false,
        context: {}, // No context needed for replay
        status: 'pending',
        currentStepIndex: 0,
        createdAt: Date.now(),
    };
}


/***/ },

/***/ "./electron-main/cdp-bridge.ts"
/*!*************************************!*\
  !*** ./electron-main/cdp-bridge.ts ***!
  \*************************************/
(__unused_webpack_module, exports) {

"use strict";

/**
 * electron-main/cdp-bridge.ts
 * Chrome DevTools Protocol interface via Electron debugger API
 * Dependencies: electron, shared/types
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.attachCDP = attachCDP;
exports.getAccessibilityTree = getAccessibilityTree;
exports.querySelector = querySelector;
exports.clickElement = clickElement;
exports.fillInput = fillInput;
exports.navigateTo = navigateTo;
exports.executeScript = executeScript;
exports.extractPageSource = extractPageSource;
/**
 * Attach CDP session to browser window or web contents view
 */
async function attachCDP(target) {
    try {
        if (!target.webContents.debugger.isAttached()) {
            target.webContents.debugger.attach('1.3');
            console.log('[CDP] Attached to window');
        }
        else {
            console.log('[CDP] Already attached, reusing existing session');
        }
    }
    catch (err) {
        console.error('[CDP] Failed to attach:', err);
        throw err;
    }
    // Return CDP session-like object
    return {
        send: async (method, params) => {
            return await target.webContents.debugger.sendCommand(method, params);
        },
        on: (event, handler) => {
            target.webContents.debugger.on('message', (_, method, params) => {
                if (method === event) {
                    handler(params);
                }
            });
        },
        off: () => {
            // Electron debugger doesn't support selective event removal
        },
    };
}
/**
 * Get full accessibility tree
 */
async function getAccessibilityTree(session) {
    try {
        const result = await session.send('Accessibility.getFullAXTree');
        const nodes = result?.nodes || [];
        // Convert CDP AXNode format to our format
        const converted = nodes.map((node) => convertAXNode(node));
        return converted;
    }
    catch (err) {
        console.error('[CDP] Failed to get AX tree:', err);
        return [];
    }
}
/**
 * Convert CDP AX node to our format
 */
function convertAXNode(node) {
    return {
        nodeId: node.nodeId || '',
        role: node.role?.value || '',
        name: node.name?.value || '',
        value: node.value?.value,
        description: node.description?.value,
        children: [],
        domNodeId: node.backendDOMNodeId,
        properties: node.properties || {},
    };
}
/**
 * Query selector and return node ID
 */
async function querySelector(session, selector) {
    try {
        const result = await session.send('DOM.getDocument');
        const rootNodeId = result?.root?.nodeId;
        if (!rootNodeId)
            return null;
        const queryResult = await session.send('DOM.querySelector', {
            nodeId: rootNodeId,
            selector,
        });
        return queryResult?.nodeId || null;
    }
    catch (err) {
        console.error('[CDP] querySelector failed:', err);
        return null;
    }
}
/**
 * Click element by node ID
 */
async function clickElement(session, nodeId) {
    try {
        // Get box model for click coordinates
        const boxModel = await session.send('DOM.getBoxModel', { nodeId });
        const { content } = boxModel.model;
        // Click at center of element
        const x = (content[0] + content[4]) / 2;
        const y = (content[1] + content[5]) / 2;
        await session.send('Input.dispatchMouseEvent', {
            type: 'mousePressed',
            x,
            y,
            button: 'left',
            clickCount: 1,
        });
        await session.send('Input.dispatchMouseEvent', {
            type: 'mouseReleased',
            x,
            y,
            button: 'left',
            clickCount: 1,
        });
    }
    catch (err) {
        console.error('[CDP] Click failed:', err);
        throw err;
    }
}
/**
 * Fill input field by node ID
 */
async function fillInput(session, nodeId, value) {
    try {
        // Focus the input
        await session.send('DOM.focus', { nodeId });
        // Clear existing value
        await session.send('Input.dispatchKeyEvent', {
            type: 'keyDown',
            key: 'a',
            code: 'KeyA',
            windowsVirtualKeyCode: 65,
            modifiers: 2, // Ctrl/Cmd
        });
        await session.send('Input.dispatchKeyEvent', {
            type: 'keyUp',
            key: 'a',
            code: 'KeyA',
            windowsVirtualKeyCode: 65,
            modifiers: 2,
        });
        // Type new value
        for (const char of value) {
            await session.send('Input.dispatchKeyEvent', {
                type: 'char',
                text: char,
            });
        }
    }
    catch (err) {
        console.error('[CDP] Fill input failed:', err);
        throw err;
    }
}
/**
 * Navigate to URL
 */
async function navigateTo(session, url) {
    try {
        await session.send('Page.navigate', { url });
    }
    catch (err) {
        console.error('[CDP] Navigation failed:', err);
        throw err;
    }
}
/**
 * Execute JavaScript in page context
 */
async function executeScript(session, script) {
    try {
        const result = await session.send('Runtime.evaluate', {
            expression: script,
            returnByValue: true,
        });
        return result?.result?.value;
    }
    catch (err) {
        console.error('[CDP] Script execution failed:', err);
        throw err;
    }
}
/**
 * Extract page source metadata
 */
async function extractPageSource(session) {
    try {
        const url = await executeScript(session, 'window.location.href');
        const title = await executeScript(session, 'document.title');
        return { url, title };
    }
    catch (err) {
        console.error('[CDP] Page source extraction failed:', err);
        return { url: '', title: '' };
    }
}


/***/ },

/***/ "./electron-main/db.ts"
/*!*****************************!*\
  !*** ./electron-main/db.ts ***!
  \*****************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * electron-main/db.ts
 * SQLite initialization and migration runner
 * Dependencies: better-sqlite3, fs, path
 */
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.db = void 0;
exports.initDB = initDB;
exports.closeDB = closeDB;
const better_sqlite3_1 = __importDefault(__webpack_require__(/*! better-sqlite3 */ "./node_modules/better-sqlite3/lib/index.js"));
const fs_1 = __webpack_require__(/*! fs */ "fs");
const path_1 = __webpack_require__(/*! path */ "path");
const electron_1 = __webpack_require__(/*! electron */ "electron");
/**
 * Initialize database with schema
 */
async function initDB() {
    let dbDir = (0, path_1.join)(process.cwd(), 'user-data');
    if (electron_1.app && typeof electron_1.app.getPath === 'function') {
        try {
            dbDir = electron_1.app.getPath('userData');
        }
        catch {
            dbDir = (0, path_1.join)(process.cwd(), 'user-data');
        }
    }
    const dbPath = (0, path_1.join)(dbDir, 'ai-browser.db');
    (0, fs_1.mkdirSync)((0, path_1.dirname)(dbPath), { recursive: true });
    exports.db = new better_sqlite3_1.default(dbPath);
    // Enable WAL mode for concurrent reads
    exports.db.pragma('journal_mode = WAL');
    // Enable foreign keys
    exports.db.pragma('foreign_keys = ON');
    // Locate schema.sql dynamically
    let schemaPath = (0, path_1.join)(__dirname, '..', 'shared', 'schema.sql');
    if (!(0, fs_1.existsSync)(schemaPath)) {
        schemaPath = (0, path_1.join)(__dirname, '..', '..', 'shared', 'schema.sql');
    }
    if (!(0, fs_1.existsSync)(schemaPath)) {
        schemaPath = (0, path_1.join)(__dirname, '..', '..', '..', 'shared', 'schema.sql');
    }
    const schema = (0, fs_1.readFileSync)(schemaPath, 'utf-8');
    // Split by semicolon and execute each statement
    const statements = schema
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0);
    for (const stmt of statements) {
        exports.db.exec(stmt);
    }
    seedIfEmpty(exports.db);
    console.log('[DB] Initialized at:', dbPath);
}
function seedIfEmpty(database) {
    try {
        const profileCount = database.prepare('SELECT count(*) as count FROM user_profile').get()?.count || 0;
        if (profileCount === 0) {
            console.log('[DB] Auto-seeding initial profile and domain memories...');
            database.prepare(`
        INSERT INTO user_profile (id, first_name, last_name, email, phone, address_json, custom_json)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('user-001', 'Alex', 'Chen', 'alex.chen@example.com', '+1 (555) 019-2834', JSON.stringify({
                street: '742 Evergreen Terrace',
                city: 'Springfield',
                state: 'OR',
                zip: '97477',
                country: 'USA',
            }), JSON.stringify({
                timezone: 'America/Los_Angeles',
                language: 'en',
                theme: 'dark',
            }));
            const demoPreferences = {
                favorite_airline: 'United Airlines',
                frequent_flyer_number: 'UA123456789',
                preferred_seat: 'aisle',
                home_airport: 'SFO',
                passport_expiry: '2028-06-15',
                dietary_preference: 'vegetarian',
                credit_card_last4: '4242',
            };
            database.prepare(`
        INSERT OR REPLACE INTO domain_memory (domain, last_visited, form_inputs, preferences, task_history)
        VALUES (?, ?, ?, ?, ?)
      `).run('kayak.com', Date.now(), JSON.stringify({
                email: 'alex.chen@example.com',
                phone: '+1 (555) 019-2834',
                frequent_flyer: 'UA123456789',
            }), JSON.stringify(demoPreferences), JSON.stringify(['Book flight SFO to NYC', 'Search Paris hotels']));
            database.prepare(`
        INSERT OR REPLACE INTO domain_memory (domain, last_visited, form_inputs, preferences, task_history)
        VALUES (?, ?, ?, ?, ?)
      `).run('general', Date.now(), '{}', JSON.stringify(demoPreferences), '[]');
            console.log('[DB] Auto-seed completed successfully.');
        }
    }
    catch (err) {
        console.error('[DB] Auto-seed failed:', err);
    }
}
/**
 * Close database connection
 */
function closeDB() {
    if (exports.db) {
        exports.db.close();
    }
}


/***/ },

/***/ "./electron-main/global-shortcuts.ts"
/*!*******************************************!*\
  !*** ./electron-main/global-shortcuts.ts ***!
  \*******************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * electron-main/global-shortcuts.ts
 * Register keyboard shortcuts scoped to the app window
 * Dependencies: electron, shared/constants
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.registerGlobalShortcuts = registerGlobalShortcuts;
exports.unregisterAll = unregisterAll;
const electron_1 = __webpack_require__(/*! electron */ "electron");
const constants_1 = __webpack_require__(/*! ../shared/constants */ "./shared/constants.ts");
let lastToggleTime = 0;
/**
 * Send toggle with debounce to prevent double-firing from multiple sources
 */
function sendToggle(win, source) {
    const now = Date.now();
    if (now - lastToggleTime < 300)
        return; // Debounce 300ms
    lastToggleTime = now;
    console.log(`[Shortcuts] Ctrl+K triggered via ${source}`);
    win.webContents.send(constants_1.CHANNELS.UI_TOGGLE_COMMAND_BAR);
}
/**
 * Register all shortcuts
 */
function registerGlobalShortcuts(win) {
    // Global shortcut: works even when BrowserView has focus
    const registered = electron_1.globalShortcut.register('CommandOrControl+K', () => {
        sendToggle(win, 'globalShortcut');
    });
    if (!registered) {
        console.warn('[Shortcuts] Failed to register global Cmd+K');
    }
    // Window-level input event: catches keystrokes within the main window
    win.webContents.on('before-input-event', (event, input) => {
        if (input.type === 'keyDown') {
            if ((input.control || input.meta) && input.key.toLowerCase() === 'k') {
                sendToggle(win, 'before-input-event');
                event.preventDefault();
            }
            if (input.key === 'Escape') {
                win.webContents.send(constants_1.CHANNELS.UI_DISMISS_OVERLAYS);
            }
        }
    });
    console.log('[Shortcuts] Global shortcuts registered');
}
/**
 * Unregister all shortcuts
 */
function unregisterAll() {
    electron_1.globalShortcut.unregisterAll();
}


/***/ },

/***/ "./electron-main/ipc-handlers.ts"
/*!***************************************!*\
  !*** ./electron-main/ipc-handlers.ts ***!
  \***************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * electron-main/ipc-handlers.ts
 * All IPC channel registrations
 * Dependencies: electron, agent-core, semantic-parser
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.registerIPCHandlers = registerIPCHandlers;
const electron_1 = __webpack_require__(/*! electron */ "electron");
const fs_1 = __webpack_require__(/*! fs */ "fs");
const path_1 = __webpack_require__(/*! path */ "path");
const constants_1 = __webpack_require__(/*! ../shared/constants */ "./shared/constants.ts");
const semantic_model_builder_1 = __webpack_require__(/*! ../semantic-parser/semantic-model-builder */ "./semantic-parser/semantic-model-builder.ts");
const pipeline_1 = __webpack_require__(/*! ../agent-core/pipeline */ "./agent-core/pipeline.ts");
const memory_manager_1 = __webpack_require__(/*! ../agent-core/memory-manager */ "./agent-core/memory-manager.ts");
const memory_manager_2 = __webpack_require__(/*! ../agent-core/memory-manager */ "./agent-core/memory-manager.ts");
const extractor_1 = __webpack_require__(/*! ../agent-core/extractor */ "./agent-core/extractor.ts");
const workflow_recorder_1 = __webpack_require__(/*! ../agent-core/workflow-recorder */ "./agent-core/workflow-recorder.ts");
const workflow_replayer_1 = __webpack_require__(/*! ../agent-core/workflow-replayer */ "./agent-core/workflow-replayer.ts");
const verifier_1 = __webpack_require__(/*! ../agent-core/verifier */ "./agent-core/verifier.ts");
let currentSession = null;
/**
 * Register all IPC handlers
 */
function registerIPCHandlers(win, session) {
    currentSession = session;
    // Page understanding
    electron_1.ipcMain.handle(constants_1.CHANNELS.PAGE_GET_SEMANTIC_MODEL, async () => {
        if (!currentSession)
            return null;
        try {
            const url = await currentSession.send('Page.getNavigationHistory');
            const currentURL = url?.currentEntry?.url || '';
            return await (0, semantic_model_builder_1.buildSemanticModel)(currentSession, currentURL);
        }
        catch (err) {
            console.error('[IPC] Failed to get semantic model:', err);
            return null;
        }
    });
    electron_1.ipcMain.handle(constants_1.CHANNELS.PAGE_NAVIGATE, async (_, payload) => {
        const { getWebContentView } = __webpack_require__(/*! ./window-manager */ "./electron-main/window-manager.ts");
        const contentView = getWebContentView();
        if (contentView) {
            let targetUrl = payload.url.trim();
            if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
                targetUrl = 'https://' + targetUrl;
            }
            await contentView.webContents.loadURL(targetUrl);
        }
    });
    // Agent task execution
    electron_1.ipcMain.handle(constants_1.CHANNELS.AGENT_RUN_TASK, async (_, payload) => {
        if (!currentSession)
            throw new Error('No CDP session');
        return await (0, pipeline_1.runPipeline)(payload.intent, win, currentSession);
    });
    // Checkpoint resolution
    electron_1.ipcMain.handle(constants_1.CHANNELS.AGENT_CHECKPOINT_RESOLVE, async (_, payload) => {
        (0, verifier_1.resolveCheckpoint)(payload.id, payload.approved);
    });
    // Memory operations
    electron_1.ipcMain.handle(constants_1.CHANNELS.MEMORY_GET_PROFILE, async () => {
        return (0, memory_manager_1.getUserProfile)();
    });
    electron_1.ipcMain.handle(constants_1.CHANNELS.MEMORY_GET_DOMAIN, async (_, payload) => {
        return (0, memory_manager_1.getDomainMemory)(payload.domain);
    });
    electron_1.ipcMain.handle(constants_1.CHANNELS.MEMORY_SET_PROFILE, async (_, payload) => {
        (0, memory_manager_1.setUserProfile)(payload);
    });
    // Workflow operations
    electron_1.ipcMain.handle(constants_1.CHANNELS.WORKFLOW_LIST, async () => {
        return (0, memory_manager_2.listWorkflows)();
    });
    electron_1.ipcMain.handle(constants_1.CHANNELS.WORKFLOW_START_RECORDING, async () => {
        if (!currentSession)
            throw new Error('No CDP session');
        (0, workflow_recorder_1.startRecording)(currentSession);
    });
    electron_1.ipcMain.handle(constants_1.CHANNELS.WORKFLOW_STOP_RECORDING, async (_, payload) => {
        const recording = (0, workflow_recorder_1.stopRecording)(payload.name);
        (0, memory_manager_2.saveWorkflow)(recording);
        return recording;
    });
    electron_1.ipcMain.handle(constants_1.CHANNELS.WORKFLOW_REPLAY, async (_, payload) => {
        const workflow = (0, memory_manager_2.getWorkflow)(payload.id);
        if (!workflow)
            throw new Error('Workflow not found');
        const plan = (0, workflow_replayer_1.replayWorkflow)(workflow);
        if (!currentSession)
            throw new Error('No CDP session');
        // Execute via pipeline
        return await (0, pipeline_1.runPipeline)(plan.rawCommand, win, currentSession);
    });
    // Data extraction
    electron_1.ipcMain.handle(constants_1.CHANNELS.EXTRACT_PAGE_DATA, async (_, payload) => {
        if (!currentSession)
            throw new Error('No CDP session');
        const url = await currentSession.send('Page.getNavigationHistory');
        const currentURL = url?.currentEntry?.url || '';
        const model = await (0, semantic_model_builder_1.buildSemanticModel)(currentSession, currentURL);
        const content = payload.format === 'json' ? (0, extractor_1.extractToJSON)(model) : (0, extractor_1.extractToCSV)(model);
        const safeTitle = (model.title || model.pageIntent || 'page-data')
            .replace(/[^a-z0-9]+/gi, '-')
            .replace(/^-|-$/g, '')
            .slice(0, 48) || 'page-data';
        const filePath = (0, path_1.join)(electron_1.app.getPath('downloads'), `${safeTitle}-${Date.now()}.${payload.format}`);
        (0, fs_1.writeFileSync)(filePath, content, 'utf8');
        return { content, path: filePath, format: payload.format };
    });
    // Tab operations (stub for MVP)
    electron_1.ipcMain.handle(constants_1.CHANNELS.TABS_GET_GROUPS, async () => {
        return [];
    });
    electron_1.ipcMain.handle(constants_1.CHANNELS.TABS_GROUP_BY_INTENT, async () => {
        return [];
    });
    console.log('[IPC] All handlers registered');
}


/***/ },

/***/ "./electron-main/window-manager.ts"
/*!*****************************************!*\
  !*** ./electron-main/window-manager.ts ***!
  \*****************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * electron-main/window-manager.ts
 * Creates and manages browser windows and web content views
 * Dependencies: electron, path
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.createMainWindow = createMainWindow;
exports.getWebContentView = getWebContentView;
exports.getMainWindow = getMainWindow;
const electron_1 = __webpack_require__(/*! electron */ "electron");
const path_1 = __webpack_require__(/*! path */ "path");
let mainWindow = null;
let webContentView = null;
/**
 * Create main browser window
 */
async function createMainWindow() {
    mainWindow = new electron_1.BrowserWindow({
        width: 1400,
        height: 900,
        title: 'AI-Native Execution Browser',
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            preload: (0, path_1.join)(__dirname, 'preload.js'),
        },
    });
    // Load React UI in main window
    if (true) {
        await mainWindow.loadURL('http://localhost:5173');
    }
    else // removed by dead control flow
{}
    // Create web content view for browsing pages
    createContentView();
    // Handle window resize
    mainWindow.on('resize', () => {
        positionContentView();
    });
    return mainWindow;
}
/**
 * Create web content view for target web pages
 */
function createContentView() {
    if (!mainWindow)
        return;
    webContentView = new electron_1.BrowserView({
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
        },
    });
    mainWindow.addBrowserView(webContentView);
    webContentView.webContents.loadURL('https://example.com');
    positionContentView();
}
/**
 * Position content view on left, leaving 340px for sidebar on right
 */
function positionContentView() {
    if (!webContentView || !mainWindow)
        return;
    const bounds = mainWindow.getContentBounds();
    const sidebarWidth = 340;
    const headerHeight = 48;
    webContentView.setBounds({
        x: 0,
        y: headerHeight,
        width: Math.max(bounds.width - sidebarWidth, 400),
        height: Math.max(bounds.height - headerHeight, 200),
    });
}
/**
 * Get web content view (for CDP attachment and page navigation)
 */
function getWebContentView() {
    return webContentView;
}
/**
 * Get main window
 */
function getMainWindow() {
    return mainWindow;
}


/***/ },

/***/ "./semantic-parser/action-discoverer.ts"
/*!**********************************************!*\
  !*** ./semantic-parser/action-discoverer.ts ***!
  \**********************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * semantic-parser/action-discoverer.ts
 * Discovers clickable actions with semantic labels
 * Dependencies: shared/types, shared/utils
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.discoverActions = discoverActions;
const utils_1 = __webpack_require__(/*! ../shared/utils */ "./shared/utils.ts");
/**
 * Discover page actions from nodes
 */
function discoverActions(nodes) {
    const actions = [];
    for (const node of nodes) {
        // Buttons
        if (node.role === 'button' && node.name) {
            actions.push(createAction(node, 'click', 'cta'));
        }
        // Links
        if (node.role === 'link' && node.name) {
            const href = node.properties?.href;
            const type = href && href.startsWith('http') ? 'navigate' : 'click';
            actions.push(createAction(node, type, 'navigation', href));
        }
        // Submit inputs
        if (node.role === 'button' && /submit|send|continue/i.test(node.name || '')) {
            actions.push(createAction(node, 'submit', 'form'));
        }
    }
    return deduplicateActions(actions);
}
/**
 * Create action object
 */
function createAction(node, type, context, href) {
    return {
        id: (0, utils_1.generateId)('action'),
        label: node.name || '',
        selector: generateSelector(node),
        type,
        context,
        href,
    };
}
/**
 * Generate selector for node
 */
function generateSelector(node) {
    if (node.domNodeId) {
        return `[data-node-id="${node.domNodeId}"]`;
    }
    if (node.name) {
        return `[aria-label="${node.name}"]`;
    }
    return '';
}
/**
 * Deduplicate actions by label
 */
function deduplicateActions(actions) {
    const seen = new Set();
    return actions.filter(action => {
        if (seen.has(action.label))
            return false;
        seen.add(action.label);
        return true;
    });
}


/***/ },

/***/ "./semantic-parser/document-detector.ts"
/*!**********************************************!*\
  !*** ./semantic-parser/document-detector.ts ***!
  \**********************************************/
(__unused_webpack_module, exports) {

"use strict";

/**
 * semantic-parser/document-detector.ts
 * Detects PDFs, invoices, bills, and other downloadable documents
 * Dependencies: shared/types, shared/utils
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.detectDocuments = detectDocuments;
/**
 * Detect documents in accessibility tree
 */
function detectDocuments(nodes) {
    const documents = [];
    for (const node of nodes) {
        if (node.role !== 'link')
            continue;
        const href = node.properties?.href;
        const name = node.name || '';
        if (!href)
            continue;
        // Detect PDFs
        if (href.toLowerCase().endsWith('.pdf')) {
            documents.push({
                type: 'pdf',
                url: href,
                title: name || 'PDF Document',
                selector: generateSelector(node),
            });
            continue;
        }
        // Detect invoices
        if (/invoice|bill|statement|receipt/i.test(name)) {
            const type = detectDocType(name);
            documents.push({
                type,
                url: href,
                title: name,
                selector: generateSelector(node),
            });
            continue;
        }
        // Detect spreadsheets
        if (/(\.xlsx?|\.csv|spreadsheet)/i.test(href)) {
            documents.push({
                type: 'spreadsheet',
                url: href,
                title: name || 'Spreadsheet',
                selector: generateSelector(node),
            });
        }
    }
    return documents;
}
/**
 * Detect specific document type from text
 */
function detectDocType(text) {
    const lower = text.toLowerCase();
    if (lower.includes('invoice'))
        return 'invoice';
    if (lower.includes('bill'))
        return 'bill';
    if (lower.includes('report'))
        return 'report';
    return 'pdf';
}
/**
 * Generate selector for node
 */
function generateSelector(node) {
    const href = node.properties?.href;
    if (href) {
        return `a[href="${href}"]`;
    }
    if (node.name) {
        return `a[aria-label="${node.name}"]`;
    }
    return 'a';
}


/***/ },

/***/ "./semantic-parser/dom-extractor.ts"
/*!******************************************!*\
  !*** ./semantic-parser/dom-extractor.ts ***!
  \******************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * semantic-parser/dom-extractor.ts
 * Fetches and normalizes accessibility tree from CDP
 * Dependencies: electron-main/cdp-bridge, shared/types, shared/constants
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.extractAXTree = extractAXTree;
exports.flattenTree = flattenTree;
exports.filterRelevantNodes = filterRelevantNodes;
exports.buildTreeFromFlat = buildTreeFromFlat;
const constants_1 = __webpack_require__(/*! ../shared/constants */ "./shared/constants.ts");
const cdp_bridge_1 = __webpack_require__(/*! ../electron-main/cdp-bridge */ "./electron-main/cdp-bridge.ts");
/**
 * Extract accessibility tree from CDP
 */
async function extractAXTree(session) {
    try {
        const nodes = await (0, cdp_bridge_1.getAccessibilityTree)(session);
        return nodes;
    }
    catch (err) {
        console.error('[DOM Extractor] Failed to extract AX tree:', err);
        return [];
    }
}
/**
 * Flatten tree structure to array
 */
function flattenTree(root) {
    const result = [];
    function traverse(node) {
        result.push(node);
        for (const child of node.children || []) {
            traverse(child);
        }
    }
    traverse(root);
    return result;
}
/**
 * Filter out irrelevant nodes
 */
function filterRelevantNodes(nodes) {
    return nodes.filter(node => {
        // Remove explicitly excluded roles
        if (constants_1.PARSER_CONFIG.EXCLUDED_ROLES.includes(node.role)) {
            return false;
        }
        // Remove generic nodes with no name
        if (node.role === 'generic' && !node.name) {
            return false;
        }
        // Remove hidden nodes
        const isHidden = node.properties?.hidden === true;
        if (isHidden) {
            return false;
        }
        return true;
    });
}
/**
 * Build tree structure from flat array
 */
function buildTreeFromFlat(nodes) {
    if (nodes.length === 0)
        return null;
    const nodeMap = new Map();
    const childrenMap = new Map();
    // First pass: build maps
    for (const node of nodes) {
        nodeMap.set(node.nodeId, { ...node, children: [] });
    }
    // Second pass: build tree
    let root = null;
    for (const node of nodes) {
        if (!node.nodeId)
            continue;
        // First node is typically root
        if (!root) {
            root = nodeMap.get(node.nodeId) || null;
        }
    }
    return root;
}


/***/ },

/***/ "./semantic-parser/dom-semantic-extractor.ts"
/*!***************************************************!*\
  !*** ./semantic-parser/dom-semantic-extractor.ts ***!
  \***************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * DOM-backed semantic extraction.
 * The accessibility tree is useful context, but CDP AX node ids are not executable selectors.
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.extractDOMSemantics = extractDOMSemantics;
const constants_1 = __webpack_require__(/*! ../shared/constants */ "./shared/constants.ts");
const utils_1 = __webpack_require__(/*! ../shared/utils */ "./shared/utils.ts");
const cdp_bridge_1 = __webpack_require__(/*! ../electron-main/cdp-bridge */ "./electron-main/cdp-bridge.ts");
async function extractDOMSemantics(session) {
    const raw = await (0, cdp_bridge_1.executeScript)(session, DOM_EXTRACTION_SCRIPT);
    return {
        entities: detectEntitiesFromText(raw.text || ''),
        forms: raw.forms.map(toSemanticForm),
        actions: dedupeActions(raw.actions.map(toPageAction)),
        documents: raw.documents.map((doc) => ({
            type: doc.type,
            url: doc.url,
            title: doc.title,
            selector: doc.selector,
            size: doc.size,
        })),
        metadata: raw.metadata || {},
    };
}
function toSemanticForm(raw) {
    const fields = raw.fields.map(toFormField);
    return {
        id: (0, utils_1.generateId)('form'),
        formSelector: raw.selector,
        submitSelector: raw.submitSelector,
        fields,
        isDestructive: isDestructiveForm(fields, raw.submitLabel),
        submitLabel: raw.submitLabel,
    };
}
function toFormField(raw) {
    return {
        id: (0, utils_1.generateId)('field'),
        label: raw.label || raw.placeholder || raw.inputType,
        semanticType: inferFieldType(raw),
        selector: raw.selector,
        required: raw.required,
        inputType: raw.inputType,
        currentValue: raw.currentValue,
        placeholder: raw.placeholder,
        options: raw.options,
    };
}
function toPageAction(raw) {
    return {
        id: (0, utils_1.generateId)('action'),
        label: raw.label,
        selector: raw.selector,
        type: raw.type,
        context: raw.context,
        href: raw.href,
    };
}
function inferFieldType(field) {
    const text = [field.label, field.placeholder, field.inputType].filter(Boolean).join(' ');
    for (const [pattern, type] of constants_1.FIELD_TYPE_RULES) {
        pattern.lastIndex = 0;
        if (pattern.test(text))
            return type;
    }
    return 'generic';
}
function isDestructiveForm(fields, submitLabel = '') {
    const hasPaymentField = fields.some((field) => ['creditCard', 'cvv', 'expiry'].includes(field.semanticType));
    const destructiveLabel = /pay|purchase|checkout|submit|delete|remove|send|confirm/i.test(submitLabel);
    return hasPaymentField || destructiveLabel;
}
function detectEntitiesFromText(text) {
    const entities = [];
    const addMatches = (type, pattern, confidence) => {
        pattern.lastIndex = 0;
        const seen = new Set();
        for (const match of text.matchAll(pattern)) {
            const value = match[0].trim();
            if (!value || seen.has(value))
                continue;
            seen.add(value);
            entities.push({
                id: (0, utils_1.generateId)('entity'),
                type,
                value,
                confidence,
                domSelector: 'body',
            });
        }
    };
    addMatches('price', constants_1.ENTITY_PATTERNS.PRICE, 0.9);
    addMatches('date', constants_1.ENTITY_PATTERNS.DATE, 0.82);
    addMatches('email', constants_1.ENTITY_PATTERNS.EMAIL, 0.95);
    addMatches('phone', constants_1.ENTITY_PATTERNS.PHONE, 0.85);
    addMatches('url', constants_1.ENTITY_PATTERNS.URL, 0.8);
    addMatches('percentage', constants_1.ENTITY_PATTERNS.PERCENTAGE, 0.78);
    addMatches('order-number', constants_1.ENTITY_PATTERNS.ORDER_NUMBER, 0.75);
    return entities.slice(0, 100);
}
function dedupeActions(actions) {
    const seen = new Set();
    return actions.filter((action) => {
        const key = `${action.type}:${action.label}:${action.selector}`;
        if (seen.has(key))
            return false;
        seen.add(key);
        return Boolean(action.label && action.selector);
    }).slice(0, 80);
}
const DOM_EXTRACTION_SCRIPT = `(() => {
  const cssEscape = (value) => {
    if (window.CSS && CSS.escape) return CSS.escape(value);
    return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\\\$&');
  };

  const isVisible = (el) => {
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    return style.display !== 'none' && style.visibility !== 'hidden' && Number(style.opacity) !== 0 && rect.width > 0 && rect.height > 0;
  };

  const selectorFor = (el) => {
    if (!el || el.nodeType !== 1) return '';
    if (el.id) return '#' + cssEscape(el.id);
    const testId = el.getAttribute('data-testid') || el.getAttribute('data-test') || el.getAttribute('name');
    if (testId) return el.tagName.toLowerCase() + '[' + (el.getAttribute('name') ? 'name' : el.getAttribute('data-testid') ? 'data-testid' : 'data-test') + '="' + testId.replace(/"/g, '\\\\"') + '"]';
    const aria = el.getAttribute('aria-label');
    if (aria) return el.tagName.toLowerCase() + '[aria-label="' + aria.replace(/"/g, '\\\\"') + '"]';

    const parts = [];
    let node = el;
    while (node && node.nodeType === 1 && node !== document.body && parts.length < 5) {
      let part = node.tagName.toLowerCase();
      const parent = node.parentElement;
      if (!parent) break;
      const sameTag = Array.from(parent.children).filter((child) => child.tagName === node.tagName);
      if (sameTag.length > 1) part += ':nth-of-type(' + (sameTag.indexOf(node) + 1) + ')';
      parts.unshift(part);
      node = parent;
    }
    return parts.join(' > ');
  };

  const textOf = (el) => (el.innerText || el.textContent || '').replace(/\\s+/g, ' ').trim();

  const labelFor = (field) => {
    if (field.getAttribute('aria-label')) return field.getAttribute('aria-label');
    if (field.labels && field.labels.length) return Array.from(field.labels).map(textOf).join(' ').trim();
    if (field.id) {
      const label = document.querySelector('label[for="' + cssEscape(field.id) + '"]');
      if (label) return textOf(label);
    }
    const wrapper = field.closest('label');
    if (wrapper) return textOf(wrapper).replace(textOf(field), '').trim() || textOf(wrapper);
    return field.getAttribute('placeholder') || field.getAttribute('name') || field.getAttribute('type') || field.tagName.toLowerCase();
  };

  const fieldNodes = Array.from(document.querySelectorAll('input, textarea, select')).filter((el) => {
    const type = (el.getAttribute('type') || '').toLowerCase();
    return !['hidden', 'submit', 'button', 'reset', 'image'].includes(type) && isVisible(el);
  });

  const forms = Array.from(document.querySelectorAll('form')).map((form) => {
    const fields = fieldNodes.filter((field) => form.contains(field));
    const submit = form.querySelector('button[type="submit"], input[type="submit"], button:not([type]), [role="button"]');
    return {
      selector: selectorFor(form),
      submitSelector: selectorFor(submit),
      submitLabel: submit ? (submit.value || textOf(submit) || submit.getAttribute('aria-label') || 'Submit') : '',
      fields: fields.map((field) => ({
        label: labelFor(field),
        selector: selectorFor(field),
        required: Boolean(field.required || field.getAttribute('aria-required') === 'true'),
        inputType: (field.getAttribute('type') || field.tagName.toLowerCase()).toLowerCase(),
        currentValue: field.value || '',
        placeholder: field.getAttribute('placeholder') || '',
        options: field.tagName.toLowerCase() === 'select'
          ? Array.from(field.options).map((option) => ({ value: option.value, label: option.textContent.trim() }))
          : undefined,
      })),
    };
  }).filter((form) => form.fields.length > 0);

  const orphanFields = fieldNodes.filter((field) => !field.closest('form'));
  if (orphanFields.length > 0) {
    const submit = document.querySelector('button[type="submit"], input[type="submit"], button, [role="button"]');
    forms.push({
      selector: 'body',
      submitSelector: selectorFor(submit),
      submitLabel: submit ? (submit.value || textOf(submit) || submit.getAttribute('aria-label') || 'Submit') : '',
      fields: orphanFields.map((field) => ({
        label: labelFor(field),
        selector: selectorFor(field),
        required: Boolean(field.required || field.getAttribute('aria-required') === 'true'),
        inputType: (field.getAttribute('type') || field.tagName.toLowerCase()).toLowerCase(),
        currentValue: field.value || '',
        placeholder: field.getAttribute('placeholder') || '',
        options: field.tagName.toLowerCase() === 'select'
          ? Array.from(field.options).map((option) => ({ value: option.value, label: option.textContent.trim() }))
          : undefined,
      })),
    });
  }

  const actionNodes = Array.from(document.querySelectorAll('button, a[href], input[type="button"], input[type="submit"], [role="button"]')).filter(isVisible);
  const actions = actionNodes.map((el) => {
    const href = el.href || el.getAttribute('href') || '';
    const label = (el.value || textOf(el) || el.getAttribute('aria-label') || el.getAttribute('title') || href || '').trim();
    const lower = label.toLowerCase();
    const type = el.tagName.toLowerCase() === 'a'
      ? 'navigate'
      : /submit|send|continue|confirm|pay|purchase|checkout|save/i.test(lower)
        ? 'submit'
        : 'click';
    return {
      label: label.slice(0, 120),
      selector: selectorFor(el),
      type,
      context: el.closest('form') ? 'form' : el.tagName.toLowerCase() === 'a' ? 'navigation' : 'button',
      href: href || undefined,
    };
  }).filter((action) => action.label && action.selector);

  const documents = Array.from(document.querySelectorAll('a[href]')).map((el) => {
    const href = new URL(el.getAttribute('href'), window.location.href).href;
    const label = textOf(el) || href.split('/').pop() || 'Document';
    const lower = (href + ' ' + label).toLowerCase();
    if (!/\\.pdf($|[?#])|invoice|bill|statement|report|\\.csv($|[?#])|\\.xlsx($|[?#])/.test(lower)) return null;
    let type = 'report';
    if (lower.includes('.pdf')) type = 'pdf';
    if (lower.includes('invoice')) type = 'invoice';
    if (lower.includes('bill') || lower.includes('statement')) type = 'bill';
    if (/\\.csv|\\.xlsx/.test(lower)) type = 'spreadsheet';
    return { type, url: href, title: label, selector: selectorFor(el) };
  }).filter(Boolean);

  const meta = {};
  document.querySelectorAll('meta[name], meta[property]').forEach((el) => {
    const key = el.getAttribute('name') || el.getAttribute('property');
    const value = el.getAttribute('content');
    if (key && value) meta[key] = value;
  });

  return {
    text: document.body ? document.body.innerText.slice(0, 50000) : '',
    forms,
    actions,
    documents,
    metadata: meta,
  };
})()`;


/***/ },

/***/ "./semantic-parser/entity-detector.ts"
/*!********************************************!*\
  !*** ./semantic-parser/entity-detector.ts ***!
  \********************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * semantic-parser/entity-detector.ts
 * Detects semantic entities using regex patterns
 * Dependencies: shared/types, shared/constants, shared/utils
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.detectEntities = detectEntities;
const constants_1 = __webpack_require__(/*! ../shared/constants */ "./shared/constants.ts");
const utils_1 = __webpack_require__(/*! ../shared/utils */ "./shared/utils.ts");
/**
 * Detect entities from accessibility tree nodes
 */
function detectEntities(nodes) {
    const entities = [];
    for (const node of nodes) {
        const text = [node.name, node.value, node.description]
            .filter(Boolean)
            .join(' ');
        if (!text)
            continue;
        // Detect prices
        const priceMatches = text.matchAll(constants_1.ENTITY_PATTERNS.PRICE);
        for (const match of priceMatches) {
            entities.push(createEntity('price', match[0], node, 0.9));
        }
        // Detect dates
        const dateMatches = text.matchAll(constants_1.ENTITY_PATTERNS.DATE);
        for (const match of dateMatches) {
            entities.push(createEntity('date', match[0], node, 0.85));
        }
        // Detect emails
        const emailMatches = text.matchAll(constants_1.ENTITY_PATTERNS.EMAIL);
        for (const match of emailMatches) {
            entities.push(createEntity('email', match[0], node, 0.95));
        }
        // Detect phone numbers
        const phoneMatches = text.matchAll(constants_1.ENTITY_PATTERNS.PHONE);
        for (const match of phoneMatches) {
            entities.push(createEntity('phone', match[0], node, 0.85));
        }
        // Detect URLs
        const urlMatches = text.matchAll(constants_1.ENTITY_PATTERNS.URL);
        for (const match of urlMatches) {
            entities.push(createEntity('url', match[0], node, 0.95));
        }
        // Detect percentages
        const percentMatches = text.matchAll(constants_1.ENTITY_PATTERNS.PERCENTAGE);
        for (const match of percentMatches) {
            entities.push(createEntity('percentage', match[0], node, 0.9));
        }
        // Detect order numbers
        const orderMatches = text.matchAll(constants_1.ENTITY_PATTERNS.ORDER_NUMBER);
        for (const match of orderMatches) {
            entities.push(createEntity('order-number', match[1], node, 0.8));
        }
    }
    // Deduplicate by value
    return deduplicateEntities(entities);
}
/**
 * Create entity object
 */
function createEntity(type, value, node, confidence) {
    return {
        id: (0, utils_1.generateId)('entity'),
        type,
        value: value.trim(),
        normalizedValue: normalizeEntityValue(type, value),
        confidence,
        domSelector: generateSelector(node),
    };
}
/**
 * Normalize entity value
 */
function normalizeEntityValue(type, value) {
    switch (type) {
        case 'price':
            // Extract numeric value
            return value.replace(/[^0-9.]/g, '');
        case 'phone':
            // Remove formatting
            return value.replace(/[^0-9]/g, '');
        case 'percentage':
            // Extract numeric value
            return value.replace('%', '').trim();
        default:
            return value.trim();
    }
}
/**
 * Generate CSS selector for node
 */
function generateSelector(node) {
    // ponytail: simple selector generation, upgrade to full xpath if needed
    if (node.domNodeId) {
        return `[data-node-id="${node.domNodeId}"]`;
    }
    if (node.name) {
        return `[aria-label="${node.name}"]`;
    }
    return '';
}
/**
 * Deduplicate entities by value
 */
function deduplicateEntities(entities) {
    const seen = new Set();
    return entities.filter(entity => {
        const key = `${entity.type}:${entity.value}`;
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
}


/***/ },

/***/ "./semantic-parser/form-analyzer.ts"
/*!******************************************!*\
  !*** ./semantic-parser/form-analyzer.ts ***!
  \******************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * semantic-parser/form-analyzer.ts
 * Analyzes forms and infers semantic field types
 * Dependencies: shared/types, shared/constants, shared/utils
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.analyzeForms = analyzeForms;
exports.inferFieldType = inferFieldType;
const constants_1 = __webpack_require__(/*! ../shared/constants */ "./shared/constants.ts");
const utils_1 = __webpack_require__(/*! ../shared/utils */ "./shared/utils.ts");
/**
 * Analyze forms in accessibility tree
 */
function analyzeForms(nodes) {
    const forms = [];
    // Find form containers
    const formNodes = nodes.filter(n => n.role === 'form' || hasFormElements(n, nodes));
    for (const formNode of formNodes) {
        const fields = extractFields(formNode, nodes);
        if (fields.length === 0)
            continue;
        const submitButton = findSubmitButton(formNode, nodes);
        const isDestructive = detectDestructiveForm(fields, submitButton);
        forms.push({
            id: (0, utils_1.generateId)('form'),
            formSelector: generateFormSelector(formNode),
            submitSelector: submitButton?.nodeId ? `[data-node-id="${submitButton.nodeId}"]` : '',
            fields,
            isDestructive,
            submitLabel: submitButton?.name || undefined,
        });
    }
    return forms;
}
/**
 * Check if node has form elements
 */
function hasFormElements(node, allNodes) {
    const inputRoles = ['textbox', 'combobox', 'checkbox', 'radio'];
    const children = getNodeChildren(node, allNodes);
    return children.some(child => inputRoles.includes(child.role));
}
/**
 * Get children of a node
 */
function getNodeChildren(node, allNodes) {
    // ponytail: simple linear search, O(n) but forms are small
    return node.children || [];
}
/**
 * Extract fields from form
 */
function extractFields(formNode, allNodes) {
    const fields = [];
    function traverse(node) {
        const inputRoles = ['textbox', 'combobox', 'checkbox', 'radio'];
        if (inputRoles.includes(node.role)) {
            const field = createField(node);
            if (field)
                fields.push(field);
        }
        for (const child of node.children || []) {
            traverse(child);
        }
    }
    traverse(formNode);
    return fields;
}
/**
 * Create field object from node
 */
function createField(node) {
    const label = node.name || node.description || '';
    if (!label)
        return null;
    const semanticType = inferFieldType(node);
    const placeholder = node.properties?.placeholder || undefined;
    const required = node.properties?.required === true;
    const inputType = node.properties?.type || 'text';
    // Extract select options if combobox
    const options = node.role === 'combobox' ? extractSelectOptions(node) : undefined;
    return {
        id: (0, utils_1.generateId)('field'),
        label,
        semanticType,
        selector: `[aria-label="${label}"]`,
        required,
        inputType,
        currentValue: node.value,
        placeholder,
        options,
    };
}
/**
 * Infer semantic field type from node
 */
function inferFieldType(node) {
    const text = [node.name, node.description, node.properties?.placeholder]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
    // Check against type inference rules
    for (const [pattern, type] of constants_1.FIELD_TYPE_RULES) {
        if (pattern.test(text)) {
            return type;
        }
    }
    return 'generic';
}
/**
 * Extract select options from combobox
 */
function extractSelectOptions(node) {
    const options = [];
    function traverse(n) {
        if (n.role === 'option') {
            options.push({
                value: n.value || n.name || '',
                label: n.name || '',
            });
        }
        for (const child of n.children || []) {
            traverse(child);
        }
    }
    traverse(node);
    return options;
}
/**
 * Find submit button in form
 */
function findSubmitButton(formNode, allNodes) {
    function traverse(node) {
        if (node.role === 'button') {
            const name = (node.name || '').toLowerCase();
            if (name.includes('submit') || name.includes('continue') || name.includes('next')) {
                return node;
            }
        }
        for (const child of node.children || []) {
            const result = traverse(child);
            if (result)
                return result;
        }
        return null;
    }
    return traverse(formNode);
}
/**
 * Detect if form is destructive (payment, checkout, delete)
 */
function detectDestructiveForm(fields, submitButton) {
    // Check for payment fields
    const hasPaymentFields = fields.some(f => f.semanticType === 'creditCard' || f.semanticType === 'cvv');
    if (hasPaymentFields)
        return true;
    // Check submit button text
    if (submitButton) {
        const btnText = (submitButton.name || '').toLowerCase();
        if (btnText.includes('pay') || btnText.includes('purchase') || btnText.includes('checkout')) {
            return true;
        }
        if (btnText.includes('delete') || btnText.includes('remove')) {
            return true;
        }
    }
    return false;
}
/**
 * Generate form selector
 */
function generateFormSelector(node) {
    if (node.domNodeId) {
        return `form[data-node-id="${node.domNodeId}"]`;
    }
    return 'form';
}


/***/ },

/***/ "./semantic-parser/page-classifier.ts"
/*!********************************************!*\
  !*** ./semantic-parser/page-classifier.ts ***!
  \********************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * semantic-parser/page-classifier.ts
 * Classifies page intent from URL and DOM signals
 * Dependencies: shared/types, shared/constants
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.classifyIntent = classifyIntent;
const constants_1 = __webpack_require__(/*! ../shared/constants */ "./shared/constants.ts");
/**
 * Classify page intent from URL and nodes
 */
function classifyIntent(url, nodes) {
    // Try URL patterns first
    for (const [pattern, intent] of constants_1.INTENT_PATTERNS) {
        if (pattern.test(url)) {
            return intent;
        }
    }
    // Analyze DOM structure
    const hasPaymentFields = nodes.some(n => {
        const text = (n.name || '').toLowerCase();
        return text.includes('card number') || text.includes('cvv');
    });
    if (hasPaymentFields)
        return 'checkout';
    const hasLoginFields = nodes.some(n => {
        const text = (n.name || '').toLowerCase();
        return text.includes('username') || text.includes('password');
    });
    if (hasLoginFields)
        return 'login';
    const hasFormFields = nodes.some(n => n.role === 'textbox' || n.role === 'combobox');
    if (hasFormFields)
        return 'form-fill';
    const hasProductCards = nodes.filter(n => {
        const text = (n.name || '').toLowerCase();
        return text.includes('$') || text.includes('price');
    }).length > 3;
    if (hasProductCards)
        return 'product-listing';
    const hasArticleContent = nodes.some(n => n.role === 'article');
    if (hasArticleContent)
        return 'article';
    const hasDashboardElements = nodes.some(n => {
        const text = (n.name || '').toLowerCase();
        return text.includes('dashboard') || text.includes('overview');
    });
    if (hasDashboardElements)
        return 'dashboard';
    return 'unknown';
}


/***/ },

/***/ "./semantic-parser/semantic-model-builder.ts"
/*!***************************************************!*\
  !*** ./semantic-parser/semantic-model-builder.ts ***!
  \***************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * semantic-parser/semantic-model-builder.ts
 * Orchestrates all sub-parsers to build complete SemanticPageModel
 * Dependencies: all semantic-parser modules, electron-main/cdp-bridge
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.buildSemanticModel = buildSemanticModel;
const dom_extractor_1 = __webpack_require__(/*! ./dom-extractor */ "./semantic-parser/dom-extractor.ts");
const entity_detector_1 = __webpack_require__(/*! ./entity-detector */ "./semantic-parser/entity-detector.ts");
const form_analyzer_1 = __webpack_require__(/*! ./form-analyzer */ "./semantic-parser/form-analyzer.ts");
const page_classifier_1 = __webpack_require__(/*! ./page-classifier */ "./semantic-parser/page-classifier.ts");
const document_detector_1 = __webpack_require__(/*! ./document-detector */ "./semantic-parser/document-detector.ts");
const action_discoverer_1 = __webpack_require__(/*! ./action-discoverer */ "./semantic-parser/action-discoverer.ts");
const cdp_bridge_1 = __webpack_require__(/*! ../electron-main/cdp-bridge */ "./electron-main/cdp-bridge.ts");
const dom_semantic_extractor_1 = __webpack_require__(/*! ./dom-semantic-extractor */ "./semantic-parser/dom-semantic-extractor.ts");
/**
 * Build complete semantic page model
 */
async function buildSemanticModel(session, url) {
    try {
        // Get page metadata and accessibility tree in parallel
        const [pageInfo, axTree] = await Promise.all([
            (0, cdp_bridge_1.extractPageSource)(session),
            (0, dom_extractor_1.extractAXTree)(session),
        ]);
        // Process tree
        let nodes = axTree;
        if (nodes.length > 0 && nodes[0].children) {
            const flat = (0, dom_extractor_1.flattenTree)(nodes[0]);
            nodes = (0, dom_extractor_1.filterRelevantNodes)(flat);
        }
        // Run all parsers in parallel. DOM semantics provide executable selectors;
        // AX semantics add accessibility-only context where available.
        const [entities, forms, actions, documents, intent, dom] = await Promise.all([
            Promise.resolve((0, entity_detector_1.detectEntities)(nodes)),
            Promise.resolve((0, form_analyzer_1.analyzeForms)(nodes)),
            Promise.resolve((0, action_discoverer_1.discoverActions)(nodes)),
            Promise.resolve((0, document_detector_1.detectDocuments)(nodes)),
            Promise.resolve((0, page_classifier_1.classifyIntent)(url, nodes)),
            (0, dom_semantic_extractor_1.extractDOMSemantics)(session).catch((err) => {
                console.error('[Semantic Model Builder] DOM extraction failed:', err);
                return { entities: [], forms: [], actions: [], documents: [], metadata: {} };
            }),
        ]);
        // Extract navigation items
        const navigation = extractNavItems(nodes);
        return {
            url: pageInfo.url || url,
            title: pageInfo.title || '',
            pageIntent: intent === 'unknown' ? inferIntentFromDOM(dom, url) : intent,
            timestamp: Date.now(),
            entities: mergeByKey(dom.entities, entities, (entity) => `${entity.type}:${entity.value}`),
            forms: dom.forms.length > 0 ? dom.forms : forms,
            actions: mergeByKey(dom.actions, actions, (action) => `${action.type}:${action.label}`),
            navigation,
            documents: mergeByKey(dom.documents, documents, (document) => `${document.type}:${document.url}`),
            metadata: dom.metadata,
        };
    }
    catch (err) {
        console.error('[Semantic Model Builder] Failed:', err);
        // Return empty model on error
        return {
            url,
            title: '',
            pageIntent: 'unknown',
            timestamp: Date.now(),
            entities: [],
            forms: [],
            actions: [],
            navigation: [],
            documents: [],
            metadata: {},
        };
    }
}
function mergeByKey(primary, secondary, keyFor) {
    const seen = new Set();
    const merged = [];
    for (const item of [...primary, ...secondary]) {
        const key = keyFor(item);
        if (seen.has(key))
            continue;
        seen.add(key);
        merged.push(item);
    }
    return merged;
}
function inferIntentFromDOM(dom, url) {
    const combined = `${url} ${dom.actions.map((a) => a.label).join(' ')}`.toLowerCase();
    if (dom.documents.length > 0 || /pdf|invoice|bill|statement|document/.test(combined))
        return 'document';
    if (dom.forms.some((form) => form.isDestructive) || /checkout|payment|cart|pay/.test(combined))
        return 'checkout';
    if (dom.forms.length > 0)
        return /login|sign in|password/.test(combined) ? 'login' : 'form-fill';
    if (dom.entities.some((entity) => entity.type === 'price') || /product|shop|buy/.test(combined))
        return 'product-listing';
    if (/search|query|results/.test(combined))
        return 'search';
    return 'unknown';
}
/**
 * Extract navigation items from nodes
 */
function extractNavItems(nodes) {
    const navItems = [];
    // Find navigation role nodes
    const navNodes = nodes.filter(n => n.role === 'navigation');
    for (const navNode of navNodes) {
        // Find links within navigation
        const links = findLinksInSubtree(navNode, nodes);
        navItems.push(...links);
    }
    // Limit to first 20 nav items
    return navItems.slice(0, 20);
}
/**
 * Find all links in subtree
 */
function findLinksInSubtree(node, allNodes) {
    const links = [];
    function traverse(n) {
        if (n.role === 'link' && n.name) {
            const href = n.properties?.href;
            if (href) {
                links.push({
                    label: n.name,
                    href,
                });
            }
        }
        for (const child of n.children || []) {
            traverse(child);
        }
    }
    traverse(node);
    return links;
}


/***/ },

/***/ "./shared/constants.ts"
/*!*****************************!*\
  !*** ./shared/constants.ts ***!
  \*****************************/
(__unused_webpack_module, exports) {

"use strict";

/**
 * shared/constants.ts
 * All IPC channel names, regex patterns, and configuration defaults
 * Dependencies: none
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.DEFAULTS = exports.EXECUTION_CONFIG = exports.LLM_CONFIG = exports.INTENT_PATTERNS = exports.ENTITY_PATTERNS = exports.FIELD_TYPE_RULES = exports.PARSER_CONFIG = exports.PII_PATTERNS = exports.CHANNELS = void 0;
// ============================================================
// IPC CHANNELS
// ============================================================
exports.CHANNELS = {
    // Page understanding
    PAGE_GET_SEMANTIC_MODEL: 'page:get-semantic-model',
    PAGE_SUBSCRIBE_UPDATES: 'page:subscribe-updates',
    PAGE_NAVIGATE: 'page:navigate',
    // Agent lifecycle
    AGENT_RUN_TASK: 'agent:run-task',
    AGENT_TASK_PROGRESS: 'agent:task-progress',
    AGENT_CHECKPOINT_REQUEST: 'agent:checkpoint-request',
    AGENT_CHECKPOINT_RESOLVE: 'agent:checkpoint-resolve',
    // Memory operations
    MEMORY_GET_PROFILE: 'memory:get-profile',
    MEMORY_GET_DOMAIN: 'memory:get-domain',
    MEMORY_SET_PROFILE: 'memory:set-profile',
    // Workflow operations
    WORKFLOW_START_RECORDING: 'workflow:start-recording',
    WORKFLOW_STOP_RECORDING: 'workflow:stop-recording',
    WORKFLOW_REPLAY: 'workflow:replay',
    WORKFLOW_LIST: 'workflow:list',
    // Data extraction
    EXTRACT_PAGE_DATA: 'extract:page-data',
    // Tab management
    TABS_GET_GROUPS: 'tabs:get-groups',
    TABS_GROUP_BY_INTENT: 'tabs:group-by-intent',
    // UI control
    UI_TOGGLE_COMMAND_BAR: 'ui:toggle-command-bar',
    UI_DISMISS_OVERLAYS: 'ui:dismiss-overlays',
};
// ============================================================
// PII REDACTION PATTERNS
// ============================================================
exports.PII_PATTERNS = {
    CREDIT_CARD: /\b\d{4}[- ]?\d{4}[- ]?\d{4}[- ]?\d{4}\b/g,
    SSN: /\b\d{3}-\d{2}-\d{4}\b/g,
    EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    PASSWORD_FIELD: /password['":\s]+[^\s,}"']+/gi,
    PHONE: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
};
// ============================================================
// SEMANTIC PARSER CONFIG
// ============================================================
exports.PARSER_CONFIG = {
    TIMEOUT_MS: 5000,
    MAX_ENTITIES: 100,
    MIN_CONFIDENCE: 0.5,
    RELEVANT_ROLES: [
        'button', 'link', 'textbox', 'combobox', 'checkbox',
        'radio', 'heading', 'article', 'navigation', 'main',
        'form', 'table', 'row', 'cell', 'listitem'
    ],
    EXCLUDED_ROLES: ['none', 'generic', 'presentation'],
};
// ============================================================
// FORM FIELD TYPE INFERENCE RULES
// ============================================================
exports.FIELD_TYPE_RULES = [
    [/first.?name|given.?name/i, 'firstName'],
    [/last.?name|family.?name|surname/i, 'lastName'],
    [/full.?name|your.?name|name/i, 'fullName'],
    [/e.?mail/i, 'email'],
    [/phone|mobile|tel/i, 'phone'],
    [/street|address.?1|addr/i, 'address'],
    [/city|town/i, 'city'],
    [/state|province|region/i, 'state'],
    [/zip|postal/i, 'zip'],
    [/country/i, 'country'],
    [/card.?number|cc.?num/i, 'creditCard'],
    [/cvv|cvc|security.?code/i, 'cvv'],
    [/expir|exp.?date/i, 'expiry'],
    [/user.?name|login/i, 'username'],
    [/password|passcode/i, 'password'],
    [/search/i, 'search'],
];
// ============================================================
// ENTITY DETECTION PATTERNS
// ============================================================
exports.ENTITY_PATTERNS = {
    PRICE: /\$\s?\d{1,3}(,\d{3})*(\.\d{2})?|\d{1,3}(,\d{3})*(\.\d{2})?\s?(?:USD|EUR|GBP)/gi,
    DATE: /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi,
    EMAIL: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
    PHONE: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b|\(\d{3}\)\s?\d{3}[-.]?\d{4}/g,
    URL: /https?:\/\/[^\s<>"]+/gi,
    PERCENTAGE: /\d+\.?\d*\s?%/g,
    ORDER_NUMBER: /(?:order|tracking|reference)[\s#:]*([A-Z0-9]{6,20})/gi,
};
// ============================================================
// PAGE INTENT CLASSIFICATION PATTERNS
// ============================================================
exports.INTENT_PATTERNS = [
    [/checkout|cart|payment|order/i, 'checkout'],
    [/login|signin|auth/i, 'login'],
    [/docs?|documentation|wiki|guide/i, 'document'],
    [/search|q=|query=/i, 'search'],
    [/article|blog|post/i, 'article'],
    [/dashboard|admin|console/i, 'dashboard'],
    [/product|item|buy|shop/i, 'product-listing'],
];
// ============================================================
// LLM CONFIGURATION (NVIDIA NIM)
// ============================================================
exports.LLM_CONFIG = {
    MODEL: 'qwen/qwen2.5-coder-32b-instruct',
    MAX_TOKENS: 1024,
    TEMPERATURE: 0.2,
    TIMEOUT_MS: 30000,
    MAX_RETRIES: 2,
};
// ============================================================
// TASK EXECUTION CONFIG
// ============================================================
exports.EXECUTION_CONFIG = {
    MAX_STEP_RETRIES: 3,
    RETRY_DELAY_MS: 500,
    CHECKPOINT_TIMEOUT_MS: 60000,
    HUD_AUTO_DISMISS_MS: 2000,
};
// ============================================================
// DEFAULT VALUES
// ============================================================
exports.DEFAULTS = {
    USER_PROFILE: {
        id: 'local-user-001',
        firstName: '',
        lastName: '',
        email: '',
        custom: {},
    },
    TAB_GROUP_COLORS: ['blue', 'green', 'orange', 'pink', 'purple', 'red', 'yellow'],
};


/***/ },

/***/ "./shared/utils.ts"
/*!*************************!*\
  !*** ./shared/utils.ts ***!
  \*************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

/**
 * shared/utils.ts
 * Pure utility functions used by both main and renderer
 * Dependencies: shared/constants
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.redactPII = redactPII;
exports.normalizeSelector = normalizeSelector;
exports.sleep = sleep;
exports.generateId = generateId;
exports.extractDomain = extractDomain;
exports.safeJSONParse = safeJSONParse;
exports.compactForLLM = compactForLLM;
exports.formatDuration = formatDuration;
exports.truncate = truncate;
const constants_1 = __webpack_require__(/*! ./constants */ "./shared/constants.ts");
/**
 * Redacts PII from text before sending to LLM
 */
function redactPII(text) {
    return text
        .replace(constants_1.PII_PATTERNS.CREDIT_CARD, '[CARD]')
        .replace(constants_1.PII_PATTERNS.SSN, '[SSN]')
        .replace(constants_1.PII_PATTERNS.EMAIL, '[EMAIL]')
        .replace(constants_1.PII_PATTERNS.PASSWORD_FIELD, 'password: [REDACTED]');
}
/**
 * Normalizes CSS selectors for consistency
 */
function normalizeSelector(selector) {
    return selector.trim().replace(/\s+/g, ' ');
}
/**
 * Sleep utility for delays
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Generates a unique ID
 */
function generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}
/**
 * Extracts domain from URL
 */
function extractDomain(url) {
    try {
        const parsed = new URL(url);
        return parsed.hostname;
    }
    catch {
        return 'unknown';
    }
}
/**
 * Safely parses JSON with fallback
 */
function safeJSONParse(text, fallback) {
    try {
        return JSON.parse(text);
    }
    catch {
        return fallback;
    }
}
/**
 * Compacts SemanticPageModel for LLM (removes verbose fields)
 */
function compactForLLM(model) {
    return {
        url: model.url,
        pageIntent: model.pageIntent,
        entities: model.entities.slice(0, 20).map((e) => ({
            type: e.type,
            value: e.value,
        })),
        forms: model.forms.map((f) => ({
            fields: f.fields.map((field) => ({
                label: field.label,
                semanticType: field.semanticType,
                required: field.required,
            })),
            isDestructive: f.isDestructive,
        })),
        actions: model.actions.slice(0, 10).map((a) => ({
            label: a.label,
            type: a.type,
        })),
    };
}
/**
 * Formats duration in ms to human-readable string
 */
function formatDuration(ms) {
    if (ms < 1000)
        return `${ms}ms`;
    if (ms < 60000)
        return `${(ms / 1000).toFixed(1)}s`;
    return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
}
/**
 * Truncates text to max length with ellipsis
 */
function truncate(text, maxLength) {
    if (text.length <= maxLength)
        return text;
    return text.substring(0, maxLength - 3) + '...';
}


/***/ },

/***/ "crypto"
/*!*************************!*\
  !*** external "crypto" ***!
  \*************************/
(module) {

"use strict";
module.exports = require("crypto");

/***/ },

/***/ "electron"
/*!***************************!*\
  !*** external "electron" ***!
  \***************************/
(module) {

"use strict";
module.exports = require("electron");

/***/ },

/***/ "fs"
/*!*********************!*\
  !*** external "fs" ***!
  \*********************/
(module) {

"use strict";
module.exports = require("fs");

/***/ },

/***/ "os"
/*!*********************!*\
  !*** external "os" ***!
  \*********************/
(module) {

"use strict";
module.exports = require("os");

/***/ },

/***/ "path"
/*!***********************!*\
  !*** external "path" ***!
  \***********************/
(module) {

"use strict";
module.exports = require("path");

/***/ },

/***/ "stream"
/*!*************************!*\
  !*** external "stream" ***!
  \*************************/
(module) {

"use strict";
module.exports = require("stream");

/***/ },

/***/ "util"
/*!***********************!*\
  !*** external "util" ***!
  \***********************/
(module) {

"use strict";
module.exports = require("util");

/***/ },

/***/ "./node_modules/zod/index.cjs"
/*!************************************!*\
  !*** ./node_modules/zod/index.cjs ***!
  \************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.z = void 0;
const z = __importStar(__webpack_require__(/*! ./v3/external.cjs */ "./node_modules/zod/v3/external.cjs"));
exports.z = z;
__exportStar(__webpack_require__(/*! ./v3/external.cjs */ "./node_modules/zod/v3/external.cjs"), exports);
exports["default"] = z;


/***/ },

/***/ "./node_modules/zod/v3/ZodError.cjs"
/*!******************************************!*\
  !*** ./node_modules/zod/v3/ZodError.cjs ***!
  \******************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.ZodError = exports.quotelessJson = exports.ZodIssueCode = void 0;
const util_js_1 = __webpack_require__(/*! ./helpers/util.cjs */ "./node_modules/zod/v3/helpers/util.cjs");
exports.ZodIssueCode = util_js_1.util.arrayToEnum([
    "invalid_type",
    "invalid_literal",
    "custom",
    "invalid_union",
    "invalid_union_discriminator",
    "invalid_enum_value",
    "unrecognized_keys",
    "invalid_arguments",
    "invalid_return_type",
    "invalid_date",
    "invalid_string",
    "too_small",
    "too_big",
    "invalid_intersection_types",
    "not_multiple_of",
    "not_finite",
]);
const quotelessJson = (obj) => {
    const json = JSON.stringify(obj, null, 2);
    return json.replace(/"([^"]+)":/g, "$1:");
};
exports.quotelessJson = quotelessJson;
class ZodError extends Error {
    get errors() {
        return this.issues;
    }
    constructor(issues) {
        super();
        this.issues = [];
        this.addIssue = (sub) => {
            this.issues = [...this.issues, sub];
        };
        this.addIssues = (subs = []) => {
            this.issues = [...this.issues, ...subs];
        };
        const actualProto = new.target.prototype;
        if (Object.setPrototypeOf) {
            // eslint-disable-next-line ban/ban
            Object.setPrototypeOf(this, actualProto);
        }
        else {
            this.__proto__ = actualProto;
        }
        this.name = "ZodError";
        this.issues = issues;
    }
    format(_mapper) {
        const mapper = _mapper ||
            function (issue) {
                return issue.message;
            };
        const fieldErrors = { _errors: [] };
        const processError = (error) => {
            for (const issue of error.issues) {
                if (issue.code === "invalid_union") {
                    issue.unionErrors.map(processError);
                }
                else if (issue.code === "invalid_return_type") {
                    processError(issue.returnTypeError);
                }
                else if (issue.code === "invalid_arguments") {
                    processError(issue.argumentsError);
                }
                else if (issue.path.length === 0) {
                    fieldErrors._errors.push(mapper(issue));
                }
                else {
                    let curr = fieldErrors;
                    let i = 0;
                    while (i < issue.path.length) {
                        const el = issue.path[i];
                        const terminal = i === issue.path.length - 1;
                        if (!terminal) {
                            curr[el] = curr[el] || { _errors: [] };
                            // if (typeof el === "string") {
                            //   curr[el] = curr[el] || { _errors: [] };
                            // } else if (typeof el === "number") {
                            //   const errorArray: any = [];
                            //   errorArray._errors = [];
                            //   curr[el] = curr[el] || errorArray;
                            // }
                        }
                        else {
                            curr[el] = curr[el] || { _errors: [] };
                            curr[el]._errors.push(mapper(issue));
                        }
                        curr = curr[el];
                        i++;
                    }
                }
            }
        };
        processError(this);
        return fieldErrors;
    }
    static assert(value) {
        if (!(value instanceof ZodError)) {
            throw new Error(`Not a ZodError: ${value}`);
        }
    }
    toString() {
        return this.message;
    }
    get message() {
        return JSON.stringify(this.issues, util_js_1.util.jsonStringifyReplacer, 2);
    }
    get isEmpty() {
        return this.issues.length === 0;
    }
    flatten(mapper = (issue) => issue.message) {
        const fieldErrors = {};
        const formErrors = [];
        for (const sub of this.issues) {
            if (sub.path.length > 0) {
                const firstEl = sub.path[0];
                fieldErrors[firstEl] = fieldErrors[firstEl] || [];
                fieldErrors[firstEl].push(mapper(sub));
            }
            else {
                formErrors.push(mapper(sub));
            }
        }
        return { formErrors, fieldErrors };
    }
    get formErrors() {
        return this.flatten();
    }
}
exports.ZodError = ZodError;
ZodError.create = (issues) => {
    const error = new ZodError(issues);
    return error;
};


/***/ },

/***/ "./node_modules/zod/v3/errors.cjs"
/*!****************************************!*\
  !*** ./node_modules/zod/v3/errors.cjs ***!
  \****************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.defaultErrorMap = void 0;
exports.setErrorMap = setErrorMap;
exports.getErrorMap = getErrorMap;
const en_js_1 = __importDefault(__webpack_require__(/*! ./locales/en.cjs */ "./node_modules/zod/v3/locales/en.cjs"));
exports.defaultErrorMap = en_js_1.default;
let overrideErrorMap = en_js_1.default;
function setErrorMap(map) {
    overrideErrorMap = map;
}
function getErrorMap() {
    return overrideErrorMap;
}


/***/ },

/***/ "./node_modules/zod/v3/external.cjs"
/*!******************************************!*\
  !*** ./node_modules/zod/v3/external.cjs ***!
  \******************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
__exportStar(__webpack_require__(/*! ./errors.cjs */ "./node_modules/zod/v3/errors.cjs"), exports);
__exportStar(__webpack_require__(/*! ./helpers/parseUtil.cjs */ "./node_modules/zod/v3/helpers/parseUtil.cjs"), exports);
__exportStar(__webpack_require__(/*! ./helpers/typeAliases.cjs */ "./node_modules/zod/v3/helpers/typeAliases.cjs"), exports);
__exportStar(__webpack_require__(/*! ./helpers/util.cjs */ "./node_modules/zod/v3/helpers/util.cjs"), exports);
__exportStar(__webpack_require__(/*! ./types.cjs */ "./node_modules/zod/v3/types.cjs"), exports);
__exportStar(__webpack_require__(/*! ./ZodError.cjs */ "./node_modules/zod/v3/ZodError.cjs"), exports);


/***/ },

/***/ "./node_modules/zod/v3/helpers/errorUtil.cjs"
/*!***************************************************!*\
  !*** ./node_modules/zod/v3/helpers/errorUtil.cjs ***!
  \***************************************************/
(__unused_webpack_module, exports) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.errorUtil = void 0;
var errorUtil;
(function (errorUtil) {
    errorUtil.errToObj = (message) => typeof message === "string" ? { message } : message || {};
    // biome-ignore lint:
    errorUtil.toString = (message) => typeof message === "string" ? message : message?.message;
})(errorUtil || (exports.errorUtil = errorUtil = {}));


/***/ },

/***/ "./node_modules/zod/v3/helpers/parseUtil.cjs"
/*!***************************************************!*\
  !*** ./node_modules/zod/v3/helpers/parseUtil.cjs ***!
  \***************************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.isAsync = exports.isValid = exports.isDirty = exports.isAborted = exports.OK = exports.DIRTY = exports.INVALID = exports.ParseStatus = exports.EMPTY_PATH = exports.makeIssue = void 0;
exports.addIssueToContext = addIssueToContext;
const errors_js_1 = __webpack_require__(/*! ../errors.cjs */ "./node_modules/zod/v3/errors.cjs");
const en_js_1 = __importDefault(__webpack_require__(/*! ../locales/en.cjs */ "./node_modules/zod/v3/locales/en.cjs"));
const makeIssue = (params) => {
    const { data, path, errorMaps, issueData } = params;
    const fullPath = [...path, ...(issueData.path || [])];
    const fullIssue = {
        ...issueData,
        path: fullPath,
    };
    if (issueData.message !== undefined) {
        return {
            ...issueData,
            path: fullPath,
            message: issueData.message,
        };
    }
    let errorMessage = "";
    const maps = errorMaps
        .filter((m) => !!m)
        .slice()
        .reverse();
    for (const map of maps) {
        errorMessage = map(fullIssue, { data, defaultError: errorMessage }).message;
    }
    return {
        ...issueData,
        path: fullPath,
        message: errorMessage,
    };
};
exports.makeIssue = makeIssue;
exports.EMPTY_PATH = [];
function addIssueToContext(ctx, issueData) {
    const overrideMap = (0, errors_js_1.getErrorMap)();
    const issue = (0, exports.makeIssue)({
        issueData: issueData,
        data: ctx.data,
        path: ctx.path,
        errorMaps: [
            ctx.common.contextualErrorMap, // contextual error map is first priority
            ctx.schemaErrorMap, // then schema-bound map if available
            overrideMap, // then global override map
            overrideMap === en_js_1.default ? undefined : en_js_1.default, // then global default map
        ].filter((x) => !!x),
    });
    ctx.common.issues.push(issue);
}
class ParseStatus {
    constructor() {
        this.value = "valid";
    }
    dirty() {
        if (this.value === "valid")
            this.value = "dirty";
    }
    abort() {
        if (this.value !== "aborted")
            this.value = "aborted";
    }
    static mergeArray(status, results) {
        const arrayValue = [];
        for (const s of results) {
            if (s.status === "aborted")
                return exports.INVALID;
            if (s.status === "dirty")
                status.dirty();
            arrayValue.push(s.value);
        }
        return { status: status.value, value: arrayValue };
    }
    static async mergeObjectAsync(status, pairs) {
        const syncPairs = [];
        for (const pair of pairs) {
            const key = await pair.key;
            const value = await pair.value;
            syncPairs.push({
                key,
                value,
            });
        }
        return ParseStatus.mergeObjectSync(status, syncPairs);
    }
    static mergeObjectSync(status, pairs) {
        const finalObject = {};
        for (const pair of pairs) {
            const { key, value } = pair;
            if (key.status === "aborted")
                return exports.INVALID;
            if (value.status === "aborted")
                return exports.INVALID;
            if (key.status === "dirty")
                status.dirty();
            if (value.status === "dirty")
                status.dirty();
            if (key.value !== "__proto__" && (typeof value.value !== "undefined" || pair.alwaysSet)) {
                finalObject[key.value] = value.value;
            }
        }
        return { status: status.value, value: finalObject };
    }
}
exports.ParseStatus = ParseStatus;
exports.INVALID = Object.freeze({
    status: "aborted",
});
const DIRTY = (value) => ({ status: "dirty", value });
exports.DIRTY = DIRTY;
const OK = (value) => ({ status: "valid", value });
exports.OK = OK;
const isAborted = (x) => x.status === "aborted";
exports.isAborted = isAborted;
const isDirty = (x) => x.status === "dirty";
exports.isDirty = isDirty;
const isValid = (x) => x.status === "valid";
exports.isValid = isValid;
const isAsync = (x) => typeof Promise !== "undefined" && x instanceof Promise;
exports.isAsync = isAsync;


/***/ },

/***/ "./node_modules/zod/v3/helpers/typeAliases.cjs"
/*!*****************************************************!*\
  !*** ./node_modules/zod/v3/helpers/typeAliases.cjs ***!
  \*****************************************************/
(__unused_webpack_module, exports) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));


/***/ },

/***/ "./node_modules/zod/v3/helpers/util.cjs"
/*!**********************************************!*\
  !*** ./node_modules/zod/v3/helpers/util.cjs ***!
  \**********************************************/
(__unused_webpack_module, exports) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.getParsedType = exports.ZodParsedType = exports.objectUtil = exports.util = void 0;
var util;
(function (util) {
    util.assertEqual = (_) => { };
    function assertIs(_arg) { }
    util.assertIs = assertIs;
    function assertNever(_x) {
        throw new Error();
    }
    util.assertNever = assertNever;
    util.arrayToEnum = (items) => {
        const obj = {};
        for (const item of items) {
            obj[item] = item;
        }
        return obj;
    };
    util.getValidEnumValues = (obj) => {
        const validKeys = util.objectKeys(obj).filter((k) => typeof obj[obj[k]] !== "number");
        const filtered = {};
        for (const k of validKeys) {
            filtered[k] = obj[k];
        }
        return util.objectValues(filtered);
    };
    util.objectValues = (obj) => {
        return util.objectKeys(obj).map(function (e) {
            return obj[e];
        });
    };
    util.objectKeys = typeof Object.keys === "function" // eslint-disable-line ban/ban
        ? (obj) => Object.keys(obj) // eslint-disable-line ban/ban
        : (object) => {
            const keys = [];
            for (const key in object) {
                if (Object.prototype.hasOwnProperty.call(object, key)) {
                    keys.push(key);
                }
            }
            return keys;
        };
    util.find = (arr, checker) => {
        for (const item of arr) {
            if (checker(item))
                return item;
        }
        return undefined;
    };
    util.isInteger = typeof Number.isInteger === "function"
        ? (val) => Number.isInteger(val) // eslint-disable-line ban/ban
        : (val) => typeof val === "number" && Number.isFinite(val) && Math.floor(val) === val;
    function joinValues(array, separator = " | ") {
        return array.map((val) => (typeof val === "string" ? `'${val}'` : val)).join(separator);
    }
    util.joinValues = joinValues;
    util.jsonStringifyReplacer = (_, value) => {
        if (typeof value === "bigint") {
            return value.toString();
        }
        return value;
    };
})(util || (exports.util = util = {}));
var objectUtil;
(function (objectUtil) {
    objectUtil.mergeShapes = (first, second) => {
        return {
            ...first,
            ...second, // second overwrites first
        };
    };
})(objectUtil || (exports.objectUtil = objectUtil = {}));
exports.ZodParsedType = util.arrayToEnum([
    "string",
    "nan",
    "number",
    "integer",
    "float",
    "boolean",
    "date",
    "bigint",
    "symbol",
    "function",
    "undefined",
    "null",
    "array",
    "object",
    "unknown",
    "promise",
    "void",
    "never",
    "map",
    "set",
]);
const getParsedType = (data) => {
    const t = typeof data;
    switch (t) {
        case "undefined":
            return exports.ZodParsedType.undefined;
        case "string":
            return exports.ZodParsedType.string;
        case "number":
            return Number.isNaN(data) ? exports.ZodParsedType.nan : exports.ZodParsedType.number;
        case "boolean":
            return exports.ZodParsedType.boolean;
        case "function":
            return exports.ZodParsedType.function;
        case "bigint":
            return exports.ZodParsedType.bigint;
        case "symbol":
            return exports.ZodParsedType.symbol;
        case "object":
            if (Array.isArray(data)) {
                return exports.ZodParsedType.array;
            }
            if (data === null) {
                return exports.ZodParsedType.null;
            }
            if (data.then && typeof data.then === "function" && data.catch && typeof data.catch === "function") {
                return exports.ZodParsedType.promise;
            }
            if (typeof Map !== "undefined" && data instanceof Map) {
                return exports.ZodParsedType.map;
            }
            if (typeof Set !== "undefined" && data instanceof Set) {
                return exports.ZodParsedType.set;
            }
            if (typeof Date !== "undefined" && data instanceof Date) {
                return exports.ZodParsedType.date;
            }
            return exports.ZodParsedType.object;
        default:
            return exports.ZodParsedType.unknown;
    }
};
exports.getParsedType = getParsedType;


/***/ },

/***/ "./node_modules/zod/v3/locales/en.cjs"
/*!********************************************!*\
  !*** ./node_modules/zod/v3/locales/en.cjs ***!
  \********************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
const ZodError_js_1 = __webpack_require__(/*! ../ZodError.cjs */ "./node_modules/zod/v3/ZodError.cjs");
const util_js_1 = __webpack_require__(/*! ../helpers/util.cjs */ "./node_modules/zod/v3/helpers/util.cjs");
const errorMap = (issue, _ctx) => {
    let message;
    switch (issue.code) {
        case ZodError_js_1.ZodIssueCode.invalid_type:
            if (issue.received === util_js_1.ZodParsedType.undefined) {
                message = "Required";
            }
            else {
                message = `Expected ${issue.expected}, received ${issue.received}`;
            }
            break;
        case ZodError_js_1.ZodIssueCode.invalid_literal:
            message = `Invalid literal value, expected ${JSON.stringify(issue.expected, util_js_1.util.jsonStringifyReplacer)}`;
            break;
        case ZodError_js_1.ZodIssueCode.unrecognized_keys:
            message = `Unrecognized key(s) in object: ${util_js_1.util.joinValues(issue.keys, ", ")}`;
            break;
        case ZodError_js_1.ZodIssueCode.invalid_union:
            message = `Invalid input`;
            break;
        case ZodError_js_1.ZodIssueCode.invalid_union_discriminator:
            message = `Invalid discriminator value. Expected ${util_js_1.util.joinValues(issue.options)}`;
            break;
        case ZodError_js_1.ZodIssueCode.invalid_enum_value:
            message = `Invalid enum value. Expected ${util_js_1.util.joinValues(issue.options)}, received '${issue.received}'`;
            break;
        case ZodError_js_1.ZodIssueCode.invalid_arguments:
            message = `Invalid function arguments`;
            break;
        case ZodError_js_1.ZodIssueCode.invalid_return_type:
            message = `Invalid function return type`;
            break;
        case ZodError_js_1.ZodIssueCode.invalid_date:
            message = `Invalid date`;
            break;
        case ZodError_js_1.ZodIssueCode.invalid_string:
            if (typeof issue.validation === "object") {
                if ("includes" in issue.validation) {
                    message = `Invalid input: must include "${issue.validation.includes}"`;
                    if (typeof issue.validation.position === "number") {
                        message = `${message} at one or more positions greater than or equal to ${issue.validation.position}`;
                    }
                }
                else if ("startsWith" in issue.validation) {
                    message = `Invalid input: must start with "${issue.validation.startsWith}"`;
                }
                else if ("endsWith" in issue.validation) {
                    message = `Invalid input: must end with "${issue.validation.endsWith}"`;
                }
                else {
                    util_js_1.util.assertNever(issue.validation);
                }
            }
            else if (issue.validation !== "regex") {
                message = `Invalid ${issue.validation}`;
            }
            else {
                message = "Invalid";
            }
            break;
        case ZodError_js_1.ZodIssueCode.too_small:
            if (issue.type === "array")
                message = `Array must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `more than`} ${issue.minimum} element(s)`;
            else if (issue.type === "string")
                message = `String must contain ${issue.exact ? "exactly" : issue.inclusive ? `at least` : `over`} ${issue.minimum} character(s)`;
            else if (issue.type === "number")
                message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
            else if (issue.type === "bigint")
                message = `Number must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${issue.minimum}`;
            else if (issue.type === "date")
                message = `Date must be ${issue.exact ? `exactly equal to ` : issue.inclusive ? `greater than or equal to ` : `greater than `}${new Date(Number(issue.minimum))}`;
            else
                message = "Invalid input";
            break;
        case ZodError_js_1.ZodIssueCode.too_big:
            if (issue.type === "array")
                message = `Array must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `less than`} ${issue.maximum} element(s)`;
            else if (issue.type === "string")
                message = `String must contain ${issue.exact ? `exactly` : issue.inclusive ? `at most` : `under`} ${issue.maximum} character(s)`;
            else if (issue.type === "number")
                message = `Number must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
            else if (issue.type === "bigint")
                message = `BigInt must be ${issue.exact ? `exactly` : issue.inclusive ? `less than or equal to` : `less than`} ${issue.maximum}`;
            else if (issue.type === "date")
                message = `Date must be ${issue.exact ? `exactly` : issue.inclusive ? `smaller than or equal to` : `smaller than`} ${new Date(Number(issue.maximum))}`;
            else
                message = "Invalid input";
            break;
        case ZodError_js_1.ZodIssueCode.custom:
            message = `Invalid input`;
            break;
        case ZodError_js_1.ZodIssueCode.invalid_intersection_types:
            message = `Intersection results could not be merged`;
            break;
        case ZodError_js_1.ZodIssueCode.not_multiple_of:
            message = `Number must be a multiple of ${issue.multipleOf}`;
            break;
        case ZodError_js_1.ZodIssueCode.not_finite:
            message = "Number must be finite";
            break;
        default:
            message = _ctx.defaultError;
            util_js_1.util.assertNever(issue);
    }
    return { message };
};
exports["default"] = errorMap;


/***/ },

/***/ "./node_modules/zod/v3/types.cjs"
/*!***************************************!*\
  !*** ./node_modules/zod/v3/types.cjs ***!
  \***************************************/
(__unused_webpack_module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", ({ value: true }));
exports.discriminatedUnion = exports.date = exports.boolean = exports.bigint = exports.array = exports.any = exports.coerce = exports.ZodFirstPartyTypeKind = exports.late = exports.ZodSchema = exports.Schema = exports.ZodReadonly = exports.ZodPipeline = exports.ZodBranded = exports.BRAND = exports.ZodNaN = exports.ZodCatch = exports.ZodDefault = exports.ZodNullable = exports.ZodOptional = exports.ZodTransformer = exports.ZodEffects = exports.ZodPromise = exports.ZodNativeEnum = exports.ZodEnum = exports.ZodLiteral = exports.ZodLazy = exports.ZodFunction = exports.ZodSet = exports.ZodMap = exports.ZodRecord = exports.ZodTuple = exports.ZodIntersection = exports.ZodDiscriminatedUnion = exports.ZodUnion = exports.ZodObject = exports.ZodArray = exports.ZodVoid = exports.ZodNever = exports.ZodUnknown = exports.ZodAny = exports.ZodNull = exports.ZodUndefined = exports.ZodSymbol = exports.ZodDate = exports.ZodBoolean = exports.ZodBigInt = exports.ZodNumber = exports.ZodString = exports.ZodType = void 0;
exports.NEVER = exports["void"] = exports.unknown = exports.union = exports.undefined = exports.tuple = exports.transformer = exports.symbol = exports.string = exports.strictObject = exports.set = exports.record = exports.promise = exports.preprocess = exports.pipeline = exports.ostring = exports.optional = exports.onumber = exports.oboolean = exports.object = exports.number = exports.nullable = exports["null"] = exports.never = exports.nativeEnum = exports.nan = exports.map = exports.literal = exports.lazy = exports.intersection = exports["instanceof"] = exports["function"] = exports["enum"] = exports.effect = void 0;
exports.datetimeRegex = datetimeRegex;
exports.custom = custom;
const ZodError_js_1 = __webpack_require__(/*! ./ZodError.cjs */ "./node_modules/zod/v3/ZodError.cjs");
const errors_js_1 = __webpack_require__(/*! ./errors.cjs */ "./node_modules/zod/v3/errors.cjs");
const errorUtil_js_1 = __webpack_require__(/*! ./helpers/errorUtil.cjs */ "./node_modules/zod/v3/helpers/errorUtil.cjs");
const parseUtil_js_1 = __webpack_require__(/*! ./helpers/parseUtil.cjs */ "./node_modules/zod/v3/helpers/parseUtil.cjs");
const util_js_1 = __webpack_require__(/*! ./helpers/util.cjs */ "./node_modules/zod/v3/helpers/util.cjs");
class ParseInputLazyPath {
    constructor(parent, value, path, key) {
        this._cachedPath = [];
        this.parent = parent;
        this.data = value;
        this._path = path;
        this._key = key;
    }
    get path() {
        if (!this._cachedPath.length) {
            if (Array.isArray(this._key)) {
                this._cachedPath.push(...this._path, ...this._key);
            }
            else {
                this._cachedPath.push(...this._path, this._key);
            }
        }
        return this._cachedPath;
    }
}
const handleResult = (ctx, result) => {
    if ((0, parseUtil_js_1.isValid)(result)) {
        return { success: true, data: result.value };
    }
    else {
        if (!ctx.common.issues.length) {
            throw new Error("Validation failed but no issues detected.");
        }
        return {
            success: false,
            get error() {
                if (this._error)
                    return this._error;
                const error = new ZodError_js_1.ZodError(ctx.common.issues);
                this._error = error;
                return this._error;
            },
        };
    }
};
function processCreateParams(params) {
    if (!params)
        return {};
    const { errorMap, invalid_type_error, required_error, description } = params;
    if (errorMap && (invalid_type_error || required_error)) {
        throw new Error(`Can't use "invalid_type_error" or "required_error" in conjunction with custom error map.`);
    }
    if (errorMap)
        return { errorMap: errorMap, description };
    const customMap = (iss, ctx) => {
        const { message } = params;
        if (iss.code === "invalid_enum_value") {
            return { message: message ?? ctx.defaultError };
        }
        if (typeof ctx.data === "undefined") {
            return { message: message ?? required_error ?? ctx.defaultError };
        }
        if (iss.code !== "invalid_type")
            return { message: ctx.defaultError };
        return { message: message ?? invalid_type_error ?? ctx.defaultError };
    };
    return { errorMap: customMap, description };
}
class ZodType {
    get description() {
        return this._def.description;
    }
    _getType(input) {
        return (0, util_js_1.getParsedType)(input.data);
    }
    _getOrReturnCtx(input, ctx) {
        return (ctx || {
            common: input.parent.common,
            data: input.data,
            parsedType: (0, util_js_1.getParsedType)(input.data),
            schemaErrorMap: this._def.errorMap,
            path: input.path,
            parent: input.parent,
        });
    }
    _processInputParams(input) {
        return {
            status: new parseUtil_js_1.ParseStatus(),
            ctx: {
                common: input.parent.common,
                data: input.data,
                parsedType: (0, util_js_1.getParsedType)(input.data),
                schemaErrorMap: this._def.errorMap,
                path: input.path,
                parent: input.parent,
            },
        };
    }
    _parseSync(input) {
        const result = this._parse(input);
        if ((0, parseUtil_js_1.isAsync)(result)) {
            throw new Error("Synchronous parse encountered promise.");
        }
        return result;
    }
    _parseAsync(input) {
        const result = this._parse(input);
        return Promise.resolve(result);
    }
    parse(data, params) {
        const result = this.safeParse(data, params);
        if (result.success)
            return result.data;
        throw result.error;
    }
    safeParse(data, params) {
        const ctx = {
            common: {
                issues: [],
                async: params?.async ?? false,
                contextualErrorMap: params?.errorMap,
            },
            path: params?.path || [],
            schemaErrorMap: this._def.errorMap,
            parent: null,
            data,
            parsedType: (0, util_js_1.getParsedType)(data),
        };
        const result = this._parseSync({ data, path: ctx.path, parent: ctx });
        return handleResult(ctx, result);
    }
    "~validate"(data) {
        const ctx = {
            common: {
                issues: [],
                async: !!this["~standard"].async,
            },
            path: [],
            schemaErrorMap: this._def.errorMap,
            parent: null,
            data,
            parsedType: (0, util_js_1.getParsedType)(data),
        };
        if (!this["~standard"].async) {
            try {
                const result = this._parseSync({ data, path: [], parent: ctx });
                return (0, parseUtil_js_1.isValid)(result)
                    ? {
                        value: result.value,
                    }
                    : {
                        issues: ctx.common.issues,
                    };
            }
            catch (err) {
                if (err?.message?.toLowerCase()?.includes("encountered")) {
                    this["~standard"].async = true;
                }
                ctx.common = {
                    issues: [],
                    async: true,
                };
            }
        }
        return this._parseAsync({ data, path: [], parent: ctx }).then((result) => (0, parseUtil_js_1.isValid)(result)
            ? {
                value: result.value,
            }
            : {
                issues: ctx.common.issues,
            });
    }
    async parseAsync(data, params) {
        const result = await this.safeParseAsync(data, params);
        if (result.success)
            return result.data;
        throw result.error;
    }
    async safeParseAsync(data, params) {
        const ctx = {
            common: {
                issues: [],
                contextualErrorMap: params?.errorMap,
                async: true,
            },
            path: params?.path || [],
            schemaErrorMap: this._def.errorMap,
            parent: null,
            data,
            parsedType: (0, util_js_1.getParsedType)(data),
        };
        const maybeAsyncResult = this._parse({ data, path: ctx.path, parent: ctx });
        const result = await ((0, parseUtil_js_1.isAsync)(maybeAsyncResult) ? maybeAsyncResult : Promise.resolve(maybeAsyncResult));
        return handleResult(ctx, result);
    }
    refine(check, message) {
        const getIssueProperties = (val) => {
            if (typeof message === "string" || typeof message === "undefined") {
                return { message };
            }
            else if (typeof message === "function") {
                return message(val);
            }
            else {
                return message;
            }
        };
        return this._refinement((val, ctx) => {
            const result = check(val);
            const setError = () => ctx.addIssue({
                code: ZodError_js_1.ZodIssueCode.custom,
                ...getIssueProperties(val),
            });
            if (typeof Promise !== "undefined" && result instanceof Promise) {
                return result.then((data) => {
                    if (!data) {
                        setError();
                        return false;
                    }
                    else {
                        return true;
                    }
                });
            }
            if (!result) {
                setError();
                return false;
            }
            else {
                return true;
            }
        });
    }
    refinement(check, refinementData) {
        return this._refinement((val, ctx) => {
            if (!check(val)) {
                ctx.addIssue(typeof refinementData === "function" ? refinementData(val, ctx) : refinementData);
                return false;
            }
            else {
                return true;
            }
        });
    }
    _refinement(refinement) {
        return new ZodEffects({
            schema: this,
            typeName: ZodFirstPartyTypeKind.ZodEffects,
            effect: { type: "refinement", refinement },
        });
    }
    superRefine(refinement) {
        return this._refinement(refinement);
    }
    constructor(def) {
        /** Alias of safeParseAsync */
        this.spa = this.safeParseAsync;
        this._def = def;
        this.parse = this.parse.bind(this);
        this.safeParse = this.safeParse.bind(this);
        this.parseAsync = this.parseAsync.bind(this);
        this.safeParseAsync = this.safeParseAsync.bind(this);
        this.spa = this.spa.bind(this);
        this.refine = this.refine.bind(this);
        this.refinement = this.refinement.bind(this);
        this.superRefine = this.superRefine.bind(this);
        this.optional = this.optional.bind(this);
        this.nullable = this.nullable.bind(this);
        this.nullish = this.nullish.bind(this);
        this.array = this.array.bind(this);
        this.promise = this.promise.bind(this);
        this.or = this.or.bind(this);
        this.and = this.and.bind(this);
        this.transform = this.transform.bind(this);
        this.brand = this.brand.bind(this);
        this.default = this.default.bind(this);
        this.catch = this.catch.bind(this);
        this.describe = this.describe.bind(this);
        this.pipe = this.pipe.bind(this);
        this.readonly = this.readonly.bind(this);
        this.isNullable = this.isNullable.bind(this);
        this.isOptional = this.isOptional.bind(this);
        this["~standard"] = {
            version: 1,
            vendor: "zod",
            validate: (data) => this["~validate"](data),
        };
    }
    optional() {
        return ZodOptional.create(this, this._def);
    }
    nullable() {
        return ZodNullable.create(this, this._def);
    }
    nullish() {
        return this.nullable().optional();
    }
    array() {
        return ZodArray.create(this);
    }
    promise() {
        return ZodPromise.create(this, this._def);
    }
    or(option) {
        return ZodUnion.create([this, option], this._def);
    }
    and(incoming) {
        return ZodIntersection.create(this, incoming, this._def);
    }
    transform(transform) {
        return new ZodEffects({
            ...processCreateParams(this._def),
            schema: this,
            typeName: ZodFirstPartyTypeKind.ZodEffects,
            effect: { type: "transform", transform },
        });
    }
    default(def) {
        const defaultValueFunc = typeof def === "function" ? def : () => def;
        return new ZodDefault({
            ...processCreateParams(this._def),
            innerType: this,
            defaultValue: defaultValueFunc,
            typeName: ZodFirstPartyTypeKind.ZodDefault,
        });
    }
    brand() {
        return new ZodBranded({
            typeName: ZodFirstPartyTypeKind.ZodBranded,
            type: this,
            ...processCreateParams(this._def),
        });
    }
    catch(def) {
        const catchValueFunc = typeof def === "function" ? def : () => def;
        return new ZodCatch({
            ...processCreateParams(this._def),
            innerType: this,
            catchValue: catchValueFunc,
            typeName: ZodFirstPartyTypeKind.ZodCatch,
        });
    }
    describe(description) {
        const This = this.constructor;
        return new This({
            ...this._def,
            description,
        });
    }
    pipe(target) {
        return ZodPipeline.create(this, target);
    }
    readonly() {
        return ZodReadonly.create(this);
    }
    isOptional() {
        return this.safeParse(undefined).success;
    }
    isNullable() {
        return this.safeParse(null).success;
    }
}
exports.ZodType = ZodType;
exports.Schema = ZodType;
exports.ZodSchema = ZodType;
const cuidRegex = /^c[^\s-]{8,}$/i;
const cuid2Regex = /^[0-9a-z]+$/;
const ulidRegex = /^[0-9A-HJKMNP-TV-Z]{26}$/i;
// const uuidRegex =
//   /^([a-f0-9]{8}-[a-f0-9]{4}-[1-5][a-f0-9]{3}-[a-f0-9]{4}-[a-f0-9]{12}|00000000-0000-0000-0000-000000000000)$/i;
const uuidRegex = /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/i;
const nanoidRegex = /^[a-z0-9_-]{21}$/i;
const jwtRegex = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]*$/;
const durationRegex = /^[-+]?P(?!$)(?:(?:[-+]?\d+Y)|(?:[-+]?\d+[.,]\d+Y$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:(?:[-+]?\d+W)|(?:[-+]?\d+[.,]\d+W$))?(?:(?:[-+]?\d+D)|(?:[-+]?\d+[.,]\d+D$))?(?:T(?=[\d+-])(?:(?:[-+]?\d+H)|(?:[-+]?\d+[.,]\d+H$))?(?:(?:[-+]?\d+M)|(?:[-+]?\d+[.,]\d+M$))?(?:[-+]?\d+(?:[.,]\d+)?S)?)??$/;
// from https://stackoverflow.com/a/46181/1550155
// old version: too slow, didn't support unicode
// const emailRegex = /^((([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+(\.([a-z]|\d|[!#\$%&'\*\+\-\/=\?\^_`{\|}~]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])+)*)|((\x22)((((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(([\x01-\x08\x0b\x0c\x0e-\x1f\x7f]|\x21|[\x23-\x5b]|[\x5d-\x7e]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(\\([\x01-\x09\x0b\x0c\x0d-\x7f]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF]))))*(((\x20|\x09)*(\x0d\x0a))?(\x20|\x09)+)?(\x22)))@((([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|\d|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))\.)+(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])|(([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])([a-z]|\d|-|\.|_|~|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])*([a-z]|[\u00A0-\uD7FF\uF900-\uFDCF\uFDF0-\uFFEF])))$/i;
//old email regex
// const emailRegex = /^(([^<>()[\].,;:\s@"]+(\.[^<>()[\].,;:\s@"]+)*)|(".+"))@((?!-)([^<>()[\].,;:\s@"]+\.)+[^<>()[\].,;:\s@"]{1,})[^-<>()[\].,;:\s@"]$/i;
// eslint-disable-next-line
// const emailRegex =
//   /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\])|(\[IPv6:(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))\])|([A-Za-z0-9]([A-Za-z0-9-]*[A-Za-z0-9])*(\.[A-Za-z]{2,})+))$/;
// const emailRegex =
//   /^[a-zA-Z0-9\.\!\#\$\%\&\'\*\+\/\=\?\^\_\`\{\|\}\~\-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
// const emailRegex =
//   /^(?:[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*|"(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21\x23-\x5b\x5d-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])*")@(?:(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?|\[(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?|[a-z0-9-]*[a-z0-9]:(?:[\x01-\x08\x0b\x0c\x0e-\x1f\x21-\x5a\x53-\x7f]|\\[\x01-\x09\x0b\x0c\x0e-\x7f])+)\])$/i;
const emailRegex = /^(?!\.)(?!.*\.\.)([A-Z0-9_'+\-\.]*)[A-Z0-9_+-]@([A-Z0-9][A-Z0-9\-]*\.)+[A-Z]{2,}$/i;
// const emailRegex =
//   /^[a-z0-9.!#$%&’*+/=?^_`{|}~-]+@[a-z0-9-]+(?:\.[a-z0-9\-]+)*$/i;
// from https://thekevinscott.com/emojis-in-javascript/#writing-a-regular-expression
const _emojiRegex = `^(\\p{Extended_Pictographic}|\\p{Emoji_Component})+$`;
let emojiRegex;
// faster, simpler, safer
const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])$/;
const ipv4CidrRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\.){3}(?:25[0-5]|2[0-4][0-9]|1[0-9][0-9]|[1-9][0-9]|[0-9])\/(3[0-2]|[12]?[0-9])$/;
// const ipv6Regex =
// /^(([a-f0-9]{1,4}:){7}|::([a-f0-9]{1,4}:){0,6}|([a-f0-9]{1,4}:){1}:([a-f0-9]{1,4}:){0,5}|([a-f0-9]{1,4}:){2}:([a-f0-9]{1,4}:){0,4}|([a-f0-9]{1,4}:){3}:([a-f0-9]{1,4}:){0,3}|([a-f0-9]{1,4}:){4}:([a-f0-9]{1,4}:){0,2}|([a-f0-9]{1,4}:){5}:([a-f0-9]{1,4}:){0,1})([a-f0-9]{1,4}|(((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2}))\.){3}((25[0-5])|(2[0-4][0-9])|(1[0-9]{2})|([0-9]{1,2})))$/;
const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
const ipv6CidrRegex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))\/(12[0-8]|1[01][0-9]|[1-9]?[0-9])$/;
// https://stackoverflow.com/questions/7860392/determine-if-string-is-in-base64-using-javascript
const base64Regex = /^([0-9a-zA-Z+/]{4})*(([0-9a-zA-Z+/]{2}==)|([0-9a-zA-Z+/]{3}=))?$/;
// https://base64.guru/standards/base64url
const base64urlRegex = /^([0-9a-zA-Z-_]{4})*(([0-9a-zA-Z-_]{2}(==)?)|([0-9a-zA-Z-_]{3}(=)?))?$/;
// simple
// const dateRegexSource = `\\d{4}-\\d{2}-\\d{2}`;
// no leap year validation
// const dateRegexSource = `\\d{4}-((0[13578]|10|12)-31|(0[13-9]|1[0-2])-30|(0[1-9]|1[0-2])-(0[1-9]|1\\d|2\\d))`;
// with leap year validation
const dateRegexSource = `((\\d\\d[2468][048]|\\d\\d[13579][26]|\\d\\d0[48]|[02468][048]00|[13579][26]00)-02-29|\\d{4}-((0[13578]|1[02])-(0[1-9]|[12]\\d|3[01])|(0[469]|11)-(0[1-9]|[12]\\d|30)|(02)-(0[1-9]|1\\d|2[0-8])))`;
const dateRegex = new RegExp(`^${dateRegexSource}$`);
function timeRegexSource(args) {
    let secondsRegexSource = `[0-5]\\d`;
    if (args.precision) {
        secondsRegexSource = `${secondsRegexSource}\\.\\d{${args.precision}}`;
    }
    else if (args.precision == null) {
        secondsRegexSource = `${secondsRegexSource}(\\.\\d+)?`;
    }
    const secondsQuantifier = args.precision ? "+" : "?"; // require seconds if precision is nonzero
    return `([01]\\d|2[0-3]):[0-5]\\d(:${secondsRegexSource})${secondsQuantifier}`;
}
function timeRegex(args) {
    return new RegExp(`^${timeRegexSource(args)}$`);
}
// Adapted from https://stackoverflow.com/a/3143231
function datetimeRegex(args) {
    let regex = `${dateRegexSource}T${timeRegexSource(args)}`;
    const opts = [];
    opts.push(args.local ? `Z?` : `Z`);
    if (args.offset)
        opts.push(`([+-]\\d{2}:?\\d{2})`);
    regex = `${regex}(${opts.join("|")})`;
    return new RegExp(`^${regex}$`);
}
function isValidIP(ip, version) {
    if ((version === "v4" || !version) && ipv4Regex.test(ip)) {
        return true;
    }
    if ((version === "v6" || !version) && ipv6Regex.test(ip)) {
        return true;
    }
    return false;
}
function isValidJWT(jwt, alg) {
    if (!jwtRegex.test(jwt))
        return false;
    try {
        const [header] = jwt.split(".");
        if (!header)
            return false;
        // Convert base64url to base64
        const base64 = header
            .replace(/-/g, "+")
            .replace(/_/g, "/")
            .padEnd(header.length + ((4 - (header.length % 4)) % 4), "=");
        const decoded = JSON.parse(atob(base64));
        if (typeof decoded !== "object" || decoded === null)
            return false;
        if ("typ" in decoded && decoded?.typ !== "JWT")
            return false;
        if (!decoded.alg)
            return false;
        if (alg && decoded.alg !== alg)
            return false;
        return true;
    }
    catch {
        return false;
    }
}
function isValidCidr(ip, version) {
    if ((version === "v4" || !version) && ipv4CidrRegex.test(ip)) {
        return true;
    }
    if ((version === "v6" || !version) && ipv6CidrRegex.test(ip)) {
        return true;
    }
    return false;
}
class ZodString extends ZodType {
    _parse(input) {
        if (this._def.coerce) {
            input.data = String(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== util_js_1.ZodParsedType.string) {
            const ctx = this._getOrReturnCtx(input);
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_type,
                expected: util_js_1.ZodParsedType.string,
                received: ctx.parsedType,
            });
            return parseUtil_js_1.INVALID;
        }
        const status = new parseUtil_js_1.ParseStatus();
        let ctx = undefined;
        for (const check of this._def.checks) {
            if (check.kind === "min") {
                if (input.data.length < check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        code: ZodError_js_1.ZodIssueCode.too_small,
                        minimum: check.value,
                        type: "string",
                        inclusive: true,
                        exact: false,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "max") {
                if (input.data.length > check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        code: ZodError_js_1.ZodIssueCode.too_big,
                        maximum: check.value,
                        type: "string",
                        inclusive: true,
                        exact: false,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "length") {
                const tooBig = input.data.length > check.value;
                const tooSmall = input.data.length < check.value;
                if (tooBig || tooSmall) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    if (tooBig) {
                        (0, parseUtil_js_1.addIssueToContext)(ctx, {
                            code: ZodError_js_1.ZodIssueCode.too_big,
                            maximum: check.value,
                            type: "string",
                            inclusive: true,
                            exact: true,
                            message: check.message,
                        });
                    }
                    else if (tooSmall) {
                        (0, parseUtil_js_1.addIssueToContext)(ctx, {
                            code: ZodError_js_1.ZodIssueCode.too_small,
                            minimum: check.value,
                            type: "string",
                            inclusive: true,
                            exact: true,
                            message: check.message,
                        });
                    }
                    status.dirty();
                }
            }
            else if (check.kind === "email") {
                if (!emailRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        validation: "email",
                        code: ZodError_js_1.ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "emoji") {
                if (!emojiRegex) {
                    emojiRegex = new RegExp(_emojiRegex, "u");
                }
                if (!emojiRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        validation: "emoji",
                        code: ZodError_js_1.ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "uuid") {
                if (!uuidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        validation: "uuid",
                        code: ZodError_js_1.ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "nanoid") {
                if (!nanoidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        validation: "nanoid",
                        code: ZodError_js_1.ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "cuid") {
                if (!cuidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        validation: "cuid",
                        code: ZodError_js_1.ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "cuid2") {
                if (!cuid2Regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        validation: "cuid2",
                        code: ZodError_js_1.ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "ulid") {
                if (!ulidRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        validation: "ulid",
                        code: ZodError_js_1.ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "url") {
                try {
                    new URL(input.data);
                }
                catch {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        validation: "url",
                        code: ZodError_js_1.ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "regex") {
                check.regex.lastIndex = 0;
                const testResult = check.regex.test(input.data);
                if (!testResult) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        validation: "regex",
                        code: ZodError_js_1.ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "trim") {
                input.data = input.data.trim();
            }
            else if (check.kind === "includes") {
                if (!input.data.includes(check.value, check.position)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        code: ZodError_js_1.ZodIssueCode.invalid_string,
                        validation: { includes: check.value, position: check.position },
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "toLowerCase") {
                input.data = input.data.toLowerCase();
            }
            else if (check.kind === "toUpperCase") {
                input.data = input.data.toUpperCase();
            }
            else if (check.kind === "startsWith") {
                if (!input.data.startsWith(check.value)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        code: ZodError_js_1.ZodIssueCode.invalid_string,
                        validation: { startsWith: check.value },
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "endsWith") {
                if (!input.data.endsWith(check.value)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        code: ZodError_js_1.ZodIssueCode.invalid_string,
                        validation: { endsWith: check.value },
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "datetime") {
                const regex = datetimeRegex(check);
                if (!regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        code: ZodError_js_1.ZodIssueCode.invalid_string,
                        validation: "datetime",
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "date") {
                const regex = dateRegex;
                if (!regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        code: ZodError_js_1.ZodIssueCode.invalid_string,
                        validation: "date",
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "time") {
                const regex = timeRegex(check);
                if (!regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        code: ZodError_js_1.ZodIssueCode.invalid_string,
                        validation: "time",
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "duration") {
                if (!durationRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        validation: "duration",
                        code: ZodError_js_1.ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "ip") {
                if (!isValidIP(input.data, check.version)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        validation: "ip",
                        code: ZodError_js_1.ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "jwt") {
                if (!isValidJWT(input.data, check.alg)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        validation: "jwt",
                        code: ZodError_js_1.ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "cidr") {
                if (!isValidCidr(input.data, check.version)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        validation: "cidr",
                        code: ZodError_js_1.ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "base64") {
                if (!base64Regex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        validation: "base64",
                        code: ZodError_js_1.ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "base64url") {
                if (!base64urlRegex.test(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        validation: "base64url",
                        code: ZodError_js_1.ZodIssueCode.invalid_string,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else {
                util_js_1.util.assertNever(check);
            }
        }
        return { status: status.value, value: input.data };
    }
    _regex(regex, validation, message) {
        return this.refinement((data) => regex.test(data), {
            validation,
            code: ZodError_js_1.ZodIssueCode.invalid_string,
            ...errorUtil_js_1.errorUtil.errToObj(message),
        });
    }
    _addCheck(check) {
        return new ZodString({
            ...this._def,
            checks: [...this._def.checks, check],
        });
    }
    email(message) {
        return this._addCheck({ kind: "email", ...errorUtil_js_1.errorUtil.errToObj(message) });
    }
    url(message) {
        return this._addCheck({ kind: "url", ...errorUtil_js_1.errorUtil.errToObj(message) });
    }
    emoji(message) {
        return this._addCheck({ kind: "emoji", ...errorUtil_js_1.errorUtil.errToObj(message) });
    }
    uuid(message) {
        return this._addCheck({ kind: "uuid", ...errorUtil_js_1.errorUtil.errToObj(message) });
    }
    nanoid(message) {
        return this._addCheck({ kind: "nanoid", ...errorUtil_js_1.errorUtil.errToObj(message) });
    }
    cuid(message) {
        return this._addCheck({ kind: "cuid", ...errorUtil_js_1.errorUtil.errToObj(message) });
    }
    cuid2(message) {
        return this._addCheck({ kind: "cuid2", ...errorUtil_js_1.errorUtil.errToObj(message) });
    }
    ulid(message) {
        return this._addCheck({ kind: "ulid", ...errorUtil_js_1.errorUtil.errToObj(message) });
    }
    base64(message) {
        return this._addCheck({ kind: "base64", ...errorUtil_js_1.errorUtil.errToObj(message) });
    }
    base64url(message) {
        // base64url encoding is a modification of base64 that can safely be used in URLs and filenames
        return this._addCheck({
            kind: "base64url",
            ...errorUtil_js_1.errorUtil.errToObj(message),
        });
    }
    jwt(options) {
        return this._addCheck({ kind: "jwt", ...errorUtil_js_1.errorUtil.errToObj(options) });
    }
    ip(options) {
        return this._addCheck({ kind: "ip", ...errorUtil_js_1.errorUtil.errToObj(options) });
    }
    cidr(options) {
        return this._addCheck({ kind: "cidr", ...errorUtil_js_1.errorUtil.errToObj(options) });
    }
    datetime(options) {
        if (typeof options === "string") {
            return this._addCheck({
                kind: "datetime",
                precision: null,
                offset: false,
                local: false,
                message: options,
            });
        }
        return this._addCheck({
            kind: "datetime",
            precision: typeof options?.precision === "undefined" ? null : options?.precision,
            offset: options?.offset ?? false,
            local: options?.local ?? false,
            ...errorUtil_js_1.errorUtil.errToObj(options?.message),
        });
    }
    date(message) {
        return this._addCheck({ kind: "date", message });
    }
    time(options) {
        if (typeof options === "string") {
            return this._addCheck({
                kind: "time",
                precision: null,
                message: options,
            });
        }
        return this._addCheck({
            kind: "time",
            precision: typeof options?.precision === "undefined" ? null : options?.precision,
            ...errorUtil_js_1.errorUtil.errToObj(options?.message),
        });
    }
    duration(message) {
        return this._addCheck({ kind: "duration", ...errorUtil_js_1.errorUtil.errToObj(message) });
    }
    regex(regex, message) {
        return this._addCheck({
            kind: "regex",
            regex: regex,
            ...errorUtil_js_1.errorUtil.errToObj(message),
        });
    }
    includes(value, options) {
        return this._addCheck({
            kind: "includes",
            value: value,
            position: options?.position,
            ...errorUtil_js_1.errorUtil.errToObj(options?.message),
        });
    }
    startsWith(value, message) {
        return this._addCheck({
            kind: "startsWith",
            value: value,
            ...errorUtil_js_1.errorUtil.errToObj(message),
        });
    }
    endsWith(value, message) {
        return this._addCheck({
            kind: "endsWith",
            value: value,
            ...errorUtil_js_1.errorUtil.errToObj(message),
        });
    }
    min(minLength, message) {
        return this._addCheck({
            kind: "min",
            value: minLength,
            ...errorUtil_js_1.errorUtil.errToObj(message),
        });
    }
    max(maxLength, message) {
        return this._addCheck({
            kind: "max",
            value: maxLength,
            ...errorUtil_js_1.errorUtil.errToObj(message),
        });
    }
    length(len, message) {
        return this._addCheck({
            kind: "length",
            value: len,
            ...errorUtil_js_1.errorUtil.errToObj(message),
        });
    }
    /**
     * Equivalent to `.min(1)`
     */
    nonempty(message) {
        return this.min(1, errorUtil_js_1.errorUtil.errToObj(message));
    }
    trim() {
        return new ZodString({
            ...this._def,
            checks: [...this._def.checks, { kind: "trim" }],
        });
    }
    toLowerCase() {
        return new ZodString({
            ...this._def,
            checks: [...this._def.checks, { kind: "toLowerCase" }],
        });
    }
    toUpperCase() {
        return new ZodString({
            ...this._def,
            checks: [...this._def.checks, { kind: "toUpperCase" }],
        });
    }
    get isDatetime() {
        return !!this._def.checks.find((ch) => ch.kind === "datetime");
    }
    get isDate() {
        return !!this._def.checks.find((ch) => ch.kind === "date");
    }
    get isTime() {
        return !!this._def.checks.find((ch) => ch.kind === "time");
    }
    get isDuration() {
        return !!this._def.checks.find((ch) => ch.kind === "duration");
    }
    get isEmail() {
        return !!this._def.checks.find((ch) => ch.kind === "email");
    }
    get isURL() {
        return !!this._def.checks.find((ch) => ch.kind === "url");
    }
    get isEmoji() {
        return !!this._def.checks.find((ch) => ch.kind === "emoji");
    }
    get isUUID() {
        return !!this._def.checks.find((ch) => ch.kind === "uuid");
    }
    get isNANOID() {
        return !!this._def.checks.find((ch) => ch.kind === "nanoid");
    }
    get isCUID() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid");
    }
    get isCUID2() {
        return !!this._def.checks.find((ch) => ch.kind === "cuid2");
    }
    get isULID() {
        return !!this._def.checks.find((ch) => ch.kind === "ulid");
    }
    get isIP() {
        return !!this._def.checks.find((ch) => ch.kind === "ip");
    }
    get isCIDR() {
        return !!this._def.checks.find((ch) => ch.kind === "cidr");
    }
    get isBase64() {
        return !!this._def.checks.find((ch) => ch.kind === "base64");
    }
    get isBase64url() {
        // base64url encoding is a modification of base64 that can safely be used in URLs and filenames
        return !!this._def.checks.find((ch) => ch.kind === "base64url");
    }
    get minLength() {
        let min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
        }
        return min;
    }
    get maxLength() {
        let max = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return max;
    }
}
exports.ZodString = ZodString;
ZodString.create = (params) => {
    return new ZodString({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodString,
        coerce: params?.coerce ?? false,
        ...processCreateParams(params),
    });
};
// https://stackoverflow.com/questions/3966484/why-does-modulus-operator-return-fractional-number-in-javascript/31711034#31711034
function floatSafeRemainder(val, step) {
    const valDecCount = (val.toString().split(".")[1] || "").length;
    const stepDecCount = (step.toString().split(".")[1] || "").length;
    const decCount = valDecCount > stepDecCount ? valDecCount : stepDecCount;
    const valInt = Number.parseInt(val.toFixed(decCount).replace(".", ""));
    const stepInt = Number.parseInt(step.toFixed(decCount).replace(".", ""));
    return (valInt % stepInt) / 10 ** decCount;
}
class ZodNumber extends ZodType {
    constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
        this.step = this.multipleOf;
    }
    _parse(input) {
        if (this._def.coerce) {
            input.data = Number(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== util_js_1.ZodParsedType.number) {
            const ctx = this._getOrReturnCtx(input);
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_type,
                expected: util_js_1.ZodParsedType.number,
                received: ctx.parsedType,
            });
            return parseUtil_js_1.INVALID;
        }
        let ctx = undefined;
        const status = new parseUtil_js_1.ParseStatus();
        for (const check of this._def.checks) {
            if (check.kind === "int") {
                if (!util_js_1.util.isInteger(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        code: ZodError_js_1.ZodIssueCode.invalid_type,
                        expected: "integer",
                        received: "float",
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "min") {
                const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
                if (tooSmall) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        code: ZodError_js_1.ZodIssueCode.too_small,
                        minimum: check.value,
                        type: "number",
                        inclusive: check.inclusive,
                        exact: false,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "max") {
                const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
                if (tooBig) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        code: ZodError_js_1.ZodIssueCode.too_big,
                        maximum: check.value,
                        type: "number",
                        inclusive: check.inclusive,
                        exact: false,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "multipleOf") {
                if (floatSafeRemainder(input.data, check.value) !== 0) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        code: ZodError_js_1.ZodIssueCode.not_multiple_of,
                        multipleOf: check.value,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "finite") {
                if (!Number.isFinite(input.data)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        code: ZodError_js_1.ZodIssueCode.not_finite,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else {
                util_js_1.util.assertNever(check);
            }
        }
        return { status: status.value, value: input.data };
    }
    gte(value, message) {
        return this.setLimit("min", value, true, errorUtil_js_1.errorUtil.toString(message));
    }
    gt(value, message) {
        return this.setLimit("min", value, false, errorUtil_js_1.errorUtil.toString(message));
    }
    lte(value, message) {
        return this.setLimit("max", value, true, errorUtil_js_1.errorUtil.toString(message));
    }
    lt(value, message) {
        return this.setLimit("max", value, false, errorUtil_js_1.errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
        return new ZodNumber({
            ...this._def,
            checks: [
                ...this._def.checks,
                {
                    kind,
                    value,
                    inclusive,
                    message: errorUtil_js_1.errorUtil.toString(message),
                },
            ],
        });
    }
    _addCheck(check) {
        return new ZodNumber({
            ...this._def,
            checks: [...this._def.checks, check],
        });
    }
    int(message) {
        return this._addCheck({
            kind: "int",
            message: errorUtil_js_1.errorUtil.toString(message),
        });
    }
    positive(message) {
        return this._addCheck({
            kind: "min",
            value: 0,
            inclusive: false,
            message: errorUtil_js_1.errorUtil.toString(message),
        });
    }
    negative(message) {
        return this._addCheck({
            kind: "max",
            value: 0,
            inclusive: false,
            message: errorUtil_js_1.errorUtil.toString(message),
        });
    }
    nonpositive(message) {
        return this._addCheck({
            kind: "max",
            value: 0,
            inclusive: true,
            message: errorUtil_js_1.errorUtil.toString(message),
        });
    }
    nonnegative(message) {
        return this._addCheck({
            kind: "min",
            value: 0,
            inclusive: true,
            message: errorUtil_js_1.errorUtil.toString(message),
        });
    }
    multipleOf(value, message) {
        return this._addCheck({
            kind: "multipleOf",
            value: value,
            message: errorUtil_js_1.errorUtil.toString(message),
        });
    }
    finite(message) {
        return this._addCheck({
            kind: "finite",
            message: errorUtil_js_1.errorUtil.toString(message),
        });
    }
    safe(message) {
        return this._addCheck({
            kind: "min",
            inclusive: true,
            value: Number.MIN_SAFE_INTEGER,
            message: errorUtil_js_1.errorUtil.toString(message),
        })._addCheck({
            kind: "max",
            inclusive: true,
            value: Number.MAX_SAFE_INTEGER,
            message: errorUtil_js_1.errorUtil.toString(message),
        });
    }
    get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
        }
        return min;
    }
    get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return max;
    }
    get isInt() {
        return !!this._def.checks.find((ch) => ch.kind === "int" || (ch.kind === "multipleOf" && util_js_1.util.isInteger(ch.value)));
    }
    get isFinite() {
        let max = null;
        let min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "finite" || ch.kind === "int" || ch.kind === "multipleOf") {
                return true;
            }
            else if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
            else if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return Number.isFinite(min) && Number.isFinite(max);
    }
}
exports.ZodNumber = ZodNumber;
ZodNumber.create = (params) => {
    return new ZodNumber({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodNumber,
        coerce: params?.coerce || false,
        ...processCreateParams(params),
    });
};
class ZodBigInt extends ZodType {
    constructor() {
        super(...arguments);
        this.min = this.gte;
        this.max = this.lte;
    }
    _parse(input) {
        if (this._def.coerce) {
            try {
                input.data = BigInt(input.data);
            }
            catch {
                return this._getInvalidInput(input);
            }
        }
        const parsedType = this._getType(input);
        if (parsedType !== util_js_1.ZodParsedType.bigint) {
            return this._getInvalidInput(input);
        }
        let ctx = undefined;
        const status = new parseUtil_js_1.ParseStatus();
        for (const check of this._def.checks) {
            if (check.kind === "min") {
                const tooSmall = check.inclusive ? input.data < check.value : input.data <= check.value;
                if (tooSmall) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        code: ZodError_js_1.ZodIssueCode.too_small,
                        type: "bigint",
                        minimum: check.value,
                        inclusive: check.inclusive,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "max") {
                const tooBig = check.inclusive ? input.data > check.value : input.data >= check.value;
                if (tooBig) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        code: ZodError_js_1.ZodIssueCode.too_big,
                        type: "bigint",
                        maximum: check.value,
                        inclusive: check.inclusive,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "multipleOf") {
                if (input.data % check.value !== BigInt(0)) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        code: ZodError_js_1.ZodIssueCode.not_multiple_of,
                        multipleOf: check.value,
                        message: check.message,
                    });
                    status.dirty();
                }
            }
            else {
                util_js_1.util.assertNever(check);
            }
        }
        return { status: status.value, value: input.data };
    }
    _getInvalidInput(input) {
        const ctx = this._getOrReturnCtx(input);
        (0, parseUtil_js_1.addIssueToContext)(ctx, {
            code: ZodError_js_1.ZodIssueCode.invalid_type,
            expected: util_js_1.ZodParsedType.bigint,
            received: ctx.parsedType,
        });
        return parseUtil_js_1.INVALID;
    }
    gte(value, message) {
        return this.setLimit("min", value, true, errorUtil_js_1.errorUtil.toString(message));
    }
    gt(value, message) {
        return this.setLimit("min", value, false, errorUtil_js_1.errorUtil.toString(message));
    }
    lte(value, message) {
        return this.setLimit("max", value, true, errorUtil_js_1.errorUtil.toString(message));
    }
    lt(value, message) {
        return this.setLimit("max", value, false, errorUtil_js_1.errorUtil.toString(message));
    }
    setLimit(kind, value, inclusive, message) {
        return new ZodBigInt({
            ...this._def,
            checks: [
                ...this._def.checks,
                {
                    kind,
                    value,
                    inclusive,
                    message: errorUtil_js_1.errorUtil.toString(message),
                },
            ],
        });
    }
    _addCheck(check) {
        return new ZodBigInt({
            ...this._def,
            checks: [...this._def.checks, check],
        });
    }
    positive(message) {
        return this._addCheck({
            kind: "min",
            value: BigInt(0),
            inclusive: false,
            message: errorUtil_js_1.errorUtil.toString(message),
        });
    }
    negative(message) {
        return this._addCheck({
            kind: "max",
            value: BigInt(0),
            inclusive: false,
            message: errorUtil_js_1.errorUtil.toString(message),
        });
    }
    nonpositive(message) {
        return this._addCheck({
            kind: "max",
            value: BigInt(0),
            inclusive: true,
            message: errorUtil_js_1.errorUtil.toString(message),
        });
    }
    nonnegative(message) {
        return this._addCheck({
            kind: "min",
            value: BigInt(0),
            inclusive: true,
            message: errorUtil_js_1.errorUtil.toString(message),
        });
    }
    multipleOf(value, message) {
        return this._addCheck({
            kind: "multipleOf",
            value,
            message: errorUtil_js_1.errorUtil.toString(message),
        });
    }
    get minValue() {
        let min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
        }
        return min;
    }
    get maxValue() {
        let max = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return max;
    }
}
exports.ZodBigInt = ZodBigInt;
ZodBigInt.create = (params) => {
    return new ZodBigInt({
        checks: [],
        typeName: ZodFirstPartyTypeKind.ZodBigInt,
        coerce: params?.coerce ?? false,
        ...processCreateParams(params),
    });
};
class ZodBoolean extends ZodType {
    _parse(input) {
        if (this._def.coerce) {
            input.data = Boolean(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== util_js_1.ZodParsedType.boolean) {
            const ctx = this._getOrReturnCtx(input);
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_type,
                expected: util_js_1.ZodParsedType.boolean,
                received: ctx.parsedType,
            });
            return parseUtil_js_1.INVALID;
        }
        return (0, parseUtil_js_1.OK)(input.data);
    }
}
exports.ZodBoolean = ZodBoolean;
ZodBoolean.create = (params) => {
    return new ZodBoolean({
        typeName: ZodFirstPartyTypeKind.ZodBoolean,
        coerce: params?.coerce || false,
        ...processCreateParams(params),
    });
};
class ZodDate extends ZodType {
    _parse(input) {
        if (this._def.coerce) {
            input.data = new Date(input.data);
        }
        const parsedType = this._getType(input);
        if (parsedType !== util_js_1.ZodParsedType.date) {
            const ctx = this._getOrReturnCtx(input);
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_type,
                expected: util_js_1.ZodParsedType.date,
                received: ctx.parsedType,
            });
            return parseUtil_js_1.INVALID;
        }
        if (Number.isNaN(input.data.getTime())) {
            const ctx = this._getOrReturnCtx(input);
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_date,
            });
            return parseUtil_js_1.INVALID;
        }
        const status = new parseUtil_js_1.ParseStatus();
        let ctx = undefined;
        for (const check of this._def.checks) {
            if (check.kind === "min") {
                if (input.data.getTime() < check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        code: ZodError_js_1.ZodIssueCode.too_small,
                        message: check.message,
                        inclusive: true,
                        exact: false,
                        minimum: check.value,
                        type: "date",
                    });
                    status.dirty();
                }
            }
            else if (check.kind === "max") {
                if (input.data.getTime() > check.value) {
                    ctx = this._getOrReturnCtx(input, ctx);
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        code: ZodError_js_1.ZodIssueCode.too_big,
                        message: check.message,
                        inclusive: true,
                        exact: false,
                        maximum: check.value,
                        type: "date",
                    });
                    status.dirty();
                }
            }
            else {
                util_js_1.util.assertNever(check);
            }
        }
        return {
            status: status.value,
            value: new Date(input.data.getTime()),
        };
    }
    _addCheck(check) {
        return new ZodDate({
            ...this._def,
            checks: [...this._def.checks, check],
        });
    }
    min(minDate, message) {
        return this._addCheck({
            kind: "min",
            value: minDate.getTime(),
            message: errorUtil_js_1.errorUtil.toString(message),
        });
    }
    max(maxDate, message) {
        return this._addCheck({
            kind: "max",
            value: maxDate.getTime(),
            message: errorUtil_js_1.errorUtil.toString(message),
        });
    }
    get minDate() {
        let min = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "min") {
                if (min === null || ch.value > min)
                    min = ch.value;
            }
        }
        return min != null ? new Date(min) : null;
    }
    get maxDate() {
        let max = null;
        for (const ch of this._def.checks) {
            if (ch.kind === "max") {
                if (max === null || ch.value < max)
                    max = ch.value;
            }
        }
        return max != null ? new Date(max) : null;
    }
}
exports.ZodDate = ZodDate;
ZodDate.create = (params) => {
    return new ZodDate({
        checks: [],
        coerce: params?.coerce || false,
        typeName: ZodFirstPartyTypeKind.ZodDate,
        ...processCreateParams(params),
    });
};
class ZodSymbol extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== util_js_1.ZodParsedType.symbol) {
            const ctx = this._getOrReturnCtx(input);
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_type,
                expected: util_js_1.ZodParsedType.symbol,
                received: ctx.parsedType,
            });
            return parseUtil_js_1.INVALID;
        }
        return (0, parseUtil_js_1.OK)(input.data);
    }
}
exports.ZodSymbol = ZodSymbol;
ZodSymbol.create = (params) => {
    return new ZodSymbol({
        typeName: ZodFirstPartyTypeKind.ZodSymbol,
        ...processCreateParams(params),
    });
};
class ZodUndefined extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== util_js_1.ZodParsedType.undefined) {
            const ctx = this._getOrReturnCtx(input);
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_type,
                expected: util_js_1.ZodParsedType.undefined,
                received: ctx.parsedType,
            });
            return parseUtil_js_1.INVALID;
        }
        return (0, parseUtil_js_1.OK)(input.data);
    }
}
exports.ZodUndefined = ZodUndefined;
ZodUndefined.create = (params) => {
    return new ZodUndefined({
        typeName: ZodFirstPartyTypeKind.ZodUndefined,
        ...processCreateParams(params),
    });
};
class ZodNull extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== util_js_1.ZodParsedType.null) {
            const ctx = this._getOrReturnCtx(input);
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_type,
                expected: util_js_1.ZodParsedType.null,
                received: ctx.parsedType,
            });
            return parseUtil_js_1.INVALID;
        }
        return (0, parseUtil_js_1.OK)(input.data);
    }
}
exports.ZodNull = ZodNull;
ZodNull.create = (params) => {
    return new ZodNull({
        typeName: ZodFirstPartyTypeKind.ZodNull,
        ...processCreateParams(params),
    });
};
class ZodAny extends ZodType {
    constructor() {
        super(...arguments);
        // to prevent instances of other classes from extending ZodAny. this causes issues with catchall in ZodObject.
        this._any = true;
    }
    _parse(input) {
        return (0, parseUtil_js_1.OK)(input.data);
    }
}
exports.ZodAny = ZodAny;
ZodAny.create = (params) => {
    return new ZodAny({
        typeName: ZodFirstPartyTypeKind.ZodAny,
        ...processCreateParams(params),
    });
};
class ZodUnknown extends ZodType {
    constructor() {
        super(...arguments);
        // required
        this._unknown = true;
    }
    _parse(input) {
        return (0, parseUtil_js_1.OK)(input.data);
    }
}
exports.ZodUnknown = ZodUnknown;
ZodUnknown.create = (params) => {
    return new ZodUnknown({
        typeName: ZodFirstPartyTypeKind.ZodUnknown,
        ...processCreateParams(params),
    });
};
class ZodNever extends ZodType {
    _parse(input) {
        const ctx = this._getOrReturnCtx(input);
        (0, parseUtil_js_1.addIssueToContext)(ctx, {
            code: ZodError_js_1.ZodIssueCode.invalid_type,
            expected: util_js_1.ZodParsedType.never,
            received: ctx.parsedType,
        });
        return parseUtil_js_1.INVALID;
    }
}
exports.ZodNever = ZodNever;
ZodNever.create = (params) => {
    return new ZodNever({
        typeName: ZodFirstPartyTypeKind.ZodNever,
        ...processCreateParams(params),
    });
};
class ZodVoid extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== util_js_1.ZodParsedType.undefined) {
            const ctx = this._getOrReturnCtx(input);
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_type,
                expected: util_js_1.ZodParsedType.void,
                received: ctx.parsedType,
            });
            return parseUtil_js_1.INVALID;
        }
        return (0, parseUtil_js_1.OK)(input.data);
    }
}
exports.ZodVoid = ZodVoid;
ZodVoid.create = (params) => {
    return new ZodVoid({
        typeName: ZodFirstPartyTypeKind.ZodVoid,
        ...processCreateParams(params),
    });
};
class ZodArray extends ZodType {
    _parse(input) {
        const { ctx, status } = this._processInputParams(input);
        const def = this._def;
        if (ctx.parsedType !== util_js_1.ZodParsedType.array) {
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_type,
                expected: util_js_1.ZodParsedType.array,
                received: ctx.parsedType,
            });
            return parseUtil_js_1.INVALID;
        }
        if (def.exactLength !== null) {
            const tooBig = ctx.data.length > def.exactLength.value;
            const tooSmall = ctx.data.length < def.exactLength.value;
            if (tooBig || tooSmall) {
                (0, parseUtil_js_1.addIssueToContext)(ctx, {
                    code: tooBig ? ZodError_js_1.ZodIssueCode.too_big : ZodError_js_1.ZodIssueCode.too_small,
                    minimum: (tooSmall ? def.exactLength.value : undefined),
                    maximum: (tooBig ? def.exactLength.value : undefined),
                    type: "array",
                    inclusive: true,
                    exact: true,
                    message: def.exactLength.message,
                });
                status.dirty();
            }
        }
        if (def.minLength !== null) {
            if (ctx.data.length < def.minLength.value) {
                (0, parseUtil_js_1.addIssueToContext)(ctx, {
                    code: ZodError_js_1.ZodIssueCode.too_small,
                    minimum: def.minLength.value,
                    type: "array",
                    inclusive: true,
                    exact: false,
                    message: def.minLength.message,
                });
                status.dirty();
            }
        }
        if (def.maxLength !== null) {
            if (ctx.data.length > def.maxLength.value) {
                (0, parseUtil_js_1.addIssueToContext)(ctx, {
                    code: ZodError_js_1.ZodIssueCode.too_big,
                    maximum: def.maxLength.value,
                    type: "array",
                    inclusive: true,
                    exact: false,
                    message: def.maxLength.message,
                });
                status.dirty();
            }
        }
        if (ctx.common.async) {
            return Promise.all([...ctx.data].map((item, i) => {
                return def.type._parseAsync(new ParseInputLazyPath(ctx, item, ctx.path, i));
            })).then((result) => {
                return parseUtil_js_1.ParseStatus.mergeArray(status, result);
            });
        }
        const result = [...ctx.data].map((item, i) => {
            return def.type._parseSync(new ParseInputLazyPath(ctx, item, ctx.path, i));
        });
        return parseUtil_js_1.ParseStatus.mergeArray(status, result);
    }
    get element() {
        return this._def.type;
    }
    min(minLength, message) {
        return new ZodArray({
            ...this._def,
            minLength: { value: minLength, message: errorUtil_js_1.errorUtil.toString(message) },
        });
    }
    max(maxLength, message) {
        return new ZodArray({
            ...this._def,
            maxLength: { value: maxLength, message: errorUtil_js_1.errorUtil.toString(message) },
        });
    }
    length(len, message) {
        return new ZodArray({
            ...this._def,
            exactLength: { value: len, message: errorUtil_js_1.errorUtil.toString(message) },
        });
    }
    nonempty(message) {
        return this.min(1, message);
    }
}
exports.ZodArray = ZodArray;
ZodArray.create = (schema, params) => {
    return new ZodArray({
        type: schema,
        minLength: null,
        maxLength: null,
        exactLength: null,
        typeName: ZodFirstPartyTypeKind.ZodArray,
        ...processCreateParams(params),
    });
};
function deepPartialify(schema) {
    if (schema instanceof ZodObject) {
        const newShape = {};
        for (const key in schema.shape) {
            const fieldSchema = schema.shape[key];
            newShape[key] = ZodOptional.create(deepPartialify(fieldSchema));
        }
        return new ZodObject({
            ...schema._def,
            shape: () => newShape,
        });
    }
    else if (schema instanceof ZodArray) {
        return new ZodArray({
            ...schema._def,
            type: deepPartialify(schema.element),
        });
    }
    else if (schema instanceof ZodOptional) {
        return ZodOptional.create(deepPartialify(schema.unwrap()));
    }
    else if (schema instanceof ZodNullable) {
        return ZodNullable.create(deepPartialify(schema.unwrap()));
    }
    else if (schema instanceof ZodTuple) {
        return ZodTuple.create(schema.items.map((item) => deepPartialify(item)));
    }
    else {
        return schema;
    }
}
class ZodObject extends ZodType {
    constructor() {
        super(...arguments);
        this._cached = null;
        /**
         * @deprecated In most cases, this is no longer needed - unknown properties are now silently stripped.
         * If you want to pass through unknown properties, use `.passthrough()` instead.
         */
        this.nonstrict = this.passthrough;
        // extend<
        //   Augmentation extends ZodRawShape,
        //   NewOutput extends util.flatten<{
        //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
        //       ? Augmentation[k]["_output"]
        //       : k extends keyof Output
        //       ? Output[k]
        //       : never;
        //   }>,
        //   NewInput extends util.flatten<{
        //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
        //       ? Augmentation[k]["_input"]
        //       : k extends keyof Input
        //       ? Input[k]
        //       : never;
        //   }>
        // >(
        //   augmentation: Augmentation
        // ): ZodObject<
        //   extendShape<T, Augmentation>,
        //   UnknownKeys,
        //   Catchall,
        //   NewOutput,
        //   NewInput
        // > {
        //   return new ZodObject({
        //     ...this._def,
        //     shape: () => ({
        //       ...this._def.shape(),
        //       ...augmentation,
        //     }),
        //   }) as any;
        // }
        /**
         * @deprecated Use `.extend` instead
         *  */
        this.augment = this.extend;
    }
    _getCached() {
        if (this._cached !== null)
            return this._cached;
        const shape = this._def.shape();
        const keys = util_js_1.util.objectKeys(shape);
        this._cached = { shape, keys };
        return this._cached;
    }
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== util_js_1.ZodParsedType.object) {
            const ctx = this._getOrReturnCtx(input);
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_type,
                expected: util_js_1.ZodParsedType.object,
                received: ctx.parsedType,
            });
            return parseUtil_js_1.INVALID;
        }
        const { status, ctx } = this._processInputParams(input);
        const { shape, keys: shapeKeys } = this._getCached();
        const extraKeys = [];
        if (!(this._def.catchall instanceof ZodNever && this._def.unknownKeys === "strip")) {
            for (const key in ctx.data) {
                if (!shapeKeys.includes(key)) {
                    extraKeys.push(key);
                }
            }
        }
        const pairs = [];
        for (const key of shapeKeys) {
            const keyValidator = shape[key];
            const value = ctx.data[key];
            pairs.push({
                key: { status: "valid", value: key },
                value: keyValidator._parse(new ParseInputLazyPath(ctx, value, ctx.path, key)),
                alwaysSet: key in ctx.data,
            });
        }
        if (this._def.catchall instanceof ZodNever) {
            const unknownKeys = this._def.unknownKeys;
            if (unknownKeys === "passthrough") {
                for (const key of extraKeys) {
                    pairs.push({
                        key: { status: "valid", value: key },
                        value: { status: "valid", value: ctx.data[key] },
                    });
                }
            }
            else if (unknownKeys === "strict") {
                if (extraKeys.length > 0) {
                    (0, parseUtil_js_1.addIssueToContext)(ctx, {
                        code: ZodError_js_1.ZodIssueCode.unrecognized_keys,
                        keys: extraKeys,
                    });
                    status.dirty();
                }
            }
            else if (unknownKeys === "strip") {
            }
            else {
                throw new Error(`Internal ZodObject error: invalid unknownKeys value.`);
            }
        }
        else {
            // run catchall validation
            const catchall = this._def.catchall;
            for (const key of extraKeys) {
                const value = ctx.data[key];
                pairs.push({
                    key: { status: "valid", value: key },
                    value: catchall._parse(new ParseInputLazyPath(ctx, value, ctx.path, key) //, ctx.child(key), value, getParsedType(value)
                    ),
                    alwaysSet: key in ctx.data,
                });
            }
        }
        if (ctx.common.async) {
            return Promise.resolve()
                .then(async () => {
                const syncPairs = [];
                for (const pair of pairs) {
                    const key = await pair.key;
                    const value = await pair.value;
                    syncPairs.push({
                        key,
                        value,
                        alwaysSet: pair.alwaysSet,
                    });
                }
                return syncPairs;
            })
                .then((syncPairs) => {
                return parseUtil_js_1.ParseStatus.mergeObjectSync(status, syncPairs);
            });
        }
        else {
            return parseUtil_js_1.ParseStatus.mergeObjectSync(status, pairs);
        }
    }
    get shape() {
        return this._def.shape();
    }
    strict(message) {
        errorUtil_js_1.errorUtil.errToObj;
        return new ZodObject({
            ...this._def,
            unknownKeys: "strict",
            ...(message !== undefined
                ? {
                    errorMap: (issue, ctx) => {
                        const defaultError = this._def.errorMap?.(issue, ctx).message ?? ctx.defaultError;
                        if (issue.code === "unrecognized_keys")
                            return {
                                message: errorUtil_js_1.errorUtil.errToObj(message).message ?? defaultError,
                            };
                        return {
                            message: defaultError,
                        };
                    },
                }
                : {}),
        });
    }
    strip() {
        return new ZodObject({
            ...this._def,
            unknownKeys: "strip",
        });
    }
    passthrough() {
        return new ZodObject({
            ...this._def,
            unknownKeys: "passthrough",
        });
    }
    // const AugmentFactory =
    //   <Def extends ZodObjectDef>(def: Def) =>
    //   <Augmentation extends ZodRawShape>(
    //     augmentation: Augmentation
    //   ): ZodObject<
    //     extendShape<ReturnType<Def["shape"]>, Augmentation>,
    //     Def["unknownKeys"],
    //     Def["catchall"]
    //   > => {
    //     return new ZodObject({
    //       ...def,
    //       shape: () => ({
    //         ...def.shape(),
    //         ...augmentation,
    //       }),
    //     }) as any;
    //   };
    extend(augmentation) {
        return new ZodObject({
            ...this._def,
            shape: () => ({
                ...this._def.shape(),
                ...augmentation,
            }),
        });
    }
    /**
     * Prior to zod@1.0.12 there was a bug in the
     * inferred type of merged objects. Please
     * upgrade if you are experiencing issues.
     */
    merge(merging) {
        const merged = new ZodObject({
            unknownKeys: merging._def.unknownKeys,
            catchall: merging._def.catchall,
            shape: () => ({
                ...this._def.shape(),
                ...merging._def.shape(),
            }),
            typeName: ZodFirstPartyTypeKind.ZodObject,
        });
        return merged;
    }
    // merge<
    //   Incoming extends AnyZodObject,
    //   Augmentation extends Incoming["shape"],
    //   NewOutput extends {
    //     [k in keyof Augmentation | keyof Output]: k extends keyof Augmentation
    //       ? Augmentation[k]["_output"]
    //       : k extends keyof Output
    //       ? Output[k]
    //       : never;
    //   },
    //   NewInput extends {
    //     [k in keyof Augmentation | keyof Input]: k extends keyof Augmentation
    //       ? Augmentation[k]["_input"]
    //       : k extends keyof Input
    //       ? Input[k]
    //       : never;
    //   }
    // >(
    //   merging: Incoming
    // ): ZodObject<
    //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
    //   Incoming["_def"]["unknownKeys"],
    //   Incoming["_def"]["catchall"],
    //   NewOutput,
    //   NewInput
    // > {
    //   const merged: any = new ZodObject({
    //     unknownKeys: merging._def.unknownKeys,
    //     catchall: merging._def.catchall,
    //     shape: () =>
    //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
    //     typeName: ZodFirstPartyTypeKind.ZodObject,
    //   }) as any;
    //   return merged;
    // }
    setKey(key, schema) {
        return this.augment({ [key]: schema });
    }
    // merge<Incoming extends AnyZodObject>(
    //   merging: Incoming
    // ): //ZodObject<T & Incoming["_shape"], UnknownKeys, Catchall> = (merging) => {
    // ZodObject<
    //   extendShape<T, ReturnType<Incoming["_def"]["shape"]>>,
    //   Incoming["_def"]["unknownKeys"],
    //   Incoming["_def"]["catchall"]
    // > {
    //   // const mergedShape = objectUtil.mergeShapes(
    //   //   this._def.shape(),
    //   //   merging._def.shape()
    //   // );
    //   const merged: any = new ZodObject({
    //     unknownKeys: merging._def.unknownKeys,
    //     catchall: merging._def.catchall,
    //     shape: () =>
    //       objectUtil.mergeShapes(this._def.shape(), merging._def.shape()),
    //     typeName: ZodFirstPartyTypeKind.ZodObject,
    //   }) as any;
    //   return merged;
    // }
    catchall(index) {
        return new ZodObject({
            ...this._def,
            catchall: index,
        });
    }
    pick(mask) {
        const shape = {};
        for (const key of util_js_1.util.objectKeys(mask)) {
            if (mask[key] && this.shape[key]) {
                shape[key] = this.shape[key];
            }
        }
        return new ZodObject({
            ...this._def,
            shape: () => shape,
        });
    }
    omit(mask) {
        const shape = {};
        for (const key of util_js_1.util.objectKeys(this.shape)) {
            if (!mask[key]) {
                shape[key] = this.shape[key];
            }
        }
        return new ZodObject({
            ...this._def,
            shape: () => shape,
        });
    }
    /**
     * @deprecated
     */
    deepPartial() {
        return deepPartialify(this);
    }
    partial(mask) {
        const newShape = {};
        for (const key of util_js_1.util.objectKeys(this.shape)) {
            const fieldSchema = this.shape[key];
            if (mask && !mask[key]) {
                newShape[key] = fieldSchema;
            }
            else {
                newShape[key] = fieldSchema.optional();
            }
        }
        return new ZodObject({
            ...this._def,
            shape: () => newShape,
        });
    }
    required(mask) {
        const newShape = {};
        for (const key of util_js_1.util.objectKeys(this.shape)) {
            if (mask && !mask[key]) {
                newShape[key] = this.shape[key];
            }
            else {
                const fieldSchema = this.shape[key];
                let newField = fieldSchema;
                while (newField instanceof ZodOptional) {
                    newField = newField._def.innerType;
                }
                newShape[key] = newField;
            }
        }
        return new ZodObject({
            ...this._def,
            shape: () => newShape,
        });
    }
    keyof() {
        return createZodEnum(util_js_1.util.objectKeys(this.shape));
    }
}
exports.ZodObject = ZodObject;
ZodObject.create = (shape, params) => {
    return new ZodObject({
        shape: () => shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params),
    });
};
ZodObject.strictCreate = (shape, params) => {
    return new ZodObject({
        shape: () => shape,
        unknownKeys: "strict",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params),
    });
};
ZodObject.lazycreate = (shape, params) => {
    return new ZodObject({
        shape,
        unknownKeys: "strip",
        catchall: ZodNever.create(),
        typeName: ZodFirstPartyTypeKind.ZodObject,
        ...processCreateParams(params),
    });
};
class ZodUnion extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        const options = this._def.options;
        function handleResults(results) {
            // return first issue-free validation if it exists
            for (const result of results) {
                if (result.result.status === "valid") {
                    return result.result;
                }
            }
            for (const result of results) {
                if (result.result.status === "dirty") {
                    // add issues from dirty option
                    ctx.common.issues.push(...result.ctx.common.issues);
                    return result.result;
                }
            }
            // return invalid
            const unionErrors = results.map((result) => new ZodError_js_1.ZodError(result.ctx.common.issues));
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_union,
                unionErrors,
            });
            return parseUtil_js_1.INVALID;
        }
        if (ctx.common.async) {
            return Promise.all(options.map(async (option) => {
                const childCtx = {
                    ...ctx,
                    common: {
                        ...ctx.common,
                        issues: [],
                    },
                    parent: null,
                };
                return {
                    result: await option._parseAsync({
                        data: ctx.data,
                        path: ctx.path,
                        parent: childCtx,
                    }),
                    ctx: childCtx,
                };
            })).then(handleResults);
        }
        else {
            let dirty = undefined;
            const issues = [];
            for (const option of options) {
                const childCtx = {
                    ...ctx,
                    common: {
                        ...ctx.common,
                        issues: [],
                    },
                    parent: null,
                };
                const result = option._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: childCtx,
                });
                if (result.status === "valid") {
                    return result;
                }
                else if (result.status === "dirty" && !dirty) {
                    dirty = { result, ctx: childCtx };
                }
                if (childCtx.common.issues.length) {
                    issues.push(childCtx.common.issues);
                }
            }
            if (dirty) {
                ctx.common.issues.push(...dirty.ctx.common.issues);
                return dirty.result;
            }
            const unionErrors = issues.map((issues) => new ZodError_js_1.ZodError(issues));
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_union,
                unionErrors,
            });
            return parseUtil_js_1.INVALID;
        }
    }
    get options() {
        return this._def.options;
    }
}
exports.ZodUnion = ZodUnion;
ZodUnion.create = (types, params) => {
    return new ZodUnion({
        options: types,
        typeName: ZodFirstPartyTypeKind.ZodUnion,
        ...processCreateParams(params),
    });
};
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
//////////                                 //////////
//////////      ZodDiscriminatedUnion      //////////
//////////                                 //////////
/////////////////////////////////////////////////////
/////////////////////////////////////////////////////
const getDiscriminator = (type) => {
    if (type instanceof ZodLazy) {
        return getDiscriminator(type.schema);
    }
    else if (type instanceof ZodEffects) {
        return getDiscriminator(type.innerType());
    }
    else if (type instanceof ZodLiteral) {
        return [type.value];
    }
    else if (type instanceof ZodEnum) {
        return type.options;
    }
    else if (type instanceof ZodNativeEnum) {
        // eslint-disable-next-line ban/ban
        return util_js_1.util.objectValues(type.enum);
    }
    else if (type instanceof ZodDefault) {
        return getDiscriminator(type._def.innerType);
    }
    else if (type instanceof ZodUndefined) {
        return [undefined];
    }
    else if (type instanceof ZodNull) {
        return [null];
    }
    else if (type instanceof ZodOptional) {
        return [undefined, ...getDiscriminator(type.unwrap())];
    }
    else if (type instanceof ZodNullable) {
        return [null, ...getDiscriminator(type.unwrap())];
    }
    else if (type instanceof ZodBranded) {
        return getDiscriminator(type.unwrap());
    }
    else if (type instanceof ZodReadonly) {
        return getDiscriminator(type.unwrap());
    }
    else if (type instanceof ZodCatch) {
        return getDiscriminator(type._def.innerType);
    }
    else {
        return [];
    }
};
class ZodDiscriminatedUnion extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== util_js_1.ZodParsedType.object) {
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_type,
                expected: util_js_1.ZodParsedType.object,
                received: ctx.parsedType,
            });
            return parseUtil_js_1.INVALID;
        }
        const discriminator = this.discriminator;
        const discriminatorValue = ctx.data[discriminator];
        const option = this.optionsMap.get(discriminatorValue);
        if (!option) {
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_union_discriminator,
                options: Array.from(this.optionsMap.keys()),
                path: [discriminator],
            });
            return parseUtil_js_1.INVALID;
        }
        if (ctx.common.async) {
            return option._parseAsync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            });
        }
        else {
            return option._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            });
        }
    }
    get discriminator() {
        return this._def.discriminator;
    }
    get options() {
        return this._def.options;
    }
    get optionsMap() {
        return this._def.optionsMap;
    }
    /**
     * The constructor of the discriminated union schema. Its behaviour is very similar to that of the normal z.union() constructor.
     * However, it only allows a union of objects, all of which need to share a discriminator property. This property must
     * have a different value for each object in the union.
     * @param discriminator the name of the discriminator property
     * @param types an array of object schemas
     * @param params
     */
    static create(discriminator, options, params) {
        // Get all the valid discriminator values
        const optionsMap = new Map();
        // try {
        for (const type of options) {
            const discriminatorValues = getDiscriminator(type.shape[discriminator]);
            if (!discriminatorValues.length) {
                throw new Error(`A discriminator value for key \`${discriminator}\` could not be extracted from all schema options`);
            }
            for (const value of discriminatorValues) {
                if (optionsMap.has(value)) {
                    throw new Error(`Discriminator property ${String(discriminator)} has duplicate value ${String(value)}`);
                }
                optionsMap.set(value, type);
            }
        }
        return new ZodDiscriminatedUnion({
            typeName: ZodFirstPartyTypeKind.ZodDiscriminatedUnion,
            discriminator,
            options,
            optionsMap,
            ...processCreateParams(params),
        });
    }
}
exports.ZodDiscriminatedUnion = ZodDiscriminatedUnion;
function mergeValues(a, b) {
    const aType = (0, util_js_1.getParsedType)(a);
    const bType = (0, util_js_1.getParsedType)(b);
    if (a === b) {
        return { valid: true, data: a };
    }
    else if (aType === util_js_1.ZodParsedType.object && bType === util_js_1.ZodParsedType.object) {
        const bKeys = util_js_1.util.objectKeys(b);
        const sharedKeys = util_js_1.util.objectKeys(a).filter((key) => bKeys.indexOf(key) !== -1);
        const newObj = { ...a, ...b };
        for (const key of sharedKeys) {
            const sharedValue = mergeValues(a[key], b[key]);
            if (!sharedValue.valid) {
                return { valid: false };
            }
            newObj[key] = sharedValue.data;
        }
        return { valid: true, data: newObj };
    }
    else if (aType === util_js_1.ZodParsedType.array && bType === util_js_1.ZodParsedType.array) {
        if (a.length !== b.length) {
            return { valid: false };
        }
        const newArray = [];
        for (let index = 0; index < a.length; index++) {
            const itemA = a[index];
            const itemB = b[index];
            const sharedValue = mergeValues(itemA, itemB);
            if (!sharedValue.valid) {
                return { valid: false };
            }
            newArray.push(sharedValue.data);
        }
        return { valid: true, data: newArray };
    }
    else if (aType === util_js_1.ZodParsedType.date && bType === util_js_1.ZodParsedType.date && +a === +b) {
        return { valid: true, data: a };
    }
    else {
        return { valid: false };
    }
}
class ZodIntersection extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const handleParsed = (parsedLeft, parsedRight) => {
            if ((0, parseUtil_js_1.isAborted)(parsedLeft) || (0, parseUtil_js_1.isAborted)(parsedRight)) {
                return parseUtil_js_1.INVALID;
            }
            const merged = mergeValues(parsedLeft.value, parsedRight.value);
            if (!merged.valid) {
                (0, parseUtil_js_1.addIssueToContext)(ctx, {
                    code: ZodError_js_1.ZodIssueCode.invalid_intersection_types,
                });
                return parseUtil_js_1.INVALID;
            }
            if ((0, parseUtil_js_1.isDirty)(parsedLeft) || (0, parseUtil_js_1.isDirty)(parsedRight)) {
                status.dirty();
            }
            return { status: status.value, value: merged.data };
        };
        if (ctx.common.async) {
            return Promise.all([
                this._def.left._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                }),
                this._def.right._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                }),
            ]).then(([left, right]) => handleParsed(left, right));
        }
        else {
            return handleParsed(this._def.left._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            }), this._def.right._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            }));
        }
    }
}
exports.ZodIntersection = ZodIntersection;
ZodIntersection.create = (left, right, params) => {
    return new ZodIntersection({
        left: left,
        right: right,
        typeName: ZodFirstPartyTypeKind.ZodIntersection,
        ...processCreateParams(params),
    });
};
// type ZodTupleItems = [ZodTypeAny, ...ZodTypeAny[]];
class ZodTuple extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== util_js_1.ZodParsedType.array) {
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_type,
                expected: util_js_1.ZodParsedType.array,
                received: ctx.parsedType,
            });
            return parseUtil_js_1.INVALID;
        }
        if (ctx.data.length < this._def.items.length) {
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.too_small,
                minimum: this._def.items.length,
                inclusive: true,
                exact: false,
                type: "array",
            });
            return parseUtil_js_1.INVALID;
        }
        const rest = this._def.rest;
        if (!rest && ctx.data.length > this._def.items.length) {
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.too_big,
                maximum: this._def.items.length,
                inclusive: true,
                exact: false,
                type: "array",
            });
            status.dirty();
        }
        const items = [...ctx.data]
            .map((item, itemIndex) => {
            const schema = this._def.items[itemIndex] || this._def.rest;
            if (!schema)
                return null;
            return schema._parse(new ParseInputLazyPath(ctx, item, ctx.path, itemIndex));
        })
            .filter((x) => !!x); // filter nulls
        if (ctx.common.async) {
            return Promise.all(items).then((results) => {
                return parseUtil_js_1.ParseStatus.mergeArray(status, results);
            });
        }
        else {
            return parseUtil_js_1.ParseStatus.mergeArray(status, items);
        }
    }
    get items() {
        return this._def.items;
    }
    rest(rest) {
        return new ZodTuple({
            ...this._def,
            rest,
        });
    }
}
exports.ZodTuple = ZodTuple;
ZodTuple.create = (schemas, params) => {
    if (!Array.isArray(schemas)) {
        throw new Error("You must pass an array of schemas to z.tuple([ ... ])");
    }
    return new ZodTuple({
        items: schemas,
        typeName: ZodFirstPartyTypeKind.ZodTuple,
        rest: null,
        ...processCreateParams(params),
    });
};
class ZodRecord extends ZodType {
    get keySchema() {
        return this._def.keyType;
    }
    get valueSchema() {
        return this._def.valueType;
    }
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== util_js_1.ZodParsedType.object) {
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_type,
                expected: util_js_1.ZodParsedType.object,
                received: ctx.parsedType,
            });
            return parseUtil_js_1.INVALID;
        }
        const pairs = [];
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        for (const key in ctx.data) {
            pairs.push({
                key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, key)),
                value: valueType._parse(new ParseInputLazyPath(ctx, ctx.data[key], ctx.path, key)),
                alwaysSet: key in ctx.data,
            });
        }
        if (ctx.common.async) {
            return parseUtil_js_1.ParseStatus.mergeObjectAsync(status, pairs);
        }
        else {
            return parseUtil_js_1.ParseStatus.mergeObjectSync(status, pairs);
        }
    }
    get element() {
        return this._def.valueType;
    }
    static create(first, second, third) {
        if (second instanceof ZodType) {
            return new ZodRecord({
                keyType: first,
                valueType: second,
                typeName: ZodFirstPartyTypeKind.ZodRecord,
                ...processCreateParams(third),
            });
        }
        return new ZodRecord({
            keyType: ZodString.create(),
            valueType: first,
            typeName: ZodFirstPartyTypeKind.ZodRecord,
            ...processCreateParams(second),
        });
    }
}
exports.ZodRecord = ZodRecord;
class ZodMap extends ZodType {
    get keySchema() {
        return this._def.keyType;
    }
    get valueSchema() {
        return this._def.valueType;
    }
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== util_js_1.ZodParsedType.map) {
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_type,
                expected: util_js_1.ZodParsedType.map,
                received: ctx.parsedType,
            });
            return parseUtil_js_1.INVALID;
        }
        const keyType = this._def.keyType;
        const valueType = this._def.valueType;
        const pairs = [...ctx.data.entries()].map(([key, value], index) => {
            return {
                key: keyType._parse(new ParseInputLazyPath(ctx, key, ctx.path, [index, "key"])),
                value: valueType._parse(new ParseInputLazyPath(ctx, value, ctx.path, [index, "value"])),
            };
        });
        if (ctx.common.async) {
            const finalMap = new Map();
            return Promise.resolve().then(async () => {
                for (const pair of pairs) {
                    const key = await pair.key;
                    const value = await pair.value;
                    if (key.status === "aborted" || value.status === "aborted") {
                        return parseUtil_js_1.INVALID;
                    }
                    if (key.status === "dirty" || value.status === "dirty") {
                        status.dirty();
                    }
                    finalMap.set(key.value, value.value);
                }
                return { status: status.value, value: finalMap };
            });
        }
        else {
            const finalMap = new Map();
            for (const pair of pairs) {
                const key = pair.key;
                const value = pair.value;
                if (key.status === "aborted" || value.status === "aborted") {
                    return parseUtil_js_1.INVALID;
                }
                if (key.status === "dirty" || value.status === "dirty") {
                    status.dirty();
                }
                finalMap.set(key.value, value.value);
            }
            return { status: status.value, value: finalMap };
        }
    }
}
exports.ZodMap = ZodMap;
ZodMap.create = (keyType, valueType, params) => {
    return new ZodMap({
        valueType,
        keyType,
        typeName: ZodFirstPartyTypeKind.ZodMap,
        ...processCreateParams(params),
    });
};
class ZodSet extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.parsedType !== util_js_1.ZodParsedType.set) {
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_type,
                expected: util_js_1.ZodParsedType.set,
                received: ctx.parsedType,
            });
            return parseUtil_js_1.INVALID;
        }
        const def = this._def;
        if (def.minSize !== null) {
            if (ctx.data.size < def.minSize.value) {
                (0, parseUtil_js_1.addIssueToContext)(ctx, {
                    code: ZodError_js_1.ZodIssueCode.too_small,
                    minimum: def.minSize.value,
                    type: "set",
                    inclusive: true,
                    exact: false,
                    message: def.minSize.message,
                });
                status.dirty();
            }
        }
        if (def.maxSize !== null) {
            if (ctx.data.size > def.maxSize.value) {
                (0, parseUtil_js_1.addIssueToContext)(ctx, {
                    code: ZodError_js_1.ZodIssueCode.too_big,
                    maximum: def.maxSize.value,
                    type: "set",
                    inclusive: true,
                    exact: false,
                    message: def.maxSize.message,
                });
                status.dirty();
            }
        }
        const valueType = this._def.valueType;
        function finalizeSet(elements) {
            const parsedSet = new Set();
            for (const element of elements) {
                if (element.status === "aborted")
                    return parseUtil_js_1.INVALID;
                if (element.status === "dirty")
                    status.dirty();
                parsedSet.add(element.value);
            }
            return { status: status.value, value: parsedSet };
        }
        const elements = [...ctx.data.values()].map((item, i) => valueType._parse(new ParseInputLazyPath(ctx, item, ctx.path, i)));
        if (ctx.common.async) {
            return Promise.all(elements).then((elements) => finalizeSet(elements));
        }
        else {
            return finalizeSet(elements);
        }
    }
    min(minSize, message) {
        return new ZodSet({
            ...this._def,
            minSize: { value: minSize, message: errorUtil_js_1.errorUtil.toString(message) },
        });
    }
    max(maxSize, message) {
        return new ZodSet({
            ...this._def,
            maxSize: { value: maxSize, message: errorUtil_js_1.errorUtil.toString(message) },
        });
    }
    size(size, message) {
        return this.min(size, message).max(size, message);
    }
    nonempty(message) {
        return this.min(1, message);
    }
}
exports.ZodSet = ZodSet;
ZodSet.create = (valueType, params) => {
    return new ZodSet({
        valueType,
        minSize: null,
        maxSize: null,
        typeName: ZodFirstPartyTypeKind.ZodSet,
        ...processCreateParams(params),
    });
};
class ZodFunction extends ZodType {
    constructor() {
        super(...arguments);
        this.validate = this.implement;
    }
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== util_js_1.ZodParsedType.function) {
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_type,
                expected: util_js_1.ZodParsedType.function,
                received: ctx.parsedType,
            });
            return parseUtil_js_1.INVALID;
        }
        function makeArgsIssue(args, error) {
            return (0, parseUtil_js_1.makeIssue)({
                data: args,
                path: ctx.path,
                errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, (0, errors_js_1.getErrorMap)(), errors_js_1.defaultErrorMap].filter((x) => !!x),
                issueData: {
                    code: ZodError_js_1.ZodIssueCode.invalid_arguments,
                    argumentsError: error,
                },
            });
        }
        function makeReturnsIssue(returns, error) {
            return (0, parseUtil_js_1.makeIssue)({
                data: returns,
                path: ctx.path,
                errorMaps: [ctx.common.contextualErrorMap, ctx.schemaErrorMap, (0, errors_js_1.getErrorMap)(), errors_js_1.defaultErrorMap].filter((x) => !!x),
                issueData: {
                    code: ZodError_js_1.ZodIssueCode.invalid_return_type,
                    returnTypeError: error,
                },
            });
        }
        const params = { errorMap: ctx.common.contextualErrorMap };
        const fn = ctx.data;
        if (this._def.returns instanceof ZodPromise) {
            // Would love a way to avoid disabling this rule, but we need
            // an alias (using an arrow function was what caused 2651).
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const me = this;
            return (0, parseUtil_js_1.OK)(async function (...args) {
                const error = new ZodError_js_1.ZodError([]);
                const parsedArgs = await me._def.args.parseAsync(args, params).catch((e) => {
                    error.addIssue(makeArgsIssue(args, e));
                    throw error;
                });
                const result = await Reflect.apply(fn, this, parsedArgs);
                const parsedReturns = await me._def.returns._def.type
                    .parseAsync(result, params)
                    .catch((e) => {
                    error.addIssue(makeReturnsIssue(result, e));
                    throw error;
                });
                return parsedReturns;
            });
        }
        else {
            // Would love a way to avoid disabling this rule, but we need
            // an alias (using an arrow function was what caused 2651).
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const me = this;
            return (0, parseUtil_js_1.OK)(function (...args) {
                const parsedArgs = me._def.args.safeParse(args, params);
                if (!parsedArgs.success) {
                    throw new ZodError_js_1.ZodError([makeArgsIssue(args, parsedArgs.error)]);
                }
                const result = Reflect.apply(fn, this, parsedArgs.data);
                const parsedReturns = me._def.returns.safeParse(result, params);
                if (!parsedReturns.success) {
                    throw new ZodError_js_1.ZodError([makeReturnsIssue(result, parsedReturns.error)]);
                }
                return parsedReturns.data;
            });
        }
    }
    parameters() {
        return this._def.args;
    }
    returnType() {
        return this._def.returns;
    }
    args(...items) {
        return new ZodFunction({
            ...this._def,
            args: ZodTuple.create(items).rest(ZodUnknown.create()),
        });
    }
    returns(returnType) {
        return new ZodFunction({
            ...this._def,
            returns: returnType,
        });
    }
    implement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
    }
    strictImplement(func) {
        const validatedFunc = this.parse(func);
        return validatedFunc;
    }
    static create(args, returns, params) {
        return new ZodFunction({
            args: (args ? args : ZodTuple.create([]).rest(ZodUnknown.create())),
            returns: returns || ZodUnknown.create(),
            typeName: ZodFirstPartyTypeKind.ZodFunction,
            ...processCreateParams(params),
        });
    }
}
exports.ZodFunction = ZodFunction;
class ZodLazy extends ZodType {
    get schema() {
        return this._def.getter();
    }
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        const lazySchema = this._def.getter();
        return lazySchema._parse({ data: ctx.data, path: ctx.path, parent: ctx });
    }
}
exports.ZodLazy = ZodLazy;
ZodLazy.create = (getter, params) => {
    return new ZodLazy({
        getter: getter,
        typeName: ZodFirstPartyTypeKind.ZodLazy,
        ...processCreateParams(params),
    });
};
class ZodLiteral extends ZodType {
    _parse(input) {
        if (input.data !== this._def.value) {
            const ctx = this._getOrReturnCtx(input);
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                received: ctx.data,
                code: ZodError_js_1.ZodIssueCode.invalid_literal,
                expected: this._def.value,
            });
            return parseUtil_js_1.INVALID;
        }
        return { status: "valid", value: input.data };
    }
    get value() {
        return this._def.value;
    }
}
exports.ZodLiteral = ZodLiteral;
ZodLiteral.create = (value, params) => {
    return new ZodLiteral({
        value: value,
        typeName: ZodFirstPartyTypeKind.ZodLiteral,
        ...processCreateParams(params),
    });
};
function createZodEnum(values, params) {
    return new ZodEnum({
        values,
        typeName: ZodFirstPartyTypeKind.ZodEnum,
        ...processCreateParams(params),
    });
}
class ZodEnum extends ZodType {
    _parse(input) {
        if (typeof input.data !== "string") {
            const ctx = this._getOrReturnCtx(input);
            const expectedValues = this._def.values;
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                expected: util_js_1.util.joinValues(expectedValues),
                received: ctx.parsedType,
                code: ZodError_js_1.ZodIssueCode.invalid_type,
            });
            return parseUtil_js_1.INVALID;
        }
        if (!this._cache) {
            this._cache = new Set(this._def.values);
        }
        if (!this._cache.has(input.data)) {
            const ctx = this._getOrReturnCtx(input);
            const expectedValues = this._def.values;
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                received: ctx.data,
                code: ZodError_js_1.ZodIssueCode.invalid_enum_value,
                options: expectedValues,
            });
            return parseUtil_js_1.INVALID;
        }
        return (0, parseUtil_js_1.OK)(input.data);
    }
    get options() {
        return this._def.values;
    }
    get enum() {
        const enumValues = {};
        for (const val of this._def.values) {
            enumValues[val] = val;
        }
        return enumValues;
    }
    get Values() {
        const enumValues = {};
        for (const val of this._def.values) {
            enumValues[val] = val;
        }
        return enumValues;
    }
    get Enum() {
        const enumValues = {};
        for (const val of this._def.values) {
            enumValues[val] = val;
        }
        return enumValues;
    }
    extract(values, newDef = this._def) {
        return ZodEnum.create(values, {
            ...this._def,
            ...newDef,
        });
    }
    exclude(values, newDef = this._def) {
        return ZodEnum.create(this.options.filter((opt) => !values.includes(opt)), {
            ...this._def,
            ...newDef,
        });
    }
}
exports.ZodEnum = ZodEnum;
ZodEnum.create = createZodEnum;
class ZodNativeEnum extends ZodType {
    _parse(input) {
        const nativeEnumValues = util_js_1.util.getValidEnumValues(this._def.values);
        const ctx = this._getOrReturnCtx(input);
        if (ctx.parsedType !== util_js_1.ZodParsedType.string && ctx.parsedType !== util_js_1.ZodParsedType.number) {
            const expectedValues = util_js_1.util.objectValues(nativeEnumValues);
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                expected: util_js_1.util.joinValues(expectedValues),
                received: ctx.parsedType,
                code: ZodError_js_1.ZodIssueCode.invalid_type,
            });
            return parseUtil_js_1.INVALID;
        }
        if (!this._cache) {
            this._cache = new Set(util_js_1.util.getValidEnumValues(this._def.values));
        }
        if (!this._cache.has(input.data)) {
            const expectedValues = util_js_1.util.objectValues(nativeEnumValues);
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                received: ctx.data,
                code: ZodError_js_1.ZodIssueCode.invalid_enum_value,
                options: expectedValues,
            });
            return parseUtil_js_1.INVALID;
        }
        return (0, parseUtil_js_1.OK)(input.data);
    }
    get enum() {
        return this._def.values;
    }
}
exports.ZodNativeEnum = ZodNativeEnum;
ZodNativeEnum.create = (values, params) => {
    return new ZodNativeEnum({
        values: values,
        typeName: ZodFirstPartyTypeKind.ZodNativeEnum,
        ...processCreateParams(params),
    });
};
class ZodPromise extends ZodType {
    unwrap() {
        return this._def.type;
    }
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        if (ctx.parsedType !== util_js_1.ZodParsedType.promise && ctx.common.async === false) {
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_type,
                expected: util_js_1.ZodParsedType.promise,
                received: ctx.parsedType,
            });
            return parseUtil_js_1.INVALID;
        }
        const promisified = ctx.parsedType === util_js_1.ZodParsedType.promise ? ctx.data : Promise.resolve(ctx.data);
        return (0, parseUtil_js_1.OK)(promisified.then((data) => {
            return this._def.type.parseAsync(data, {
                path: ctx.path,
                errorMap: ctx.common.contextualErrorMap,
            });
        }));
    }
}
exports.ZodPromise = ZodPromise;
ZodPromise.create = (schema, params) => {
    return new ZodPromise({
        type: schema,
        typeName: ZodFirstPartyTypeKind.ZodPromise,
        ...processCreateParams(params),
    });
};
class ZodEffects extends ZodType {
    innerType() {
        return this._def.schema;
    }
    sourceType() {
        return this._def.schema._def.typeName === ZodFirstPartyTypeKind.ZodEffects
            ? this._def.schema.sourceType()
            : this._def.schema;
    }
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        const effect = this._def.effect || null;
        const checkCtx = {
            addIssue: (arg) => {
                (0, parseUtil_js_1.addIssueToContext)(ctx, arg);
                if (arg.fatal) {
                    status.abort();
                }
                else {
                    status.dirty();
                }
            },
            get path() {
                return ctx.path;
            },
        };
        checkCtx.addIssue = checkCtx.addIssue.bind(checkCtx);
        if (effect.type === "preprocess") {
            const processed = effect.transform(ctx.data, checkCtx);
            if (ctx.common.async) {
                return Promise.resolve(processed).then(async (processed) => {
                    if (status.value === "aborted")
                        return parseUtil_js_1.INVALID;
                    const result = await this._def.schema._parseAsync({
                        data: processed,
                        path: ctx.path,
                        parent: ctx,
                    });
                    if (result.status === "aborted")
                        return parseUtil_js_1.INVALID;
                    if (result.status === "dirty")
                        return (0, parseUtil_js_1.DIRTY)(result.value);
                    if (status.value === "dirty")
                        return (0, parseUtil_js_1.DIRTY)(result.value);
                    return result;
                });
            }
            else {
                if (status.value === "aborted")
                    return parseUtil_js_1.INVALID;
                const result = this._def.schema._parseSync({
                    data: processed,
                    path: ctx.path,
                    parent: ctx,
                });
                if (result.status === "aborted")
                    return parseUtil_js_1.INVALID;
                if (result.status === "dirty")
                    return (0, parseUtil_js_1.DIRTY)(result.value);
                if (status.value === "dirty")
                    return (0, parseUtil_js_1.DIRTY)(result.value);
                return result;
            }
        }
        if (effect.type === "refinement") {
            const executeRefinement = (acc) => {
                const result = effect.refinement(acc, checkCtx);
                if (ctx.common.async) {
                    return Promise.resolve(result);
                }
                if (result instanceof Promise) {
                    throw new Error("Async refinement encountered during synchronous parse operation. Use .parseAsync instead.");
                }
                return acc;
            };
            if (ctx.common.async === false) {
                const inner = this._def.schema._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                });
                if (inner.status === "aborted")
                    return parseUtil_js_1.INVALID;
                if (inner.status === "dirty")
                    status.dirty();
                // return value is ignored
                executeRefinement(inner.value);
                return { status: status.value, value: inner.value };
            }
            else {
                return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((inner) => {
                    if (inner.status === "aborted")
                        return parseUtil_js_1.INVALID;
                    if (inner.status === "dirty")
                        status.dirty();
                    return executeRefinement(inner.value).then(() => {
                        return { status: status.value, value: inner.value };
                    });
                });
            }
        }
        if (effect.type === "transform") {
            if (ctx.common.async === false) {
                const base = this._def.schema._parseSync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                });
                if (!(0, parseUtil_js_1.isValid)(base))
                    return parseUtil_js_1.INVALID;
                const result = effect.transform(base.value, checkCtx);
                if (result instanceof Promise) {
                    throw new Error(`Asynchronous transform encountered during synchronous parse operation. Use .parseAsync instead.`);
                }
                return { status: status.value, value: result };
            }
            else {
                return this._def.schema._parseAsync({ data: ctx.data, path: ctx.path, parent: ctx }).then((base) => {
                    if (!(0, parseUtil_js_1.isValid)(base))
                        return parseUtil_js_1.INVALID;
                    return Promise.resolve(effect.transform(base.value, checkCtx)).then((result) => ({
                        status: status.value,
                        value: result,
                    }));
                });
            }
        }
        util_js_1.util.assertNever(effect);
    }
}
exports.ZodEffects = ZodEffects;
exports.ZodTransformer = ZodEffects;
ZodEffects.create = (schema, effect, params) => {
    return new ZodEffects({
        schema,
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        effect,
        ...processCreateParams(params),
    });
};
ZodEffects.createWithPreprocess = (preprocess, schema, params) => {
    return new ZodEffects({
        schema,
        effect: { type: "preprocess", transform: preprocess },
        typeName: ZodFirstPartyTypeKind.ZodEffects,
        ...processCreateParams(params),
    });
};
class ZodOptional extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === util_js_1.ZodParsedType.undefined) {
            return (0, parseUtil_js_1.OK)(undefined);
        }
        return this._def.innerType._parse(input);
    }
    unwrap() {
        return this._def.innerType;
    }
}
exports.ZodOptional = ZodOptional;
ZodOptional.create = (type, params) => {
    return new ZodOptional({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodOptional,
        ...processCreateParams(params),
    });
};
class ZodNullable extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType === util_js_1.ZodParsedType.null) {
            return (0, parseUtil_js_1.OK)(null);
        }
        return this._def.innerType._parse(input);
    }
    unwrap() {
        return this._def.innerType;
    }
}
exports.ZodNullable = ZodNullable;
ZodNullable.create = (type, params) => {
    return new ZodNullable({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodNullable,
        ...processCreateParams(params),
    });
};
class ZodDefault extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        let data = ctx.data;
        if (ctx.parsedType === util_js_1.ZodParsedType.undefined) {
            data = this._def.defaultValue();
        }
        return this._def.innerType._parse({
            data,
            path: ctx.path,
            parent: ctx,
        });
    }
    removeDefault() {
        return this._def.innerType;
    }
}
exports.ZodDefault = ZodDefault;
ZodDefault.create = (type, params) => {
    return new ZodDefault({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodDefault,
        defaultValue: typeof params.default === "function" ? params.default : () => params.default,
        ...processCreateParams(params),
    });
};
class ZodCatch extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        // newCtx is used to not collect issues from inner types in ctx
        const newCtx = {
            ...ctx,
            common: {
                ...ctx.common,
                issues: [],
            },
        };
        const result = this._def.innerType._parse({
            data: newCtx.data,
            path: newCtx.path,
            parent: {
                ...newCtx,
            },
        });
        if ((0, parseUtil_js_1.isAsync)(result)) {
            return result.then((result) => {
                return {
                    status: "valid",
                    value: result.status === "valid"
                        ? result.value
                        : this._def.catchValue({
                            get error() {
                                return new ZodError_js_1.ZodError(newCtx.common.issues);
                            },
                            input: newCtx.data,
                        }),
                };
            });
        }
        else {
            return {
                status: "valid",
                value: result.status === "valid"
                    ? result.value
                    : this._def.catchValue({
                        get error() {
                            return new ZodError_js_1.ZodError(newCtx.common.issues);
                        },
                        input: newCtx.data,
                    }),
            };
        }
    }
    removeCatch() {
        return this._def.innerType;
    }
}
exports.ZodCatch = ZodCatch;
ZodCatch.create = (type, params) => {
    return new ZodCatch({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodCatch,
        catchValue: typeof params.catch === "function" ? params.catch : () => params.catch,
        ...processCreateParams(params),
    });
};
class ZodNaN extends ZodType {
    _parse(input) {
        const parsedType = this._getType(input);
        if (parsedType !== util_js_1.ZodParsedType.nan) {
            const ctx = this._getOrReturnCtx(input);
            (0, parseUtil_js_1.addIssueToContext)(ctx, {
                code: ZodError_js_1.ZodIssueCode.invalid_type,
                expected: util_js_1.ZodParsedType.nan,
                received: ctx.parsedType,
            });
            return parseUtil_js_1.INVALID;
        }
        return { status: "valid", value: input.data };
    }
}
exports.ZodNaN = ZodNaN;
ZodNaN.create = (params) => {
    return new ZodNaN({
        typeName: ZodFirstPartyTypeKind.ZodNaN,
        ...processCreateParams(params),
    });
};
exports.BRAND = Symbol("zod_brand");
class ZodBranded extends ZodType {
    _parse(input) {
        const { ctx } = this._processInputParams(input);
        const data = ctx.data;
        return this._def.type._parse({
            data,
            path: ctx.path,
            parent: ctx,
        });
    }
    unwrap() {
        return this._def.type;
    }
}
exports.ZodBranded = ZodBranded;
class ZodPipeline extends ZodType {
    _parse(input) {
        const { status, ctx } = this._processInputParams(input);
        if (ctx.common.async) {
            const handleAsync = async () => {
                const inResult = await this._def.in._parseAsync({
                    data: ctx.data,
                    path: ctx.path,
                    parent: ctx,
                });
                if (inResult.status === "aborted")
                    return parseUtil_js_1.INVALID;
                if (inResult.status === "dirty") {
                    status.dirty();
                    return (0, parseUtil_js_1.DIRTY)(inResult.value);
                }
                else {
                    return this._def.out._parseAsync({
                        data: inResult.value,
                        path: ctx.path,
                        parent: ctx,
                    });
                }
            };
            return handleAsync();
        }
        else {
            const inResult = this._def.in._parseSync({
                data: ctx.data,
                path: ctx.path,
                parent: ctx,
            });
            if (inResult.status === "aborted")
                return parseUtil_js_1.INVALID;
            if (inResult.status === "dirty") {
                status.dirty();
                return {
                    status: "dirty",
                    value: inResult.value,
                };
            }
            else {
                return this._def.out._parseSync({
                    data: inResult.value,
                    path: ctx.path,
                    parent: ctx,
                });
            }
        }
    }
    static create(a, b) {
        return new ZodPipeline({
            in: a,
            out: b,
            typeName: ZodFirstPartyTypeKind.ZodPipeline,
        });
    }
}
exports.ZodPipeline = ZodPipeline;
class ZodReadonly extends ZodType {
    _parse(input) {
        const result = this._def.innerType._parse(input);
        const freeze = (data) => {
            if ((0, parseUtil_js_1.isValid)(data)) {
                data.value = Object.freeze(data.value);
            }
            return data;
        };
        return (0, parseUtil_js_1.isAsync)(result) ? result.then((data) => freeze(data)) : freeze(result);
    }
    unwrap() {
        return this._def.innerType;
    }
}
exports.ZodReadonly = ZodReadonly;
ZodReadonly.create = (type, params) => {
    return new ZodReadonly({
        innerType: type,
        typeName: ZodFirstPartyTypeKind.ZodReadonly,
        ...processCreateParams(params),
    });
};
////////////////////////////////////////
////////////////////////////////////////
//////////                    //////////
//////////      z.custom      //////////
//////////                    //////////
////////////////////////////////////////
////////////////////////////////////////
function cleanParams(params, data) {
    const p = typeof params === "function" ? params(data) : typeof params === "string" ? { message: params } : params;
    const p2 = typeof p === "string" ? { message: p } : p;
    return p2;
}
function custom(check, _params = {}, 
/**
 * @deprecated
 *
 * Pass `fatal` into the params object instead:
 *
 * ```ts
 * z.string().custom((val) => val.length > 5, { fatal: false })
 * ```
 *
 */
fatal) {
    if (check)
        return ZodAny.create().superRefine((data, ctx) => {
            const r = check(data);
            if (r instanceof Promise) {
                return r.then((r) => {
                    if (!r) {
                        const params = cleanParams(_params, data);
                        const _fatal = params.fatal ?? fatal ?? true;
                        ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
                    }
                });
            }
            if (!r) {
                const params = cleanParams(_params, data);
                const _fatal = params.fatal ?? fatal ?? true;
                ctx.addIssue({ code: "custom", ...params, fatal: _fatal });
            }
            return;
        });
    return ZodAny.create();
}
exports.late = {
    object: ZodObject.lazycreate,
};
var ZodFirstPartyTypeKind;
(function (ZodFirstPartyTypeKind) {
    ZodFirstPartyTypeKind["ZodString"] = "ZodString";
    ZodFirstPartyTypeKind["ZodNumber"] = "ZodNumber";
    ZodFirstPartyTypeKind["ZodNaN"] = "ZodNaN";
    ZodFirstPartyTypeKind["ZodBigInt"] = "ZodBigInt";
    ZodFirstPartyTypeKind["ZodBoolean"] = "ZodBoolean";
    ZodFirstPartyTypeKind["ZodDate"] = "ZodDate";
    ZodFirstPartyTypeKind["ZodSymbol"] = "ZodSymbol";
    ZodFirstPartyTypeKind["ZodUndefined"] = "ZodUndefined";
    ZodFirstPartyTypeKind["ZodNull"] = "ZodNull";
    ZodFirstPartyTypeKind["ZodAny"] = "ZodAny";
    ZodFirstPartyTypeKind["ZodUnknown"] = "ZodUnknown";
    ZodFirstPartyTypeKind["ZodNever"] = "ZodNever";
    ZodFirstPartyTypeKind["ZodVoid"] = "ZodVoid";
    ZodFirstPartyTypeKind["ZodArray"] = "ZodArray";
    ZodFirstPartyTypeKind["ZodObject"] = "ZodObject";
    ZodFirstPartyTypeKind["ZodUnion"] = "ZodUnion";
    ZodFirstPartyTypeKind["ZodDiscriminatedUnion"] = "ZodDiscriminatedUnion";
    ZodFirstPartyTypeKind["ZodIntersection"] = "ZodIntersection";
    ZodFirstPartyTypeKind["ZodTuple"] = "ZodTuple";
    ZodFirstPartyTypeKind["ZodRecord"] = "ZodRecord";
    ZodFirstPartyTypeKind["ZodMap"] = "ZodMap";
    ZodFirstPartyTypeKind["ZodSet"] = "ZodSet";
    ZodFirstPartyTypeKind["ZodFunction"] = "ZodFunction";
    ZodFirstPartyTypeKind["ZodLazy"] = "ZodLazy";
    ZodFirstPartyTypeKind["ZodLiteral"] = "ZodLiteral";
    ZodFirstPartyTypeKind["ZodEnum"] = "ZodEnum";
    ZodFirstPartyTypeKind["ZodEffects"] = "ZodEffects";
    ZodFirstPartyTypeKind["ZodNativeEnum"] = "ZodNativeEnum";
    ZodFirstPartyTypeKind["ZodOptional"] = "ZodOptional";
    ZodFirstPartyTypeKind["ZodNullable"] = "ZodNullable";
    ZodFirstPartyTypeKind["ZodDefault"] = "ZodDefault";
    ZodFirstPartyTypeKind["ZodCatch"] = "ZodCatch";
    ZodFirstPartyTypeKind["ZodPromise"] = "ZodPromise";
    ZodFirstPartyTypeKind["ZodBranded"] = "ZodBranded";
    ZodFirstPartyTypeKind["ZodPipeline"] = "ZodPipeline";
    ZodFirstPartyTypeKind["ZodReadonly"] = "ZodReadonly";
})(ZodFirstPartyTypeKind || (exports.ZodFirstPartyTypeKind = ZodFirstPartyTypeKind = {}));
// requires TS 4.4+
class Class {
    constructor(..._) { }
}
const instanceOfType = (
// const instanceOfType = <T extends new (...args: any[]) => any>(
cls, params = {
    message: `Input not instance of ${cls.name}`,
}) => custom((data) => data instanceof cls, params);
exports["instanceof"] = instanceOfType;
const stringType = ZodString.create;
exports.string = stringType;
const numberType = ZodNumber.create;
exports.number = numberType;
const nanType = ZodNaN.create;
exports.nan = nanType;
const bigIntType = ZodBigInt.create;
exports.bigint = bigIntType;
const booleanType = ZodBoolean.create;
exports.boolean = booleanType;
const dateType = ZodDate.create;
exports.date = dateType;
const symbolType = ZodSymbol.create;
exports.symbol = symbolType;
const undefinedType = ZodUndefined.create;
exports.undefined = undefinedType;
const nullType = ZodNull.create;
exports["null"] = nullType;
const anyType = ZodAny.create;
exports.any = anyType;
const unknownType = ZodUnknown.create;
exports.unknown = unknownType;
const neverType = ZodNever.create;
exports.never = neverType;
const voidType = ZodVoid.create;
exports["void"] = voidType;
const arrayType = ZodArray.create;
exports.array = arrayType;
const objectType = ZodObject.create;
exports.object = objectType;
const strictObjectType = ZodObject.strictCreate;
exports.strictObject = strictObjectType;
const unionType = ZodUnion.create;
exports.union = unionType;
const discriminatedUnionType = ZodDiscriminatedUnion.create;
exports.discriminatedUnion = discriminatedUnionType;
const intersectionType = ZodIntersection.create;
exports.intersection = intersectionType;
const tupleType = ZodTuple.create;
exports.tuple = tupleType;
const recordType = ZodRecord.create;
exports.record = recordType;
const mapType = ZodMap.create;
exports.map = mapType;
const setType = ZodSet.create;
exports.set = setType;
const functionType = ZodFunction.create;
exports["function"] = functionType;
const lazyType = ZodLazy.create;
exports.lazy = lazyType;
const literalType = ZodLiteral.create;
exports.literal = literalType;
const enumType = ZodEnum.create;
exports["enum"] = enumType;
const nativeEnumType = ZodNativeEnum.create;
exports.nativeEnum = nativeEnumType;
const promiseType = ZodPromise.create;
exports.promise = promiseType;
const effectsType = ZodEffects.create;
exports.effect = effectsType;
exports.transformer = effectsType;
const optionalType = ZodOptional.create;
exports.optional = optionalType;
const nullableType = ZodNullable.create;
exports.nullable = nullableType;
const preprocessType = ZodEffects.createWithPreprocess;
exports.preprocess = preprocessType;
const pipelineType = ZodPipeline.create;
exports.pipeline = pipelineType;
const ostring = () => stringType().optional();
exports.ostring = ostring;
const onumber = () => numberType().optional();
exports.onumber = onumber;
const oboolean = () => booleanType().optional();
exports.oboolean = oboolean;
exports.coerce = {
    string: ((arg) => ZodString.create({ ...arg, coerce: true })),
    number: ((arg) => ZodNumber.create({ ...arg, coerce: true })),
    boolean: ((arg) => ZodBoolean.create({
        ...arg,
        coerce: true,
    })),
    bigint: ((arg) => ZodBigInt.create({ ...arg, coerce: true })),
    date: ((arg) => ZodDate.create({ ...arg, coerce: true })),
};
exports.NEVER = parseUtil_js_1.INVALID;


/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	const __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		const cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		const module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		if (!(moduleId in __webpack_modules__)) {
/******/ 			delete __webpack_module_cache__[moduleId];
/******/ 			const e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		__webpack_modules__[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/************************************************************************/
let __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be in strict mode.
(() => {
"use strict";
let exports = __webpack_exports__;
/*!********************************!*\
  !*** ./electron-main/index.ts ***!
  \********************************/

/**
 * electron-main/index.ts
 * Electron app entry point
 * Dependencies: all electron-main modules
 */
Object.defineProperty(exports, "__esModule", ({ value: true }));
const electron_1 = __webpack_require__(/*! electron */ "electron");
const dotenv_1 = __webpack_require__(/*! dotenv */ "./node_modules/dotenv/lib/main.js");
const db_1 = __webpack_require__(/*! ./db */ "./electron-main/db.ts");
const window_manager_1 = __webpack_require__(/*! ./window-manager */ "./electron-main/window-manager.ts");
const cdp_bridge_1 = __webpack_require__(/*! ./cdp-bridge */ "./electron-main/cdp-bridge.ts");
const ipc_handlers_1 = __webpack_require__(/*! ./ipc-handlers */ "./electron-main/ipc-handlers.ts");
const global_shortcuts_1 = __webpack_require__(/*! ./global-shortcuts */ "./electron-main/global-shortcuts.ts");
const semantic_model_builder_1 = __webpack_require__(/*! ../semantic-parser/semantic-model-builder */ "./semantic-parser/semantic-model-builder.ts");
const constants_1 = __webpack_require__(/*! ../shared/constants */ "./shared/constants.ts");
// Load environment variables
(0, dotenv_1.config)();
let mainWindow = null;
/**
 * App initialization
 */
electron_1.app.whenReady().then(async () => {
    try {
        console.log('[App] Initializing...');
        // Initialize database
        await (0, db_1.initDB)();
        // Create main window & web content view
        mainWindow = await (0, window_manager_1.createMainWindow)();
        const contentView = (0, window_manager_1.getWebContentView)();
        if (!contentView) {
            throw new Error('Failed to create web content view');
        }
        // Attach CDP session to web content view
        const session = await (0, cdp_bridge_1.attachCDP)(contentView);
        // Register IPC handlers & global shortcuts on main window
        (0, ipc_handlers_1.registerIPCHandlers)(mainWindow, session);
        (0, global_shortcuts_1.registerGlobalShortcuts)(mainWindow);
        // Function to parse page and send model to React UI
        const updateSemanticModel = async () => {
            try {
                const url = contentView.webContents.getURL();
                if (!url || url === 'about:blank')
                    return;
                console.log('[App] Extracting semantic model for:', url);
                const model = await (0, semantic_model_builder_1.buildSemanticModel)(session, url);
                // @ts-ignore
                mainWindow?.webContents.send(constants_1.CHANNELS.PAGE_SUBSCRIBE_UPDATES, model);
            }
            catch (err) {
                console.error('[App] Failed to extract semantic model:', err);
            }
        };
        // Attach load/navigate listeners on web content view
        contentView.webContents.on('did-finish-load', updateSemanticModel);
        contentView.webContents.on('did-navigate', updateSemanticModel);
        // Initial parse after 1 second delay to ensure DOM is ready
        setTimeout(updateSemanticModel, 1000);
        console.log('[App] Initialization complete');
    }
    catch (err) {
        console.error('[App] Initialization failed:', err);
        electron_1.app.quit();
    }
});
/**
 * Handle window close
 */
electron_1.app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
/**
 * Handle app quit
 */
electron_1.app.on('will-quit', () => {
    (0, global_shortcuts_1.unregisterAll)();
    (0, db_1.closeDB)();
});
/**
 * macOS: recreate window when dock icon clicked
 */
electron_1.app.on('activate', () => {
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        (0, window_manager_1.createMainWindow)();
    }
});

})();

module.exports = __webpack_exports__;
/******/ })()
;
//# sourceMappingURL=index.js.map