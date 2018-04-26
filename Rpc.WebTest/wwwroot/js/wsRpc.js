/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
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
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./Scripts/WebSocketRpc.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./Scripts/Rpc.ts":
/*!************************!*\
  !*** ./Scripts/Rpc.ts ***!
  \************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Rpc = /** @class */ (function () {
    function Rpc(_sendHandler, _createKeyHandler) {
        this._sendHandler = _sendHandler;
        this._createKeyHandler = _createKeyHandler;
        this._methods = {};
        this._callbacks = {};
        if (!_sendHandler) {
            throw new Error('Send handler cannot be undefined or null.');
        }
        if (!_createKeyHandler) {
            throw new Error('Create key handler cannot be undefined or null.');
        }
    }
    Rpc.prototype.registerMethod = function (obj, methodName, method) {
        if (!method) {
            method = obj[methodName];
            if (!method || !(method instanceof Function)) {
                throw new Error("No method with name " + methodName + ".");
            }
        }
        this._methods[methodName.toLowerCase()] = { obj: obj, method: method };
    };
    Rpc.prototype.processRequestMessage = function (message) {
        var method = this._methods[message.methodName.toLowerCase()];
        if (!method) {
            this._sendHandler(this.createErrorResponse(message, "No method with name " + message.methodName + " found."));
        }
        try {
            var result = method.method.apply(method.obj, message.methodArguments);
            this._sendHandler(this.createSuccessfulResponse(message, result));
        }
        catch (err) {
            this._sendHandler(this.createErrorResponse(message, err));
        }
    };
    Rpc.prototype.call = function (methodName, args) {
        var _this = this;
        var call = this.createCall(methodName, args);
        return new Promise(function (resolve, reject) {
            _this._callbacks[call.id] = { resolve: resolve, reject: reject };
            _this._sendHandler(call);
        });
    };
    Rpc.prototype.processResponseMessage = function (message) {
        var callback = this._callbacks[message.id];
        if (!callback) {
            console.warn("No callback found with ID " + message.id + ".");
            return;
        }
        if (message.successful) {
            callback.resolve(message.response);
        }
        else {
            callback.reject(message.response);
        }
    };
    Rpc.prototype.createCall = function (methodName, args) {
        return {
            id: this._createKeyHandler(),
            methodName: methodName,
            methodArguments: args
        };
    };
    Rpc.prototype.createSuccessfulResponse = function (message, response) {
        return {
            id: message.id,
            response: response,
            successful: true
        };
    };
    Rpc.prototype.createErrorResponse = function (message, response) {
        return {
            id: message.id,
            response: response,
            successful: false
        };
    };
    return Rpc;
}());
exports.Rpc = Rpc;


/***/ }),

/***/ "./Scripts/WebSocketRpc.ts":
/*!*********************************!*\
  !*** ./Scripts/WebSocketRpc.ts ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";

Object.defineProperty(exports, "__esModule", { value: true });
var Rpc_1 = __webpack_require__(/*! ./Rpc */ "./Scripts/Rpc.ts");
var guid = __webpack_require__(/*! uuid/v4 */ "./node_modules/uuid/v4.js");
var WebSocketRpc = /** @class */ (function () {
    function WebSocketRpc(_url) {
        this._url = _url;
    }
    WebSocketRpc.prototype.start = function () {
        var _this = this;
        this._ws = new WebSocket(this._url);
        this._ws.onmessage = function (evt) {
            var fileReader = new FileReader();
            fileReader.addEventListener('loadend', function () {
                var message = JSON.parse(fileReader.result);
                _this.onReceive(message);
            });
            fileReader.readAsText(evt.data);
        };
        this._rpc = new Rpc_1.Rpc(function (m) { return _this.send(m); }, function () { return guid(); });
        this._rpc.registerMethod(this, 'getB', this.getB);
    };
    WebSocketRpc.prototype.send = function (data) {
        this._ws.send(JSON.stringify(data));
        return new Promise(function (resolve, _) { return resolve(); });
    };
    WebSocketRpc.prototype.onReceive = function (data) {
        if (data['response']) {
            this._rpc.processResponseMessage(data);
        }
        else {
            this._rpc.processRequestMessage(data);
        }
    };
    WebSocketRpc.prototype.call = function (methodName, args) {
        return this._rpc.call(methodName, args);
    };
    WebSocketRpc.prototype.getB = function () {
        return parseInt(document.getElementById('b-input').value);
    };
    return WebSocketRpc;
}());
exports.WebSocketRpc = WebSocketRpc;
window['WebSocketRpc'] = WebSocketRpc;


