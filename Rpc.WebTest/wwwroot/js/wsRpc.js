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
            if (typeof evt.data === 'string') {
                _this.onReceive(JSON.parse(evt.data));
            }
            else {
                _this.onReceive(evt.data);
            }
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vU2NyaXB0cy9ScGMudHMiLCJ3ZWJwYWNrOi8vLy4vU2NyaXB0cy9XZWJTb2NrZXRScGMudHMiLCJ3ZWJwYWNrOi8vLy4vbm9kZV9tb2R1bGVzL3V1aWQvbGliL2J5dGVzVG9VdWlkLmpzIiwid2VicGFjazovLy8uL25vZGVfbW9kdWxlcy91dWlkL2xpYi9ybmctYnJvd3Nlci5qcyIsIndlYnBhY2s6Ly8vLi9ub2RlX21vZHVsZXMvdXVpZC92NC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQSx5REFBaUQsY0FBYztBQUMvRDs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBMkIsMEJBQTBCLEVBQUU7QUFDdkQseUNBQWlDLGVBQWU7QUFDaEQ7QUFDQTtBQUNBOztBQUVBO0FBQ0EsOERBQXNELCtEQUErRDs7QUFFckg7QUFDQTs7O0FBR0E7QUFDQTs7Ozs7Ozs7Ozs7Ozs7O0FDMURBO0lBSUksYUFBb0IsWUFBeUIsRUFBVSxpQkFBbUM7UUFBdEUsaUJBQVksR0FBWixZQUFZLENBQWE7UUFBVSxzQkFBaUIsR0FBakIsaUJBQWlCLENBQWtCO1FBSGxGLGFBQVEsR0FBd0IsRUFBRSxDQUFDO1FBQ25DLGVBQVUsR0FBdUIsRUFBRSxDQUFDO1FBR3hDLElBQUksQ0FBQyxZQUFZLEVBQUU7WUFDZixNQUFNLElBQUksS0FBSyxDQUFDLDJDQUEyQyxDQUFDO1NBQy9EO1FBQ0QsSUFBSSxDQUFDLGlCQUFpQixFQUFFO1lBQ3BC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LENBQUM7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0Esc0JBQXNCLFFBQVE7QUFDOUI7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTs7Ozs7Ozs7Ozs7O0FDL0JBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBOztBQUVBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0Esb0JBQW9CLFNBQVM7QUFDN0I7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUEiLCJmaWxlIjoid3NScGMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIgXHQvLyBUaGUgbW9kdWxlIGNhY2hlXG4gXHR2YXIgaW5zdGFsbGVkTW9kdWxlcyA9IHt9O1xuXG4gXHQvLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuIFx0ZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXG4gXHRcdC8vIENoZWNrIGlmIG1vZHVsZSBpcyBpbiBjYWNoZVxuIFx0XHRpZihpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSkge1xuIFx0XHRcdHJldHVybiBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXS5leHBvcnRzO1xuIFx0XHR9XG4gXHRcdC8vIENyZWF0ZSBhIG5ldyBtb2R1bGUgKGFuZCBwdXQgaXQgaW50byB0aGUgY2FjaGUpXG4gXHRcdHZhciBtb2R1bGUgPSBpbnN0YWxsZWRNb2R1bGVzW21vZHVsZUlkXSA9IHtcbiBcdFx0XHRpOiBtb2R1bGVJZCxcbiBcdFx0XHRsOiBmYWxzZSxcbiBcdFx0XHRleHBvcnRzOiB7fVxuIFx0XHR9O1xuXG4gXHRcdC8vIEV4ZWN1dGUgdGhlIG1vZHVsZSBmdW5jdGlvblxuIFx0XHRtb2R1bGVzW21vZHVsZUlkXS5jYWxsKG1vZHVsZS5leHBvcnRzLCBtb2R1bGUsIG1vZHVsZS5leHBvcnRzLCBfX3dlYnBhY2tfcmVxdWlyZV9fKTtcblxuIFx0XHQvLyBGbGFnIHRoZSBtb2R1bGUgYXMgbG9hZGVkXG4gXHRcdG1vZHVsZS5sID0gdHJ1ZTtcblxuIFx0XHQvLyBSZXR1cm4gdGhlIGV4cG9ydHMgb2YgdGhlIG1vZHVsZVxuIFx0XHRyZXR1cm4gbW9kdWxlLmV4cG9ydHM7XG4gXHR9XG5cblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGVzIG9iamVjdCAoX193ZWJwYWNrX21vZHVsZXNfXylcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubSA9IG1vZHVsZXM7XG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlIGNhY2hlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmMgPSBpbnN0YWxsZWRNb2R1bGVzO1xuXG4gXHQvLyBkZWZpbmUgZ2V0dGVyIGZ1bmN0aW9uIGZvciBoYXJtb255IGV4cG9ydHNcbiBcdF9fd2VicGFja19yZXF1aXJlX18uZCA9IGZ1bmN0aW9uKGV4cG9ydHMsIG5hbWUsIGdldHRlcikge1xuIFx0XHRpZighX193ZWJwYWNrX3JlcXVpcmVfXy5vKGV4cG9ydHMsIG5hbWUpKSB7XG4gXHRcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIG5hbWUsIHtcbiBcdFx0XHRcdGNvbmZpZ3VyYWJsZTogZmFsc2UsXG4gXHRcdFx0XHRlbnVtZXJhYmxlOiB0cnVlLFxuIFx0XHRcdFx0Z2V0OiBnZXR0ZXJcbiBcdFx0XHR9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yID0gZnVuY3Rpb24oZXhwb3J0cykge1xuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuIFx0fTtcblxuIFx0Ly8gZ2V0RGVmYXVsdEV4cG9ydCBmdW5jdGlvbiBmb3IgY29tcGF0aWJpbGl0eSB3aXRoIG5vbi1oYXJtb255IG1vZHVsZXNcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubiA9IGZ1bmN0aW9uKG1vZHVsZSkge1xuIFx0XHR2YXIgZ2V0dGVyID0gbW9kdWxlICYmIG1vZHVsZS5fX2VzTW9kdWxlID9cbiBcdFx0XHRmdW5jdGlvbiBnZXREZWZhdWx0KCkgeyByZXR1cm4gbW9kdWxlWydkZWZhdWx0J107IH0gOlxuIFx0XHRcdGZ1bmN0aW9uIGdldE1vZHVsZUV4cG9ydHMoKSB7IHJldHVybiBtb2R1bGU7IH07XG4gXHRcdF9fd2VicGFja19yZXF1aXJlX18uZChnZXR0ZXIsICdhJywgZ2V0dGVyKTtcbiBcdFx0cmV0dXJuIGdldHRlcjtcbiBcdH07XG5cbiBcdC8vIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbFxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5vID0gZnVuY3Rpb24ob2JqZWN0LCBwcm9wZXJ0eSkgeyByZXR1cm4gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG9iamVjdCwgcHJvcGVydHkpOyB9O1xuXG4gXHQvLyBfX3dlYnBhY2tfcHVibGljX3BhdGhfX1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5wID0gXCJcIjtcblxuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IFwiLi9TY3JpcHRzL1dlYlNvY2tldFJwYy50c1wiKTtcbiIsImltcG9ydCB7IFNlbmRIYW5kbGVyLCBDcmVhdGVLZXlIYW5kbGVyIH0gZnJvbSBcIi4vRGVsZWdhdGVzXCI7XHJcbmltcG9ydCB7IElSZXF1ZXN0TWVzc2FnZSB9IGZyb20gXCIuL0lSZXF1ZXN0TWVzc2FnZVwiO1xyXG5pbXBvcnQgeyBJUmVzcG9uc2VNZXNzYWdlIH0gZnJvbSBcIi4vSVJlc3BvbnNlTWVzc2FnZVwiO1xyXG5cclxudHlwZSBScGNNZXRob2QgPSAoKSA9PiB2b2lkO1xyXG50eXBlIFJwY01ldGhvZEluZm8gPSB7IG9iajogYW55LCBtZXRob2Q6IFJwY01ldGhvZCB9O1xyXG50eXBlIFJwY01ldGhvZERpY3Rpb25hcnkgPSB7W2tleTogc3RyaW5nXTogUnBjTWV0aG9kSW5mbyB9O1xyXG50eXBlIENhbGxiYWNrRGljdGlvbmFyeSA9IHtba2V5OiBzdHJpbmddOiB7IHJlc29sdmU6IChyZXN1bHQ/OiBhbnkpID0+IHZvaWQsIHJlamVjdDogKHJlYXNvbj86IGFueSkgPT4gdm9pZCB9fTtcclxuXHJcbmV4cG9ydCBjbGFzcyBScGM8VFJlc3BvbnNlTWVzc2FnZSBleHRlbmRzIElSZXNwb25zZU1lc3NhZ2UsIFRSZXF1ZXN0TWVzc2FnZSBleHRlbmRzIElSZXF1ZXN0TWVzc2FnZT4gIHtcclxuICAgIHByaXZhdGUgX21ldGhvZHM6IFJwY01ldGhvZERpY3Rpb25hcnkgPSB7fTtcclxuICAgIHByaXZhdGUgX2NhbGxiYWNrczogQ2FsbGJhY2tEaWN0aW9uYXJ5ID0ge307XHJcblxyXG4gICAgY29uc3RydWN0b3IocHJpdmF0ZSBfc2VuZEhhbmRsZXI6IFNlbmRIYW5kbGVyLCBwcml2YXRlIF9jcmVhdGVLZXlIYW5kbGVyOiBDcmVhdGVLZXlIYW5kbGVyKSB7XHJcbiAgICAgICAgaWYgKCFfc2VuZEhhbmRsZXIpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdTZW5kIGhhbmRsZXIgY2Fubm90IGJlIHVuZGVmaW5lZCBvciBudWxsLicpXHJcbiAgICAgICAgfVxyXG4gICAgICAgIGlmICghX2NyZWF0ZUtleUhhbmRsZXIpIHtcclxuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKCdDcmVhdGUga2V5IGhhbmRsZXIgY2Fubm90IGJlIHVuZGVmaW5lZCBvciBudWxsLicpXHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIHJlZ2lzdGVyTWV0aG9kKG9iajogYW55LCBtZXRob2ROYW1lOiBzdHJpbmcsIG1ldGhvZD86IFJwY01ldGhvZCkge1xyXG4gICAgICAgIGlmICghbWV0aG9kKSB7XHJcbiAgICAgICAgICAgIG1ldGhvZCA9IG9ialttZXRob2ROYW1lXTtcclxuICAgICAgICAgICAgaWYgKCFtZXRob2QgfHwgIShtZXRob2QgaW5zdGFuY2VvZiBGdW5jdGlvbikpIHtcclxuICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihgTm8gbWV0aG9kIHdpdGggbmFtZSAke21ldGhvZE5hbWV9LmApO1xyXG4gICAgICAgICAgICB9XHJcbiAgICAgICAgfVxyXG4gICAgICAgIHRoaXMuX21ldGhvZHNbbWV0aG9kTmFtZS50b0xvd2VyQ2FzZSgpXSA9IHsgb2JqLCBtZXRob2QgfTtcclxuICAgIH1cclxuXHJcbiAgICBwcm9jZXNzUmVxdWVzdE1lc3NhZ2UobWVzc2FnZTogVFJlcXVlc3RNZXNzYWdlKSB7XHJcbiAgICAgICAgbGV0IG1ldGhvZCA9dGhpcy5fbWV0aG9kc1ttZXNzYWdlLm1ldGhvZE5hbWUudG9Mb3dlckNhc2UoKV07XHJcbiAgICAgICAgaWYgKCFtZXRob2QpIHtcclxuICAgICAgICAgICAgdGhpcy5fc2VuZEhhbmRsZXIodGhpcy5jcmVhdGVFcnJvclJlc3BvbnNlKG1lc3NhZ2UsIGBObyBtZXRob2Qgd2l0aCBuYW1lICR7bWVzc2FnZS5tZXRob2ROYW1lfSBmb3VuZC5gKSlcclxuICAgICAgICB9XHJcblxyXG4gICAgICAgIHRyeSB7XHJcbiAgICAgICAgICAgIGNvbnN0IHJlc3VsdCA9IG1ldGhvZC5tZXRob2QuYXBwbHkobWV0aG9kLm9iaiwgbWVzc2FnZS5tZXRob2RBcmd1bWVudHMpO1xyXG4gICAgICAgICAgICB0aGlzLl9zZW5kSGFuZGxlcih0aGlzLmNyZWF0ZVN1Y2Nlc3NmdWxSZXNwb25zZShtZXNzYWdlLCByZXN1bHQpKTtcclxuICAgICAgICB9IGNhdGNoIChlcnIpIHtcclxuICAgICAgICAgICAgdGhpcy5fc2VuZEhhbmRsZXIodGhpcy5jcmVhdGVFcnJvclJlc3BvbnNlKG1lc3NhZ2UsIGVycikpO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxuXHJcbiAgICBjYWxsKG1ldGhvZE5hbWU6IHN0cmluZywgYXJnczogYW55W10pOiBQcm9taXNlPGFueT4ge1xyXG4gICAgICAgIGNvbnN0IGNhbGwgPSB0aGlzLmNyZWF0ZUNhbGwobWV0aG9kTmFtZSwgYXJncyk7XHJcbiAgICAgICAgcmV0dXJuIG5ldyBQcm9taXNlPGFueT4oKHJlc29sdmUsIHJlamVjdCkgPT4ge1xyXG4gICAgICAgICAgICB0aGlzLl9jYWxsYmFja3NbY2FsbC5pZF0gPSB7cmVzb2x2ZSwgcmVqZWN0fTtcclxuICAgICAgICAgICAgdGhpcy5fc2VuZEhhbmRsZXIoY2FsbCk7XHJcbiAgICAgICAgfSk7XHJcbiAgICB9XHJcblxyXG4gICAgcHJvY2Vzc1Jlc3BvbnNlTWVzc2FnZShtZXNzYWdlOiBUUmVzcG9uc2VNZXNzYWdlKSB7XHJcbiAgICAgICAgY29uc3QgY2FsbGJhY2sgPSB0aGlzLl9jYWxsYmFja3NbbWVzc2FnZS5pZF07XHJcbiAgICAgICAgaWYgKCFjYWxsYmFjaykge1xyXG4gICAgICAgICAgICBjb25zb2xlLndhcm4oYE5vIGNhbGxiYWNrIGZvdW5kIHdpdGggSUQgJHttZXNzYWdlLmlkfS5gKTtcclxuICAgICAgICAgICAgcmV0dXJuO1xyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgaWYgKG1lc3NhZ2Uuc3VjY2Vzc2Z1bCkge1xyXG4gICAgICAgICAgICBjYWxsYmFjay5yZXNvbHZlKG1lc3NhZ2UucmVzcG9uc2UpO1xyXG4gICAgICAgIH0gZWxzZSB7XHJcbiAgICAgICAgICAgIGNhbGxiYWNrLnJlamVjdChtZXNzYWdlLnJlc3BvbnNlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVDYWxsKG1ldGhvZE5hbWU6IHN0cmluZywgYXJnczogYW55W10pOiBUUmVxdWVzdE1lc3NhZ2Uge1xyXG4gICAgICAgIHJldHVybiA8VFJlcXVlc3RNZXNzYWdlPiB7XHJcbiAgICAgICAgICAgIGlkOiB0aGlzLl9jcmVhdGVLZXlIYW5kbGVyKCksXHJcbiAgICAgICAgICAgIG1ldGhvZE5hbWUsXHJcbiAgICAgICAgICAgIG1ldGhvZEFyZ3VtZW50czogYXJnc1xyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVTdWNjZXNzZnVsUmVzcG9uc2UobWVzc2FnZTogVFJlcXVlc3RNZXNzYWdlLCByZXNwb25zZTogYW55KTogVFJlc3BvbnNlTWVzc2FnZSB7XHJcbiAgICAgICAgcmV0dXJuIDxUUmVzcG9uc2VNZXNzYWdlPiB7XHJcbiAgICAgICAgICAgIGlkOiBtZXNzYWdlLmlkLFxyXG4gICAgICAgICAgICByZXNwb25zZSxcclxuICAgICAgICAgICAgc3VjY2Vzc2Z1bDogdHJ1ZVxyXG4gICAgICAgIH07XHJcbiAgICB9XHJcblxyXG4gICAgcHJpdmF0ZSBjcmVhdGVFcnJvclJlc3BvbnNlKG1lc3NhZ2U6IFRSZXF1ZXN0TWVzc2FnZSwgcmVzcG9uc2U6IGFueSk6IFRSZXNwb25zZU1lc3NhZ2Uge1xyXG4gICAgICAgIHJldHVybiA8VFJlc3BvbnNlTWVzc2FnZT4ge1xyXG4gICAgICAgICAgICBpZDogbWVzc2FnZS5pZCxcclxuICAgICAgICAgICAgcmVzcG9uc2UsXHJcbiAgICAgICAgICAgIHN1Y2Nlc3NmdWw6IGZhbHNlXHJcbiAgICAgICAgfTtcclxuICAgIH1cclxuXHJcbn0iLCJpbXBvcnQgeyBScGMgfSBmcm9tIFwiLi9ScGNcIjtcclxuaW1wb3J0IHsgUmVxdWVzdE1lc3NhZ2UgfSBmcm9tIFwiLi9SZXF1ZXN0TWVzc2FnZVwiO1xyXG5pbXBvcnQgeyBSZXNwb25zZU1lc3NhZ2UgfSBmcm9tIFwiLi9SZXNwb25zZU1lc3NhZ2VcIjtcclxuaW1wb3J0ICogYXMgZ3VpZCBmcm9tICd1dWlkL3Y0JztcclxuaW1wb3J0IHsgSU1lc3NhZ2UgfSBmcm9tIFwiLi9JTWVzc2FnZVwiO1xyXG5pbXBvcnQgeyBJUmVzcG9uc2VNZXNzYWdlIH0gZnJvbSBcIi4vSVJlc3BvbnNlTWVzc2FnZVwiO1xyXG5pbXBvcnQgeyBJUmVxdWVzdE1lc3NhZ2UgfSBmcm9tIFwiLi9JUmVxdWVzdE1lc3NhZ2VcIjtcclxuXHJcblxyXG5leHBvcnQgY2xhc3MgV2ViU29ja2V0UnBjIHtcclxuICAgIHByaXZhdGUgX3JwYzogUnBjPFJlc3BvbnNlTWVzc2FnZSwgUmVxdWVzdE1lc3NhZ2U+O1xyXG4gICAgcHJpdmF0ZSBfd3M6IFdlYlNvY2tldDtcclxuXHJcbiAgICBjb25zdHJ1Y3Rvcihwcml2YXRlIF91cmw6IHN0cmluZykge1xyXG4gICAgfVxyXG5cclxuICAgIHN0YXJ0KCkge1xyXG4gICAgICAgIHRoaXMuX3dzID0gbmV3IFdlYlNvY2tldCh0aGlzLl91cmwpO1xyXG4gICAgICAgIHRoaXMuX3dzLm9ubWVzc2FnZSA9IChldnQpID0+IHtcclxuICAgICAgICAgICAgaWYgKHR5cGVvZiBldnQuZGF0YSA9PT0gJ3N0cmluZycpIHtcclxuICAgICAgICAgICAgICAgIHRoaXMub25SZWNlaXZlKEpTT04ucGFyc2UoZXZ0LmRhdGEpKTtcclxuICAgICAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgICAgIHRoaXMub25SZWNlaXZlKGV2dC5kYXRhKTtcclxuICAgICAgICAgICAgfVxyXG4gICAgICAgIH1cclxuXHJcbiAgICAgICAgdGhpcy5fcnBjID0gbmV3IFJwYzxSZXNwb25zZU1lc3NhZ2UsIFJlcXVlc3RNZXNzYWdlPigobSkgPT4gdGhpcy5zZW5kKG0pLCAoKSA9PiBndWlkKCkpXHJcbiAgICAgICAgdGhpcy5fcnBjLnJlZ2lzdGVyTWV0aG9kKHRoaXMsICdnZXRCJywgdGhpcy5nZXRCKTtcclxuICAgIH1cclxuXHJcbiAgICBzZW5kKGRhdGE6IGFueSk6IFByb21pc2U8dm9pZD4ge1xyXG4gICAgICAgIHRoaXMuX3dzLnNlbmQoSlNPTi5zdHJpbmdpZnkoZGF0YSkpO1xyXG4gICAgICAgIHJldHVybiBuZXcgUHJvbWlzZTx2b2lkPigocmVzb2x2ZSwgXykgPT4gcmVzb2x2ZSgpKTtcclxuICAgIH1cclxuXHJcbiAgICBvblJlY2VpdmUoZGF0YTogYW55KSB7XHJcbiAgICAgICAgaWYgKGRhdGFbJ3Jlc3BvbnNlJ10pIHtcclxuICAgICAgICAgICAgdGhpcy5fcnBjLnByb2Nlc3NSZXNwb25zZU1lc3NhZ2UoZGF0YSBhcyBJUmVzcG9uc2VNZXNzYWdlKTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICB0aGlzLl9ycGMucHJvY2Vzc1JlcXVlc3RNZXNzYWdlKGRhdGEgYXMgSVJlcXVlc3RNZXNzYWdlKTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcblxyXG4gICAgY2FsbChtZXRob2ROYW1lOiBzdHJpbmcsIGFyZ3M6IGFueVtdKTogUHJvbWlzZTxhbnk+IHtcclxuICAgICAgICByZXR1cm4gdGhpcy5fcnBjLmNhbGwobWV0aG9kTmFtZSwgYXJncyk7XHJcbiAgICB9XHJcblxyXG4gICAgZ2V0QigpIHtcclxuICAgICAgICByZXR1cm4gcGFyc2VJbnQoKGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKCdiLWlucHV0JykgYXMgSFRNTElucHV0RWxlbWVudCkudmFsdWUpO1xyXG4gICAgfVxyXG59XHJcblxyXG53aW5kb3dbJ1dlYlNvY2tldFJwYyddID0gV2ViU29ja2V0UnBjOyIsIi8qKlxuICogQ29udmVydCBhcnJheSBvZiAxNiBieXRlIHZhbHVlcyB0byBVVUlEIHN0cmluZyBmb3JtYXQgb2YgdGhlIGZvcm06XG4gKiBYWFhYWFhYWC1YWFhYLVhYWFgtWFhYWC1YWFhYWFhYWFhYWFhcbiAqL1xudmFyIGJ5dGVUb0hleCA9IFtdO1xuZm9yICh2YXIgaSA9IDA7IGkgPCAyNTY7ICsraSkge1xuICBieXRlVG9IZXhbaV0gPSAoaSArIDB4MTAwKS50b1N0cmluZygxNikuc3Vic3RyKDEpO1xufVxuXG5mdW5jdGlvbiBieXRlc1RvVXVpZChidWYsIG9mZnNldCkge1xuICB2YXIgaSA9IG9mZnNldCB8fCAwO1xuICB2YXIgYnRoID0gYnl0ZVRvSGV4O1xuICByZXR1cm4gYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArICctJyArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gKyAnLScgK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dICsgJy0nICtcbiAgICAgICAgICBidGhbYnVmW2krK11dICsgYnRoW2J1ZltpKytdXSArXG4gICAgICAgICAgYnRoW2J1ZltpKytdXSArIGJ0aFtidWZbaSsrXV0gK1xuICAgICAgICAgIGJ0aFtidWZbaSsrXV0gKyBidGhbYnVmW2krK11dO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IGJ5dGVzVG9VdWlkO1xuIiwiLy8gVW5pcXVlIElEIGNyZWF0aW9uIHJlcXVpcmVzIGEgaGlnaCBxdWFsaXR5IHJhbmRvbSAjIGdlbmVyYXRvci4gIEluIHRoZVxuLy8gYnJvd3NlciB0aGlzIGlzIGEgbGl0dGxlIGNvbXBsaWNhdGVkIGR1ZSB0byB1bmtub3duIHF1YWxpdHkgb2YgTWF0aC5yYW5kb20oKVxuLy8gYW5kIGluY29uc2lzdGVudCBzdXBwb3J0IGZvciB0aGUgYGNyeXB0b2AgQVBJLiAgV2UgZG8gdGhlIGJlc3Qgd2UgY2FuIHZpYVxuLy8gZmVhdHVyZS1kZXRlY3Rpb25cblxuLy8gZ2V0UmFuZG9tVmFsdWVzIG5lZWRzIHRvIGJlIGludm9rZWQgaW4gYSBjb250ZXh0IHdoZXJlIFwidGhpc1wiIGlzIGEgQ3J5cHRvIGltcGxlbWVudGF0aW9uLlxudmFyIGdldFJhbmRvbVZhbHVlcyA9ICh0eXBlb2YoY3J5cHRvKSAhPSAndW5kZWZpbmVkJyAmJiBjcnlwdG8uZ2V0UmFuZG9tVmFsdWVzLmJpbmQoY3J5cHRvKSkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAodHlwZW9mKG1zQ3J5cHRvKSAhPSAndW5kZWZpbmVkJyAmJiBtc0NyeXB0by5nZXRSYW5kb21WYWx1ZXMuYmluZChtc0NyeXB0bykpO1xuaWYgKGdldFJhbmRvbVZhbHVlcykge1xuICAvLyBXSEFUV0cgY3J5cHRvIFJORyAtIGh0dHA6Ly93aWtpLndoYXR3Zy5vcmcvd2lraS9DcnlwdG9cbiAgdmFyIHJuZHM4ID0gbmV3IFVpbnQ4QXJyYXkoMTYpOyAvLyBlc2xpbnQtZGlzYWJsZS1saW5lIG5vLXVuZGVmXG5cbiAgbW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiB3aGF0d2dSTkcoKSB7XG4gICAgZ2V0UmFuZG9tVmFsdWVzKHJuZHM4KTtcbiAgICByZXR1cm4gcm5kczg7XG4gIH07XG59IGVsc2Uge1xuICAvLyBNYXRoLnJhbmRvbSgpLWJhc2VkIChSTkcpXG4gIC8vXG4gIC8vIElmIGFsbCBlbHNlIGZhaWxzLCB1c2UgTWF0aC5yYW5kb20oKS4gIEl0J3MgZmFzdCwgYnV0IGlzIG9mIHVuc3BlY2lmaWVkXG4gIC8vIHF1YWxpdHkuXG4gIHZhciBybmRzID0gbmV3IEFycmF5KDE2KTtcblxuICBtb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIG1hdGhSTkcoKSB7XG4gICAgZm9yICh2YXIgaSA9IDAsIHI7IGkgPCAxNjsgaSsrKSB7XG4gICAgICBpZiAoKGkgJiAweDAzKSA9PT0gMCkgciA9IE1hdGgucmFuZG9tKCkgKiAweDEwMDAwMDAwMDtcbiAgICAgIHJuZHNbaV0gPSByID4+PiAoKGkgJiAweDAzKSA8PCAzKSAmIDB4ZmY7XG4gICAgfVxuXG4gICAgcmV0dXJuIHJuZHM7XG4gIH07XG59XG4iLCJ2YXIgcm5nID0gcmVxdWlyZSgnLi9saWIvcm5nJyk7XG52YXIgYnl0ZXNUb1V1aWQgPSByZXF1aXJlKCcuL2xpYi9ieXRlc1RvVXVpZCcpO1xuXG5mdW5jdGlvbiB2NChvcHRpb25zLCBidWYsIG9mZnNldCkge1xuICB2YXIgaSA9IGJ1ZiAmJiBvZmZzZXQgfHwgMDtcblxuICBpZiAodHlwZW9mKG9wdGlvbnMpID09ICdzdHJpbmcnKSB7XG4gICAgYnVmID0gb3B0aW9ucyA9PT0gJ2JpbmFyeScgPyBuZXcgQXJyYXkoMTYpIDogbnVsbDtcbiAgICBvcHRpb25zID0gbnVsbDtcbiAgfVxuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICB2YXIgcm5kcyA9IG9wdGlvbnMucmFuZG9tIHx8IChvcHRpb25zLnJuZyB8fCBybmcpKCk7XG5cbiAgLy8gUGVyIDQuNCwgc2V0IGJpdHMgZm9yIHZlcnNpb24gYW5kIGBjbG9ja19zZXFfaGlfYW5kX3Jlc2VydmVkYFxuICBybmRzWzZdID0gKHJuZHNbNl0gJiAweDBmKSB8IDB4NDA7XG4gIHJuZHNbOF0gPSAocm5kc1s4XSAmIDB4M2YpIHwgMHg4MDtcblxuICAvLyBDb3B5IGJ5dGVzIHRvIGJ1ZmZlciwgaWYgcHJvdmlkZWRcbiAgaWYgKGJ1Zikge1xuICAgIGZvciAodmFyIGlpID0gMDsgaWkgPCAxNjsgKytpaSkge1xuICAgICAgYnVmW2kgKyBpaV0gPSBybmRzW2lpXTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gYnVmIHx8IGJ5dGVzVG9VdWlkKHJuZHMpO1xufVxuXG5tb2R1bGUuZXhwb3J0cyA9IHY0O1xuIl0sInNvdXJjZVJvb3QiOiIifQ==