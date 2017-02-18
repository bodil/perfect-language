/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;
/******/
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "dist/pink/";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";
	
	var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol ? "symbol" : typeof obj; };
	
	var _repr = __webpack_require__(1);
	
	var _repr2 = _interopRequireDefault(_repr);
	
	function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
	
	var window = {
	  addEventListener: function addEventListener() {
	    console.log("something called window.addEventListener");
	  }
	};
	
	function repr(v) {
	  if ((typeof v === "undefined" ? "undefined" : _typeof(v)) === "symbol") {
	    return v.toString();
	  }
	  return _repr2.default.repr(v);
	}
	
	var lib = {};
	var state = {};
	
	onmessage = function onmessage(e) {
	  var _e$data = e.data;
	  var data = _e$data.load;
	  var output = _e$data.output;
	  var stdlib = _e$data.stdlib;
	
	  try {
	    var thunk = eval(data);
	    if (stdlib) {
	      lib = thunk();
	      return;
	    }
	    if (typeof thunk === "function") {
	      thunk(state, lib);
	      if (output) {
	        postMessage(["result", repr(state.exports.replOut)]);
	      }
	    }
	  } catch (e) {
	    console.error(e);
	    postMessage(["error", e.name + ": " + e.message]);
	  }
	};

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	(function() {
		var global = this;
		var root;
		if(false) {
			root = global.Repr = {};
		} else {
			root = exports;
		}
		var originalToString = Object.toString;
		var getProto = null;
		var getName = null;
	
		if(Object.hasOwnProperty('getPrototypeOf')) {
			getProto = function(o) { try {
				return Object.getPrototypeOf(o);
			} catch(e) { return undefined; }
			}
		} else if(Object.hasOwnProperty('__proto__')) {
			getProto = function(o) { return o.__proto__; }
		}
	
		root.getPrototypeOf = getProto;
		if(getProto !== null) {
			getName = function(o, def) {
				var p = getProto(o);
				if(p != undefined && p.hasOwnProperty('constructor') && p.constructor.hasOwnProperty('name')) {
					return p.constructor.name;
				}
				return def;
			};
	
			Object.prototype.toString = function() {
				var json = jsonifyPureObject(this);
				if(json != undefined) return json;
				var name = getName(this, null);
				if(name == null) {
					try {
						return originalToString.call(this);
					} catch(e) {
						// what the hell? I give up...
						return "[Object object]";
					}
				}
				return "<# object " + name + ">";
			}
		} else {
			getName = function(o, def) {
				return def;
			}
		};
	
		function jsonifyPureObject(obj, proto) {
			var proto = obj || getProto(obj);
			if(proto && proto.constructor === Object) {
				try {
					return JSON.stringify(obj);
				} catch(e) { /* ugh. */ }
			}
		}
	
		Object.prototype.repr = function() {
			var thisProto = getProto(this);
			if(thisProto === undefined) {
				return this.valueOf();
			}
			var json = jsonifyPureObject(this, thisProto);
			if(json != undefined) return json;
			var attrs = "";
			for(var k in this) {
				if(!this.hasOwnProperty(k)) continue;
				var val = this[k];
				var desc=root.str(val);
				if(attrs) {
					attrs += ", ";
				}
				attrs += k + ": " + desc;
			}
			if(attrs.length === 0) {
				return root.str(this);
			}
			return "<# " + getName(this, this.valueOf()) + "; " + attrs + ">";
		}
	
		Function.prototype.repr = function() { return this + ""; }
		var summarizeFunction = function(f) {
			var name;
			if(f.hasOwnProperty('name')) {
				name = f.name;
			}
			if(!name) {
				return "(anonymous function)";
			}
			return "(function " + name + ")";
		};
	
		root.str = function(o) {
			if(o === undefined) { return '(undefined)'; }
			if(o === null) { return '(null)'; }
			if(o instanceof Function) { return summarizeFunction(o); };
			if(o.toString !== undefined) {
				return o.toString()
			} else {
				return o;
			}
		};
	
		root.repr = function(o) {
			if(o instanceof String || typeof(o) == 'string') { // javascript makes me sad
				return '"' + o.replace(/\\/, '\\\\').replace(/"/, '\\"') + '"';
			}
			if(!(o instanceof Object)) {
				return o + '';
			}
			return o.repr();
		};
	
		var arrayToString = function(fn) {
			return function() {
				var elems = "";
				for(var i=0; i<this.length; i++) {
					if(elems) {
						elems += ", ";
					}
					elems += fn(this[i]);
				}
				return "[" + elems + "]";
			};
		};
		Array.prototype.toString = arrayToString(root.str);
		Array.prototype.repr = arrayToString(root.repr);
	
		root.install = function(g) {
			g.str = root.str;
			g.repr = root.repr;
		};
	
		root.install(global);
	
	})();


/***/ }
/******/ ]);
//# sourceMappingURL=a5412eb1cc8aa3a2b412.worker.js.map