/***/ }),

/***/ "./node_modules/uuid/lib/bytesToUuid.js":
/*!**********************************************!*\
  !*** ./node_modules/uuid/lib/bytesToUuid.js ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

/**
 * Convert array of 16 byte values to UUID string format of the form:
 * XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
 */
var byteToHex = [];
for (var i = 0; i < 256; ++i) {
  byteToHex[i] = (i + 0x100).toString(16).substr(1);
}

function bytesToUuid(buf, offset) {
  var i = offset || 0;
  var bth = byteToHex;
  return bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] + '-' +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]] +
          bth[buf[i++]] + bth[buf[i++]];
}

module.exports = bytesToUuid;


/***/ }),

/***/ "./node_modules/uuid/lib/rng-browser.js":
/*!**********************************************!*\
  !*** ./node_modules/uuid/lib/rng-browser.js ***!
  \**********************************************/
/*! no static exports found */
/***/ (function(module, exports) {

// Unique ID creation requires a high quality random # generator.  In the
// browser this is a little complicated due to unknown quality of Math.random()
// and inconsistent support for the `crypto` API.  We do the best we can via
// feature-detection

// getRandomValues needs to be invoked in a context where "this" is a Crypto implementation.
var getRandomValues = (typeof(crypto) != 'undefined' && crypto.getRandomValues.bind(crypto)) ||
                      (typeof(msCrypto) != 'undefined' && msCrypto.getRandomValues.bind(msCrypto));
if (getRandomValues) {
  // WHATWG crypto RNG - http://wiki.whatwg.org/wiki/Crypto
  var rnds8 = new Uint8Array(16); // eslint-disable-line no-undef

  module.exports = function whatwgRNG() {
    getRandomValues(rnds8);
    return rnds8;
  };
} else {
  // Math.random()-based (RNG)
  //
  // If all else fails, use Math.random().  It's fast, but is of unspecified
  // quality.
  var rnds = new Array(16);

  module.exports = function mathRNG() {
    for (var i = 0, r; i < 16; i++) {
      if ((i & 0x03) === 0) r = Math.random() * 0x100000000;
      rnds[i] = r >>> ((i & 0x03) << 3) & 0xff;
    }

    return rnds;
  };
}


/***/ }),

/***/ "./node_modules/uuid/v4.js":
/*!*********************************!*\
  !*** ./node_modules/uuid/v4.js ***!
  \*********************************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

var rng = __webpack_require__(/*! ./lib/rng */ "./node_modules/uuid/lib/rng-browser.js");
var bytesToUuid = __webpack_require__(/*! ./lib/bytesToUuid */ "./node_modules/uuid/lib/bytesToUuid.js");

function v4(options, buf, offset) {
  var i = buf && offset || 0;

  if (typeof(options) == 'string') {
    buf = options === 'binary' ? new Array(16) : null;
    options = null;
  }
  options = options || {};

  var rnds = options.random || (options.rng || rng)();

  // Per 4.4, set bits for version and `clock_seq_hi_and_reserved`
  rnds[6] = (rnds[6] & 0x0f) | 0x40;
  rnds[8] = (rnds[8] & 0x3f) | 0x80;

  // Copy bytes to buffer, if provided
  if (buf) {
    for (var ii = 0; ii < 16; ++ii) {
      buf[i + ii] = rnds[ii];
    }
  }

  return buf || bytesToUuid(rnds);
}

module.exports = v4;


/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vU2NyaXB0cy9ScGMudHMiLCJ3ZWJwYWNrOi8vLy4vU2NyaXB0cy9XZWJTb2NrZXRScGMudHMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL3V1aWQvbGliL2J5dGVzVG9VdWlkLmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy91dWlkL2xpYi9ybmctYnJvd3Nlci5qcyIsIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvdXVpZC92NC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQSx5REFBaUQsY0FBYztBQUMvRDs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBMkIsMEJBQTBCLEVBQUU7QUFDdkQseUNBQWlDLGVBQWU7QUFDaEQ7QUFDQTtBQUNBOztBQUVBO0FBQ0EsOERBQXNELCtEQUErRDs7QUFFckg7QUFDQTs7O0FBR0E7QUFDQTs7Ozs7Ozs7Ozs7Ozs7O0FDMURBO0lBSUksYUFBb0IsWUFBeUIsRUFBVSxpQkFBbUM7UUFBdEUsaUJBQVksR0FBWixZQUFZLENBQWE7UUFBVSxzQkFBaUIsR0FBakIsaUJBQWlCLENBQWtCO1FBSGxGLGFBQVEsR0FBd0IsRUFBRSxDQUFDO1FBQ25DLGVBQVUsR0FBdUIsRUFBRSxDQUFDO1FBR3hDLElBQUksQ0FBQyxZQUFZLEVBQUU7WUFDZixNQUFNLElBQUksS0FBSyxDQUFDLDJDQUEyQyxDQUFDO1NBQy9EO1FBQ0QsSUFBSSxDQUFDLGlCQUFpQixFQUFFO1lBQ3BC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QUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxpQ0FBaUM7O0FBRWpDO0FBQ0E7QUFDQTtBQUNBO0FBQ0EsQ0FBQztBQUNEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQSxzQkFBc0IsUUFBUTtBQUM5QjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7Ozs7Ozs7Ozs7QUMvQkE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7O0FBRUE7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQSxvQkFBb0IsU0FBUztBQUM3QjtBQUNBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQSIsImZpbGUiOiJ3c1JwYy5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwge1xuIFx0XHRcdFx0Y29uZmlndXJhYmxlOiBmYWxzZSxcbiBcdFx0XHRcdGVudW1lcmFibGU6IHRydWUsXG4gXHRcdFx0XHRnZXQ6IGdldHRlclxuIFx0XHRcdH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBkZWZpbmUgX19lc01vZHVsZSBvbiBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnIgPSBmdW5jdGlvbihleHBvcnRzKSB7XG4gXHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCAnX19lc01vZHVsZScsIHsgdmFsdWU6IHRydWUgfSk7XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gXCIuL1NjcmlwdHMvV2ViU29ja2V0UnBjLnRzXCIpO1xuIiwiaW1wb3J0IHsgU2VuZEhhbmRsZXIsIENyZWF0ZUtleUhhbmRsZXIgfSBmcm9tIFwiLi9EZWxlZ2F0ZXNcIjtcclxuaW1wb3J0IHsgSVJlcXVlc3RNZXNzYWdlIH0gZnJvbSBcIi4vSVJlcXVlc3RNZXNzYWdlXCI7XHJcbmltcG9ydCB7IElSZXNwb25zZU1lc3NhZ2UgfSBmcm9tIFwiLi9JUmVzcG9uc2VNZXNzYWdlXCI7XHJcblxyXG50eXBlIFJwY01ldGhvZCA9ICgpID0+IHZvaWQ7XHJcbnR5cGUgUnBjTWV0aG9kSW5mbyA9IHsgb2JqOiBhbnksIG1ldGhvZDogUnBjTWV0aG9kIH07XHJcbnR5cGUgUnBjTWV0aG9kRGljdGlvbmFyeSA9IHtba2V5OiBzdHJpbmddOiBScGNNZXRob2RJbmZvIH07XHJcbnR5cGUgQ2FsbGJhY2tEaWN0aW9uYXJ5ID0ge1trZXk6IHN0cmluZ106IHsgcmVzb2x2ZTogKHJlc3VsdD86IGFueSkgPT4gdm9pZCwgcmVqZWN0OiAocmVhc29uPzogYW55KSA9PiB2b2lkIH19O1xyXG5cclxuZXhwb3J0IGNsYXNzIFJwYzxUUmVzcG9uc2VNZXNzYWdlIGV4dGVuZHMgSVJlc3BvbnNlTWVzc2FnZSwgVFJlcXVlc3RNZXNzYWdlIGV4dGVuZHMgSVJlcXVlc3RNZXNzYWdlPiAge1xyXG4gICAgcHJpdmF0ZSBfbWV0aG9kczogUnBjTWV0aG9kRGljdGlvbmFyeSA9IHt9O1xyXG4gICAgcHJpdmF0ZSBfY2FsbGJhY2tzOiBDYWxsYmFja0RpY3Rpb25hcnkgPSB7fTtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF9zZW5kSGFuZGxlcjogU2VuZEhhbmRsZXIsIHByaXZhdGUgX2NyZWF0ZUtleUhhbmRsZXI6IENyZWF0ZUtleUhhbmRsZXIpIHtcclxuICAgICAgICBpZiAoIV9zZW5kSGFuZGxlcikge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ1NlbmQgaGFuZGxlciBjYW5ub3QgYmUgdW5kZWZpbmVkIG9yIG51bGwuJylcclxuICAgICAgICB9XHJcbiAgICAgICAgaWYgKCFfY3JlYXRlS2V5SGFuZGxlcikge1xyXG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoJ0NyZWF0ZSBrZXkgaGFuZGxlciBjYW5ub3QgYmUgdW5kZWZpbmVkIG9yIG51bGwuJylcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcmVnaXN0ZXJNZXRob2Qob2JqOiBhbnksIG1ldGhvZE5hbWU6IHN0cmluZywgbWV0aG9kPzogUnBjTWV0aG9kKSB7XHJcbiAgICAgICAgaWYgKCFtZXRob2QpIHtcclxuICAgICAgICAgICAgbWV0aG9kID0gb2JqW21ldGhvZE5hbWVdO1xyXG4gICAgICAgICAgICBpZiAoIW1ldGhvZCB8fCAhKG1ldGhvZCBpbnN0YW5jZW9mIEZ1bmN0aW9uKSkge1xyXG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKGBObyBtZXRob2Qgd2l0aCBuYW1lICR7bWV0aG9kTmFtZX0uYCk7XHJcbiAgICAgICAgICAgIH1cclxuICAgICAgICB9XHJcbiAgICAgICAgdGhpcy5fbWV0aG9kc1ttZXRob2ROYW1lLnRvTG93ZXJDYXNlKCldID0geyBvYmosIG1ldGhvZCB9O1xyXG4gICAgfVxyXG5cclxuICAgIHByb2Nlc3NSZXF1ZXN0TWVzc2FnZShtZXNzYWdlOiBUUmVxdWVzdE1lc3NhZ2UpIHtcclxuICAgICAgICBsZXQgbWV0aG9kID10aGlzLl9tZXRob2RzW21lc3NhZ2UubWV0aG9kTmFtZS50b0xvd2VyQ2FzZSgpXTtcclxuICAgICAgICBpZiAoIW1ldGhvZCkge1xyXG4gICAgICAgICAgICB0aGlzLl9zZW5kSGFuZGxlcih0aGlzLmNyZWF0ZUVycm9yUmVzcG9uc2UobWVzc2FnZSwgYE5vIG1ldGhvZCB3aXRoIG5hbWUgJHttZXNzYWdlLm1ldGhvZE5hbWV9IGZvdW5kLmApKVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdHJ5IHtcclxuICAgICAgICAgICAgY29uc3QgcmVzdWx0ID0gbWV0aG9kLm1ldGhvZC5hcHBseShtZXRob2Qub2JqLCBtZXNzYWdlLm1ldGhvZEFyZ3VtZW50cyk7XHJcbiAgICAgICAgICAgIHRoaXMuX3NlbmRIYW5kbGVyKHRoaXMuY3JlYXRlU3VjY2Vzc2Z1bFJlc3BvbnNlKG1lc3NhZ2UsIHJlc3VsdCkpO1xyXG4gICAgICAgIH0gY2F0Y2ggKGVycikge1xyXG4gICAgICAgICAgICB0aGlzLl9zZW5kSGFuZGxlcih0aGlzLmNyZWF0ZUVycm9yUmVzcG9uc2UobWVzc2FnZSwgZXJyKSk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIGNhbGwobWV0aG9kTmFtZTogc3RyaW5nLCBhcmdzOiBhbnlbXSk6IFByb21pc2U8YW55PiB7XHJcbiAgICAgICAgY29uc3QgY2FsbCA9IHRoaXMuY3JlYXRlQ2FsbChtZXRob2ROYW1lLCBhcmdzKTtcclxuICAgICAgICByZXR1cm4gbmV3IFByb21pc2U8YW55PigocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XHJcbiAgICAgICAgICAgIHRoaXMuX2NhbGxiYWNrc1tjYWxsLmlkXSA9IHtyZXNvbHZlLCByZWplY3R9O1xyXG4gICAgICAgICAgICB0aGlzLl9zZW5kSGFuZGxlcihjYWxsKTtcclxuICAgICAgICB9KTtcclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzUmVzcG9uc2VNZXNzYWdlKG1lc3NhZ2U6IFRSZXNwb25zZU1lc3NhZ2UpIHtcclxuICAgICAgICBjb25zdCBjYWxsYmFjayA9IHRoaXMuX2NhbGxiYWNrc1ttZXNzYWdlLmlkXTtcclxuICAgICAgICBpZiAoIWNhbGxiYWNrKSB7XHJcbiAgICAgICAgICAgIGNvbnNvbGUud2FybihgTm8gY2FsbGJhY2sgZm91bmQgd2l0aCBJRCAke21lc3NhZ2UuaWR9LmApO1xyXG4gICAgICAgICAgICByZXR1cm47XHJcbiAgICAgICAgfVxyXG5cclxuICAgICAgICBpZiAobWVzc2FnZS5zdWNjZXNzZnVsKSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrLnJlc29sdmUobWVzc2FnZS5yZXNwb25zZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgY2FsbGJhY2sucmVqZWN0KG1lc3NhZ2UucmVzcG9uc2UpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUNhbGwobWV0aG9kTmFtZTogc3RyaW5nLCBhcmdzOiBhbnlbXSk6IFRSZXF1ZXN0TWVzc2FnZSB7XHJcbiAgICAgICAgcmV0dXJuIDxUUmVxdWVzdE1lc3NhZ2U+IHtcclxuICAgICAgICAgICAgaWQ6IHRoaXMuX2NyZWF0ZUtleUhhbmRsZXIoKSxcclxuICAgICAgICAgICAgbWV0aG9kTmFtZSxcclxuICAgICAgICAgICAgbWV0aG9kQXJndW1lbnRzOiBhcmdzXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZVN1Y2Nlc3NmdWxSZXNwb25zZShtZXNzYWdlOiBUUmVxdWVzdE1lc3NhZ2UsIHJlc3BvbnNlOiBhbnkpOiBUUmVzcG9uc2VNZXNzYWdlIHtcclxuICAgICAgICByZXR1cm4gPFRSZXNwb25zZU1lc3NhZ2U+IHtcclxuICAgICAgICAgICAgaWQ6IG1lc3NhZ2UuaWQsXHJcbiAgICAgICAgICAgIHJlc3BvbnNlLFxyXG4gICAgICAgICAgICBzdWNjZXNzZnVsOiB0cnVlXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbiAgICBwcml2YXRlIGNyZWF0ZUVycm9yUmVzcG9uc2UobWVzc2FnZTogVFJlcXVlc3RNZXNzYWdlLCByZXNwb25zZTogYW55KTogVFJlc3BvbnNlTWVzc2FnZSB7XHJcbiAgICAgICAgcmV0dXJuIDxUUmVzcG9uc2VNZXNzYWdlPiB7XHJcbiAgICAgICAgICAgIGlkOiBtZXNzYWdlLmlkLFxyXG4gICAgICAgICAgICByZXNwb25zZSxcclxuICAgICAgICAgICAgc3VjY2Vzc2Z1bDogZmFsc2VcclxuICAgICAgICB9O1xyXG4gICAgfVxyXG5cclxufSIsImltcG9ydCB7IFJwYyB9IGZyb20gXCIuL1JwY1wiO1xyXG5pbXBvcnQgeyBSZXF1ZXN0TWVzc2FnZSB9IGZyb20gXCIuL1JlcXVlc3RNZXNzYWdlXCI7XHJcbmltcG9ydCB7IFJlc3BvbnNlTWVzc2FnZSB9IGZyb20gXCIuL1Jlc3BvbnNlTWVzc2FnZVwiO1xyXG5pbXBvcnQgKiBhcyBndWlkIGZyb20gJ3V1aWQvdjQnO1xyXG5pbXBvcnQgeyBJTWVzc2FnZSB9IGZyb20gXCIuL0lNZXNzYWdlXCI7XHJcbmltcG9ydCB7IElSZXNwb25zZU1lc3NhZ2UgfSBmcm9tIFwiLi9JUmVzcG9uc2VNZXNzYWdlXCI7XHJcbmltcG9ydCB7IElSZXF1ZXN0TWVzc2FnZSB9IGZyb20gXCIuL0lSZXF1ZXN0TWVzc2FnZVwiO1xyXG5cclxuXHJcbmV4cG9ydCBjbGFzcyBXZWJTb2NrZXRScGMge1xyXG4gICAgcHJpdmF0ZSBfcnBjOiBScGM8UmVzcG9uc2VNZXNzYWdlLCBSZXF1ZXN0TWVzc2FnZT47XHJcbiAgICBwcml2YXRlIF93czogV2ViU29ja2V0O1xyXG5cclxuICAgIGNvbnN0cnVjdG9yKHByaXZhdGUgX3VybDogc3RyaW5nKSB7XHJcbiAgICB9XHJcblxyXG4gICAgc3RhcnQoKSB7XHJcbiAgICAgICAgdGhpcy5fd3MgPSBuZXcgV2ViU29ja2V0KHRoaXMuX3VybCk7XHJcbiAgICAgICAgdGhpcy5fd3Mub25tZXNzYWdlID0gKGV2dCkgPT4ge1xyXG4gICAgICAgICAgICBjb25zdCBmaWxlUmVhZGVyID0gbmV3IEZpbGVSZWFkZXIoKTtcclxuICAgICAgICAgICAgZmlsZVJlYWRlci5hZGRFdmVudExpc3RlbmVyKCdsb2FkZW5kJywgKCkgPT4ge1xyXG4gICAgICAgICAgICAgICAgY29uc3QgbWVzc2FnZSA9IEpTT04ucGFyc2UoZmlsZVJlYWRlci5yZXN1bHQpO1xyXG4gICAgICAgICAgICAgICAgdGhpcy5vblJlY2VpdmUobWVzc2FnZSk7XHJcbiAgICAgICAgICAgIH0pO1xyXG4gICAgICAgICAgICBmaWxlUmVhZGVyLnJlYWRBc1RleHQoZXZ0LmRhdGEpO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fcnBjID0gbmV3IFJwYzxSZXNwb25zZU1lc3NhZ2UsIFJlcXVlc3RNZXNzYWdlPigobSkgPT4gdGhpcy5zZW5kKG0pLCAoKSA9PiBndWlkKCkpXHJcbiAgICAgICAgdGhpcy5fcnBjLnJlZ2lzdGVyTWV0aG9kKHRoaXMsICdnZXRCJywgdGhpcy5nZXRCKTtcclxuICAgIH1cclxuXHJcbiAgICBzZW5kKGRhdGE6IGFueSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHRoaXMuX3dzLnNlbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgXykgPT4gcmVzb2x2ZSgpKTtcclxuICAgIH1cclxuXHJcbiAgICBvblJlY2VpdmUoZGF0YTogYW55KSB7XHJcbiAgICAgICAgaWYgKGRhdGFbJ3Jlc3BvbnNlJ10pIHtcclxuICAgICAgICAgICAgdGhpcy5fcnBjLnByb2Nlc3NSZXNwb25zZU1lc3NhZ2UoZGF0YSBhcyBJUmVzcG9uc2VNZXNzYWdlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9ycGMucHJvY2Vzc1JlcXVlc3RNZXNzYWdlKGRhdGEgYXMgSVJlcXVlc3RNZXNzYWdlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY2FsbChtZXRob2ROYW1lOiBzdHJpbmcsIGFyZ3M6IGFueVtdKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcnBjLmNhbGwobWV0aG9kTmFtZSwgYXJncyk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0QigpIHtcclxuICAgICAgICByZXR1cm4gcGFyc2VJbnQoKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiLWlucHV0JykgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWUpO1xyXG4gICAgfVxyXG59XHJcblxyXG53aW5kb3dbJ1dlYlNvY2tldFJwYyddID0gV2ViU29ja2V0UnBjOyIsIi8qKlxuICogQ29udmVydCBhcnJheSBvZiAxNiBieXRlIHZhbHVlcyB0byBVVUlEIHN0cmluZyBmb3JtYXQgb2YgdGhlIGZvcm06XG4gKiBYWFhYWFhYWC1YWFhYLVhYWFgtWFhYWC1YWFhYWFhYWFhYWFhcbiAqL1xudmFyIGJ5dGVUb0hleCA9IFtdO1xuZm9yICh2YXIgaSA9IDA7IGkgPCAyNTY7ICsraSkge1xuICBieXRlVG9IZXhbaV0gPSAoaSArIDB4MTAwKS50b1N0cmluZygxNikuc3Vic3RyKDEpO1xufVxuXG5mdW5jdGlvbiBieXRlc1RvVXVpZChidWYsIG9mZnNldCkge1xuICB2YXIgaSA9IG9mZnNldCB8fCAwO1xuICB2YXIgYnRoID0gYnl0ZVRvSGV4O1xuICByZXR1cm4gYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJ5dGVzVG9VdWlkO1xuIiwiLy8gVW5pcXVlIElEIGNyZWF0aW9uIHJlcXVpcmVzIGEgaGlnaCBxdWFsaXR5IHJhbmRvbSAjIGdlbmVyYXRvci4gIEluIHRoZVxuLy8gYnJvd3NlciB0aGlzIGlzIGEgbGl0dGxlIGNvbXBsaWNhdGVkIGR1ZSB0byB1bmtub3duIHF1YWxpdHkgb2YgTWF0aC5yYW5kb20oKVxuLy8gYW5kIGluY29uc2lzdGVudCBzdXBwb3J0IGZvciB0aGUgYGNyeXB0b2AgQVBJLiAgV2UgZG8gdGhlIGJlc3Qgd2UgY2FuIHZpYVxuLy8gZmVhdHVyZS1kZXRlY3Rpb25cblxuLy8gZ2V0UmFuZG9tVmFsdWVzIG5lZWRzIHRvIGJlIGludm9rZWQgaW4gYSBjb250ZXh0IHdoZXJlIFwidGhpc1wiIGlzIGEgQ3J5cHRvIGltcGxlbWVudGF0aW9uLlxudmFyIGdldFJhbmRvbVZhbHVlcyA9ICh0eXBlb2YoY3J5cHRvKSAhPSAndW5kZWZpbmVkJyAmJiBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzLmJpbmQoY3J5cHRvKSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAodHlwZW9mKG1zQ3J5cHRvKSAhPSAndW5kZWZpbmVkJyAmJiBtc0NyeXB0by5nZXRSYW5kb21WYWx1ZXMuYmluZChtc0NyeXB0bykpO1xuaWYgKGdldFJhbmRvbVZhbHVlcykge1xuICAvLyBXSEFUV0cgY3J5cHRvIFJORyAtIGh0dHA6Ly93aWtpLndoYXR3Zy5vcmcvd2lraS9DcnlwdG9cbiAgdmFyIHJuZHM4ID0gbmV3IFVpbnQ4QXJyYXkoMTYpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVuZGVmXG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB3aGF0d2dSTkcoKSB7XG4gICAgZ2V0UmFuZG9tVmFsdWVzKHJuZHM4KTtcbiAgICByZXR1cm4gcm5kczg7XG4gIH07XG59IGVsc2Uge1xuICAvLyBNYXRoLnJhbmRvbSgpLWJhc2VkIChSTkcpXG4gIC8vXG4gIC8vIElmIGFsbCBlbHNlIGZhaWxzLCB1c2UgTWF0aC5yYW5kb20oKS4gIEl0J3MgZmFzdCwgYnV0IGlzIG9mIHVuc3BlY2lmaWVkXG4gIC8vIHF1YWxpdHkuXG4gIHZhciBybmRzID0gbmV3IEFycmF5KDE2KTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG1hdGhSTkcoKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIHI7IGkgPCAxNjsgaSsrKSB7XG4gICAgICBpZiAoKGkgJiAweDAzKSA9PT0gMCkgciA9IE1hdGgucmFuZG9tKCkgKiAweDEwMDAwMDAwMDtcbiAgICAgIHJuZHNbaV0gPSByID4+PiAoKGkgJiAweDAzKSA8PCAzKSAmIDB4ZmY7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJuZHM7XG4gIH07XG59XG4iLCJ2YXIgcm5nID0gcmVxdWlyZSgnLi9saWIvcm5nJyk7XG52YXIgYnl0ZXNUb1V1aWQgPSByZXF1aXJlKCcuL2xpYi9ieXRlc1RvVXVpZCcpO1xuXG5mdW5jdGlvbiB2NChvcHRpb25zLCBidWYsIG9mZnNldCkge1xuICB2YXIgaSA9IGJ1ZiAmJiBvZmZzZXQgfHwgMDtcblxuICBpZiAodHlwZW9mKG9wdGlvbnMpID09ICdzdHJpbmcnKSB7XG4gICAgYnVmID0gb3B0aW9ucyA9PT0gJ2JpbmFyeScgPyBuZXcgQXJyYXkoMTYpIDogbnVsbDtcbiAgICBvcHRpb25zID0gbnVsbDtcbiAgfVxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICB2YXIgcm5kcyA9IG9wdGlvbnMucmFuZG9tIHx8IChvcHRpb25zLnJuZyB8fCBybmcpKCk7XG5cbiAgLy8gUGVyIDQuNCwgc2V0IGJpdHMgZm9yIHZlcnNpb24gYW5kIGBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkYFxuICBybmRzWzZdID0gKHJuZHNbNl0gJiAweDBmKSB8IDB4NDA7XG4gIHJuZHNbOF0gPSAocm5kc1s4XSAmIDB4M2YpIHwgMHg4MDtcblxuICAvLyBDb3B5IGJ5dGVzIHRvIGJ1ZmZlciwgaWYgcHJvdmlkZWRcbiAgaWYgKGJ1Zikge1xuICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCAxNjsgKytpaSkge1xuICAgICAgYnVmW2kgKyBpaV0gPSBybmRzW2lpXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnVmIHx8IGJ5dGVzVG9VdWlkKHJuZHMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHY0O1xuIl0sInNvdXJjZVJvb3QiOiIifQ==