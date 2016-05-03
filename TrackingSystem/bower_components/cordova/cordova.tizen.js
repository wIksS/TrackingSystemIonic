// Platform: tizen
// 3.0.0-0-ge670de9
/*
 Licensed to the Apache Software Foundation (ASF) under one
 or more contributor license agreements.  See the NOTICE file
 distributed with this work for additional information
 regarding copyright ownership.  The ASF licenses this file
 to you under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance
 with the License.  You may obtain a copy of the License at
 
     http://www.apache.org/licenses/LICENSE-2.0
 
 Unless required by applicable law or agreed to in writing,
 software distributed under the License is distributed on an
 "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 KIND, either express or implied.  See the License for the
 specific language governing permissions and limitations
 under the License.
*/
;(function() {
var CORDOVA_JS_BUILD_LABEL = '3.0.0-0-ge670de9';
// file: lib/scripts/require.js

var require,
    define;

(function () {
    var modules = {},
    // Stack of moduleIds currently being built.
        requireStack = [],
    // Map of module ID -> index into requireStack of modules currently being built.
        inProgressModules = {},
        SEPERATOR = ".";



    function build(module) {
        var factory = module.factory,
            localRequire = function (id) {
                var resultantId = id;
                //Its a relative path, so lop off the last portion and add the id (minus "./")
                if (id.charAt(0) === ".") {
                    resultantId = module.id.slice(0, module.id.lastIndexOf(SEPERATOR)) + SEPERATOR + id.slice(2);
                }
                return require(resultantId);
            };
        module.exports = {};
        delete module.factory;
        factory(localRequire, module.exports, module);
        return module.exports;
    }

    require = function (id) {
        if (!modules[id]) {
            throw "module " + id + " not found";
        } else if (id in inProgressModules) {
            var cycle = requireStack.slice(inProgressModules[id]).join('->') + '->' + id;
            throw "Cycle in require graph: " + cycle;
        }
        if (modules[id].factory) {
            try {
                inProgressModules[id] = requireStack.length;
                requireStack.push(id);
                return build(modules[id]);
            } finally {
                delete inProgressModules[id];
                requireStack.pop();
            }
        }
        return modules[id].exports;
    };

    define = function (id, factory) {
        if (modules[id]) {
            throw "module " + id + " already defined";
        }

        modules[id] = {
            id: id,
            factory: factory
        };
    };

    define.remove = function (id) {
        delete modules[id];
    };

    define.moduleMap = modules;
})();

//Export for use in node
if (typeof module === "object" && typeof require === "function") {
    module.exports.require = require;
    module.exports.define = define;
}

// file: lib/cordova.js
define("cordova", function(require, exports, module) {


var channel = require('cordova/channel');

/**
 * Listen for DOMContentLoaded and notify our channel subscribers.
 */
document.addEventListener('DOMContentLoaded', function() {
    channel.onDOMContentLoaded.fire();
}, false);
if (document.readyState == 'complete' || document.readyState == 'interactive') {
    channel.onDOMContentLoaded.fire();
}

/**
 * Intercept calls to addEventListener + removeEventListener and handle deviceready,
 * resume, and pause events.
 */
var m_document_addEventListener = document.addEventListener;
var m_document_removeEventListener = document.removeEventListener;
var m_window_addEventListener = window.addEventListener;
var m_window_removeEventListener = window.removeEventListener;

/**
 * Houses custom event handlers to intercept on document + window event listeners.
 */
var documentEventHandlers = {},
    windowEventHandlers = {};

document.addEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    if (typeof documentEventHandlers[e] != 'undefined') {
        documentEventHandlers[e].subscribe(handler);
    } else {
        m_document_addEventListener.call(document, evt, handler, capture);
    }
};

window.addEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    if (typeof windowEventHandlers[e] != 'undefined') {
        windowEventHandlers[e].subscribe(handler);
    } else {
        m_window_addEventListener.call(window, evt, handler, capture);
    }
};

document.removeEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    // If unsubscribing from an event that is handled by a plugin
    if (typeof documentEventHandlers[e] != "undefined") {
        documentEventHandlers[e].unsubscribe(handler);
    } else {
        m_document_removeEventListener.call(document, evt, handler, capture);
    }
};

window.removeEventListener = function(evt, handler, capture) {
    var e = evt.toLowerCase();
    // If unsubscribing from an event that is handled by a plugin
    if (typeof windowEventHandlers[e] != "undefined") {
        windowEventHandlers[e].unsubscribe(handler);
    } else {
        m_window_removeEventListener.call(window, evt, handler, capture);
    }
};

function createEvent(type, data) {
    var event = document.createEvent('Events');
    event.initEvent(type, false, false);
    if (data) {
        for (var i in data) {
            if (data.hasOwnProperty(i)) {
                event[i] = data[i];
            }
        }
    }
    return event;
}

if(typeof window.console === "undefined") {
    window.console = {
        log:function(){}
    };
}
// there are places in the framework where we call `warn` also, so we should make sure it exists
if(typeof window.console.warn === "undefined") {
    window.console.warn = function(msg) {
        this.log("warn: " + msg);
    }
}

var cordova = {
    define:define,
    require:require,
    /**
     * Methods to add/remove your own addEventListener hijacking on document + window.
     */
    addWindowEventHandler:function(event) {
        return (windowEventHandlers[event] = channel.create(event));
    },
    addStickyDocumentEventHandler:function(event) {
        return (documentEventHandlers[event] = channel.createSticky(event));
    },
    addDocumentEventHandler:function(event) {
        return (documentEventHandlers[event] = channel.create(event));
    },
    removeWindowEventHandler:function(event) {
        delete windowEventHandlers[event];
    },
    removeDocumentEventHandler:function(event) {
        delete documentEventHandlers[event];
    },
    /**
     * Retrieve original event handlers that were replaced by Cordova
     *
     * @return object
     */
    getOriginalHandlers: function() {
        return {'document': {'addEventListener': m_document_addEventListener, 'removeEventListener': m_document_removeEventListener},
        'window': {'addEventListener': m_window_addEventListener, 'removeEventListener': m_window_removeEventListener}};
    },
    /**
     * Method to fire event from native code
     * bNoDetach is required for events which cause an exception which needs to be caught in native code
     */
    fireDocumentEvent: function(type, data, bNoDetach) {
        var evt = createEvent(type, data);
        if (typeof documentEventHandlers[type] != 'undefined') {
            if( bNoDetach ) {
              documentEventHandlers[type].fire(evt);
            }
            else {
              setTimeout(function() {
                  // Fire deviceready on listeners that were registered before cordova.js was loaded.
                  if (type == 'deviceready') {
                      document.dispatchEvent(evt);
                  }
                  documentEventHandlers[type].fire(evt);
              }, 0);
            }
        } else {
            document.dispatchEvent(evt);
        }
    },
    fireWindowEvent: function(type, data) {
        var evt = createEvent(type,data);
        if (typeof windowEventHandlers[type] != 'undefined') {
            setTimeout(function() {
                windowEventHandlers[type].fire(evt);
            }, 0);
        } else {
            window.dispatchEvent(evt);
        }
    },

    /**
     * Plugin callback mechanism.
     */
    // Randomize the starting callbackId to avoid collisions after refreshing or navigating.
    // This way, it's very unlikely that any new callback would get the same callbackId as an old callback.
    callbackId: Math.floor(Math.random() * 2000000000),
    callbacks:  {},
    callbackStatus: {
        NO_RESULT: 0,
        OK: 1,
        CLASS_NOT_FOUND_EXCEPTION: 2,
        ILLEGAL_ACCESS_EXCEPTION: 3,
        INSTANTIATION_EXCEPTION: 4,
        MALFORMED_URL_EXCEPTION: 5,
        IO_EXCEPTION: 6,
        INVALID_ACTION: 7,
        JSON_EXCEPTION: 8,
        ERROR: 9
    },

    /**
     * Called by native code when returning successful result from an action.
     */
    callbackSuccess: function(callbackId, args) {
        try {
            cordova.callbackFromNative(callbackId, true, args.status, [args.message], args.keepCallback);
        } catch (e) {
            console.log("Error in error callback: " + callbackId + " = "+e);
        }
    },

    /**
     * Called by native code when returning error result from an action.
     */
    callbackError: function(callbackId, args) {
        // TODO: Deprecate callbackSuccess and callbackError in favour of callbackFromNative.
        // Derive success from status.
        try {
            cordova.callbackFromNative(callbackId, false, args.status, [args.message], args.keepCallback);
        } catch (e) {
            console.log("Error in error callback: " + callbackId + " = "+e);
        }
    },

    /**
     * Called by native code when returning the result from an action.
     */
    callbackFromNative: function(callbackId, success, status, args, keepCallback) {
        var callback = cordova.callbacks[callbackId];
        if (callback) {
            if (success && status == cordova.callbackStatus.OK) {
                callback.success && callback.success.apply(null, args);
            } else if (!success) {
                callback.fail && callback.fail.apply(null, args);
            }

            // Clear callback if not expecting any more results
            if (!keepCallback) {
                delete cordova.callbacks[callbackId];
            }
        }
    },
    addConstructor: function(func) {
        channel.onCordovaReady.subscribe(function() {
            try {
                func();
            } catch(e) {
                console.log("Failed to run constructor: " + e);
            }
        });
    }
};

// Register pause, resume and deviceready channels as events on document.
channel.onPause = cordova.addDocumentEventHandler('pause');
channel.onResume = cordova.addDocumentEventHandler('resume');
channel.onDeviceReady = cordova.addStickyDocumentEventHandler('deviceready');

module.exports = cordova;

});

// file: lib/common/argscheck.js
define("cordova/argscheck", function(require, exports, module) {

var exec = require('cordova/exec');
var utils = require('cordova/utils');

var moduleExports = module.exports;

var typeMap = {
    'A': 'Array',
    'D': 'Date',
    'N': 'Number',
    'S': 'String',
    'F': 'Function',
    'O': 'Object'
};

function extractParamName(callee, argIndex) {
  return (/.*?\((.*?)\)/).exec(callee)[1].split(', ')[argIndex];
}

function checkArgs(spec, functionName, args, opt_callee) {
    if (!moduleExports.enableChecks) {
        return;
    }
    var errMsg = null;
    var typeName;
    for (var i = 0; i < spec.length; ++i) {
        var c = spec.charAt(i),
            cUpper = c.toUpperCase(),
            arg = args[i];
        // Asterix means allow anything.
        if (c == '*') {
            continue;
        }
        typeName = utils.typeName(arg);
        if ((arg === null || arg === undefined) && c == cUpper) {
            continue;
        }
        if (typeName != typeMap[cUpper]) {
            errMsg = 'Expected ' + typeMap[cUpper];
            break;
        }
    }
    if (errMsg) {
        errMsg += ', but got ' + typeName + '.';
        errMsg = 'Wrong type for parameter "' + extractParamName(opt_callee || args.callee, i) + '" of ' + functionName + ': ' + errMsg;
        // Don't log when running unit tests.
        if (typeof jasmine == 'undefined') {
            console.error(errMsg);
        }
        throw TypeError(errMsg);
    }
}

function getValue(value, defaultValue) {
    return value === undefined ? defaultValue : value;
}

moduleExports.checkArgs = checkArgs;
moduleExports.getValue = getValue;
moduleExports.enableChecks = true;


});

// file: lib/common/base64.js
define("cordova/base64", function(require, exports, module) {

var base64 = exports;

base64.fromArrayBuffer = function(arrayBuffer) {
  var array = new Uint8Array(arrayBuffer);
  return uint8ToBase64(array);
};

//------------------------------------------------------------------------------

/* This code is based on the performance tests at http://jsperf.com/b64tests
 * This 12-bit-at-a-time algorithm was the best performing version on all
 * platforms tested.
 */

var b64_6bit = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
var b64_12bit;

var b64_12bitTable = function() {
    b64_12bit = [];
    for (var i=0; i<64; i++) {
        for (var j=0; j<64; j++) {
            b64_12bit[i*64+j] = b64_6bit[i] + b64_6bit[j];
        }
    }
    b64_12bitTable = function() { return b64_12bit; };
    return b64_12bit;
}

function uint8ToBase64(rawData) {
    var numBytes = rawData.byteLength;
    var output="";
    var segment;
    var table = b64_12bitTable();
    for (var i=0;i<numBytes-2;i+=3) {
        segment = (rawData[i] << 16) + (rawData[i+1] << 8) + rawData[i+2];
        output += table[segment >> 12];
        output += table[segment & 0xfff];
    }
    if (numBytes - i == 2) {
        segment = (rawData[i] << 16) + (rawData[i+1] << 8);
        output += table[segment >> 12];
        output += b64_6bit[(segment & 0xfff) >> 6];
        output += '=';
    } else if (numBytes - i == 1) {
        segment = (rawData[i] << 16);
        output += table[segment >> 12];
        output += '==';
    }
    return output;
}

});

// file: lib/common/builder.js
define("cordova/builder", function(require, exports, module) {

var utils = require('cordova/utils');

function each(objects, func, context) {
    for (var prop in objects) {
        if (objects.hasOwnProperty(prop)) {
            func.apply(context, [objects[prop], prop]);
        }
    }
}

function clobber(obj, key, value) {
    exports.replaceHookForTesting(obj, key);
    obj[key] = value;
    // Getters can only be overridden by getters.
    if (obj[key] !== value) {
        utils.defineGetter(obj, key, function() {
            return value;
        });
    }
}

function assignOrWrapInDeprecateGetter(obj, key, value, message) {
    if (message) {
        utils.defineGetter(obj, key, function() {
            console.log(message);
            delete obj[key];
            clobber(obj, key, value);
            return value;
        });
    } else {
        clobber(obj, key, value);
    }
}

function include(parent, objects, clobber, merge) {
    each(objects, function (obj, key) {
        try {
          var result = obj.path ? require(obj.path) : {};

          if (clobber) {
              // Clobber if it doesn't exist.
              if (typeof parent[key] === 'undefined') {
                  assignOrWrapInDeprecateGetter(parent, key, result, obj.deprecated);
              } else if (typeof obj.path !== 'undefined') {
                  // If merging, merge properties onto parent, otherwise, clobber.
                  if (merge) {
                      recursiveMerge(parent[key], result);
                  } else {
                      assignOrWrapInDeprecateGetter(parent, key, result, obj.deprecated);
                  }
              }
              result = parent[key];
          } else {
            // Overwrite if not currently defined.
            if (typeof parent[key] == 'undefined') {
              assignOrWrapInDeprecateGetter(parent, key, result, obj.deprecated);
            } else {
              // Set result to what already exists, so we can build children into it if they exist.
              result = parent[key];
            }
          }

          if (obj.children) {
            include(result, obj.children, clobber, merge);
          }
        } catch(e) {
          utils.alert('Exception building cordova JS globals: ' + e + ' for key "' + key + '"');
        }
    });
}

/**
 * Merge properties from one object onto another recursively.  Properties from
 * the src object will overwrite existing target property.
 *
 * @param target Object to merge properties into.
 * @param src Object to merge properties from.
 */
function recursiveMerge(target, src) {
    for (var prop in src) {
        if (src.hasOwnProperty(prop)) {
            if (target.prototype && target.prototype.constructor === target) {
                // If the target object is a constructor override off prototype.
                clobber(target.prototype, prop, src[prop]);
            } else {
                if (typeof src[prop] === 'object' && typeof target[prop] === 'object') {
                    recursiveMerge(target[prop], src[prop]);
                } else {
                    clobber(target, prop, src[prop]);
                }
            }
        }
    }
}

exports.buildIntoButDoNotClobber = function(objects, target) {
    include(target, objects, false, false);
};
exports.buildIntoAndClobber = function(objects, target) {
    include(target, objects, true, false);
};
exports.buildIntoAndMerge = function(objects, target) {
    include(target, objects, true, true);
};
exports.recursiveMerge = recursiveMerge;
exports.assignOrWrapInDeprecateGetter = assignOrWrapInDeprecateGetter;
exports.replaceHookForTesting = function() {};

});

// file: lib/common/channel.js
define("cordova/channel", function(require, exports, module) {

var utils = require('cordova/utils'),
    nextGuid = 1;

/**
 * Custom pub-sub "channel" that can have functions subscribed to it
 * This object is used to define and control firing of events for
 * cordova initialization, as well as for custom events thereafter.
 *
 * The order of events during page load and Cordova startup is as follows:
 *
 * onDOMContentLoaded*         Internal event that is received when the web page is loaded and parsed.
 * onNativeReady*              Internal event that indicates the Cordova native side is ready.
 * onCordovaReady*             Internal event fired when all Cordova JavaScript objects have been created.
 * onDeviceReady*              User event fired to indicate that Cordova is ready
 * onResume                    User event fired to indicate a start/resume lifecycle event
 * onPause                     User event fired to indicate a pause lifecycle event
 * onDestroy*                  Internal event fired when app is being destroyed (User should use window.onunload event, not this one).
 *
 * The events marked with an * are sticky. Once they have fired, they will stay in the fired state.
 * All listeners that subscribe after the event is fired will be executed right away.
 *
 * The only Cordova events that user code should register for are:
 *      deviceready           Cordova native code is initialized and Cordova APIs can be called from JavaScript
 *      pause                 App has moved to background
 *      resume                App has returned to foreground
 *
 * Listeners can be registered as:
 *      document.addEventListener("deviceready", myDeviceReadyListener, false);
 *      document.addEventListener("resume", myResumeListener, false);
 *      document.addEventListener("pause", myPauseListener, false);
 *
 * The DOM lifecycle events should be used for saving and restoring state
 *      window.onload
 *      window.onunload
 *
 */

/**
 * Channel
 * @constructor
 * @param type  String the channel name
 */
var Channel = function(type, sticky) {
    this.type = type;
    // Map of guid -> function.
    this.handlers = {};
    // 0 = Non-sticky, 1 = Sticky non-fired, 2 = Sticky fired.
    this.state = sticky ? 1 : 0;
    // Used in sticky mode to remember args passed to fire().
    this.fireArgs = null;
    // Used by onHasSubscribersChange to know if there are any listeners.
    this.numHandlers = 0;
    // Function that is called when the first listener is subscribed, or when
    // the last listener is unsubscribed.
    this.onHasSubscribersChange = null;
},
    channel = {
        /**
         * Calls the provided function only after all of the channels specified
         * have been fired. All channels must be sticky channels.
         */
        join: function(h, c) {
            var len = c.length,
                i = len,
                f = function() {
                    if (!(--i)) h();
                };
            for (var j=0; j<len; j++) {
                if (c[j].state === 0) {
                    throw Error('Can only use join with sticky channels.');
                }
                c[j].subscribe(f);
            }
            if (!len) h();
        },
        create: function(type) {
            return channel[type] = new Channel(type, false);
        },
        createSticky: function(type) {
            return channel[type] = new Channel(type, true);
        },

        /**
         * cordova Channels that must fire before "deviceready" is fired.
         */
        deviceReadyChannelsArray: [],
        deviceReadyChannelsMap: {},

        /**
         * Indicate that a feature needs to be initialized before it is ready to be used.
         * This holds up Cordova's "deviceready" event until the feature has been initialized
         * and Cordova.initComplete(feature) is called.
         *
         * @param feature {String}     The unique feature name
         */
        waitForInitialization: function(feature) {
            if (feature) {
                var c = channel[feature] || this.createSticky(feature);
                this.deviceReadyChannelsMap[feature] = c;
                this.deviceReadyChannelsArray.push(c);
            }
        },

        /**
         * Indicate that initialization code has completed and the feature is ready to be used.
         *
         * @param feature {String}     The unique feature name
         */
        initializationComplete: function(feature) {
            var c = this.deviceReadyChannelsMap[feature];
            if (c) {
                c.fire();
            }
        }
    };

function forceFunction(f) {
    if (typeof f != 'function') throw "Function required as first argument!";
}

/**
 * Subscribes the given function to the channel. Any time that
 * Channel.fire is called so too will the function.
 * Optionally specify an execution context for the function
 * and a guid that can be used to stop subscribing to the channel.
 * Returns the guid.
 */
Channel.prototype.subscribe = function(f, c) {
    // need a function to call
    forceFunction(f);
    if (this.state == 2) {
        f.apply(c || this, this.fireArgs);
        return;
    }

    var func = f,
        guid = f.observer_guid;
    if (typeof c == "object") { func = utils.close(c, f); }

    if (!guid) {
        // first time any channel has seen this subscriber
        guid = '' + nextGuid++;
    }
    func.observer_guid = guid;
    f.observer_guid = guid;

    // Don't add the same handler more than once.
    if (!this.handlers[guid]) {
        this.handlers[guid] = func;
        this.numHandlers++;
        if (this.numHandlers == 1) {
            this.onHasSubscribersChange && this.onHasSubscribersChange();
        }
    }
};

/**
 * Unsubscribes the function with the given guid from the channel.
 */
Channel.prototype.unsubscribe = function(f) {
    // need a function to unsubscribe
    forceFunction(f);

    var guid = f.observer_guid,
        handler = this.handlers[guid];
    if (handler) {
        delete this.handlers[guid];
        this.numHandlers--;
        if (this.numHandlers === 0) {
            this.onHasSubscribersChange && this.onHasSubscribersChange();
        }
    }
};

/**
 * Calls all functions subscribed to this channel.
 */
Channel.prototype.fire = function(e) {
    var fail = false,
        fireArgs = Array.prototype.slice.call(arguments);
    // Apply stickiness.
    if (this.state == 1) {
        this.state = 2;
        this.fireArgs = fireArgs;
    }
    if (this.numHandlers) {
        // Copy the values first so that it is safe to modify it from within
        // callbacks.
        var toCall = [];
        for (var item in this.handlers) {
            toCall.push(this.handlers[item]);
        }
        for (var i = 0; i < toCall.length; ++i) {
            toCall[i].apply(this, fireArgs);
        }
        if (this.state == 2 && this.numHandlers) {
            this.numHandlers = 0;
            this.handlers = {};
            this.onHasSubscribersChange && this.onHasSubscribersChange();
        }
    }
};


// defining them here so they are ready super fast!
// DOM event that is received when the web page is loaded and parsed.
channel.createSticky('onDOMContentLoaded');

// Event to indicate the Cordova native side is ready.
channel.createSticky('onNativeReady');

// Event to indicate that all Cordova JavaScript objects have been created
// and it's time to run plugin constructors.
channel.createSticky('onCordovaReady');

// Event to indicate that all automatically loaded JS plugins are loaded and ready.
channel.createSticky('onPluginsReady');

// Event to indicate that Cordova is ready
channel.createSticky('onDeviceReady');

// Event to indicate a resume lifecycle event
channel.create('onResume');

// Event to indicate a pause lifecycle event
channel.create('onPause');

// Event to indicate a destroy lifecycle event
channel.createSticky('onDestroy');

// Channels that must fire before "deviceready" is fired.
channel.waitForInitialization('onCordovaReady');
channel.waitForInitialization('onDOMContentLoaded');

module.exports = channel;

});

// file: lib/common/commandProxy.js
define("cordova/commandProxy", function(require, exports, module) {


// internal map of proxy function
var CommandProxyMap = {};

module.exports = {

    // example: cordova.commandProxy.add("Accelerometer",{getCurrentAcceleration: function(successCallback, errorCallback, options) {...},...);
    add:function(id,proxyObj) {
        console.log("adding proxy for " + id);
        CommandProxyMap[id] = proxyObj;
        return proxyObj;
    },

    // cordova.commandProxy.remove("Accelerometer");
    remove:function(id) {
        var proxy = CommandProxyMap[id];
        delete CommandProxyMap[id];
        CommandProxyMap[id] = null;
        return proxy;
    },

    get:function(service,action) {
        return ( CommandProxyMap[service] ? CommandProxyMap[service][action] : null );
    }
};
});

// file: lib/tizen/exec.js
define("cordova/exec", function(require, exports, module) {

/**
 * Execute a cordova command.  It is up to the native side whether this action
 * is synchronous or asynchronous.  The native side can return:
 *      Synchronous: PluginResult object as a JSON string
 *      Asynchronous: Empty string ""
 * If async, the native side will cordova.callbackSuccess or cordova.callbackError,
 * depending upon the result of the action.
 *
 * @param {Function} successCB  The success callback
 * @param {Function} failCB     The fail callback
 * @param {String} service      The name of the service to use
 * @param {String} action       Action to be run in cordova
 * @param {String[]} [args]     Zero or more arguments to pass to the method
 */
/**
 * Execute a cordova command.  It is up to the native side whether this action
 * is synchronous or asynchronous.  The native side can return:
 *      Synchronous: PluginResult object as a JSON string
 *      Asynchronous: Empty string ""
 * If async, the native side will cordova.callbackSuccess or cordova.callbackError,
 * depending upon the result of the action.
 *
 * @param {Function} successCB  The success callback
 * @param {Function} failCB     The fail callback
 * @param {String} service      The name of the service to use
 * @param {String} action       Action to be run in cordova
 * @param {String[]} [args]     Zero or more arguments to pass to the method
 */

//console.log("TIZEN EXEC START");


var manager = require('cordova/plugin/tizen/manager'),
    cordova = require('cordova'),
    utils = require('cordova/utils');

//console.log("TIZEN EXEC START bis");

module.exports = function(successCB, failCB, service, action, args) {

    try {
        var v = manager.exec(successCB, failCB, service, action, args);

        // If status is OK, then return value back to caller
        if (v.status == cordova.callbackStatus.OK) {

            // If there is a success callback, then call it now with returned value
            if (successCB) {
                try {
                    successCB(v.message);
                }
                catch (e) {
                    console.log("Error in success callback: "+ service + "." + action + " = " + e);
                }

            }
            return v.message;
        } else if (v.status == cordova.callbackStatus.NO_RESULT) {
            // Nothing to do here
        } else {
            // If error, then display error
            console.log("Error: " + service + "." + action + " Status=" + v.status + " Message=" + v.message);

            // If there is a fail callback, then call it now with returned value
            if (failCB) {
                try {
                    failCB(v.message);
                }
                catch (e) {
                    console.log("Error in error callback: " + service + "." + action + " = "+e);
                }
            }
            return null;
        }
    } catch (e) {
        utils.alert("Error: " + e);
    }
};

//console.log("TIZEN EXEC END ");

/*
var plugins = {
    "Device": require('cordova/plugin/tizen/Device'),
    "NetworkStatus": require('cordova/plugin/tizen/NetworkStatus'),
    "Accelerometer": require('cordova/plugin/tizen/Accelerometer'),
    "Battery": require('cordova/plugin/tizen/Battery'),
    "Compass": require('cordova/plugin/tizen/Compass'),
    //"Capture": require('cordova/plugin/tizen/Capture'), not yet available
    "Camera": require('cordova/plugin/tizen/Camera'),
    "FileTransfer": require('cordova/plugin/tizen/FileTransfer'),
    "Media": require('cordova/plugin/tizen/Media'),
    "Notification": require('cordova/plugin/tizen/Notification')
};

console.log("TIZEN EXEC START");

module.exports = function(success, fail, service, action, args) {
    try {
        console.log("exec: " + service + "." + action);
        plugins[service][action](success, fail, args);
    }
    catch(e) {
        console.log("missing exec: " + service + "." + action);
        console.log(args);
        console.log(e);
        console.log(e.stack);
    }
};

console.log("TIZEN EXEC START");
*/

});

// file: lib/common/modulemapper.js
define("cordova/modulemapper", function(require, exports, module) {

var builder = require('cordova/builder'),
    moduleMap = define.moduleMap,
    symbolList,
    deprecationMap;

exports.reset = function() {
    symbolList = [];
    deprecationMap = {};
};

function addEntry(strategy, moduleName, symbolPath, opt_deprecationMessage) {
    if (!(moduleName in moduleMap)) {
        throw new Error('Module ' + moduleName + ' does not exist.');
    }
    symbolList.push(strategy, moduleName, symbolPath);
    if (opt_deprecationMessage) {
        deprecationMap[symbolPath] = opt_deprecationMessage;
    }
}

// Note: Android 2.3 does have Function.bind().
exports.clobbers = function(moduleName, symbolPath, opt_deprecationMessage) {
    addEntry('c', moduleName, symbolPath, opt_deprecationMessage);
};

exports.merges = function(moduleName, symbolPath, opt_deprecationMessage) {
    addEntry('m', moduleName, symbolPath, opt_deprecationMessage);
};

exports.defaults = function(moduleName, symbolPath, opt_deprecationMessage) {
    addEntry('d', moduleName, symbolPath, opt_deprecationMessage);
};

exports.runs = function(moduleName) {
    addEntry('r', moduleName, null);
};

function prepareNamespace(symbolPath, context) {
    if (!symbolPath) {
        return context;
    }
    var parts = symbolPath.split('.');
    var cur = context;
    for (var i = 0, part; part = parts[i]; ++i) {
        cur = cur[part] = cur[part] || {};
    }
    return cur;
}

exports.mapModules = function(context) {
    var origSymbols = {};
    context.CDV_origSymbols = origSymbols;
    for (var i = 0, len = symbolList.length; i < len; i += 3) {
        var strategy = symbolList[i];
        var moduleName = symbolList[i + 1];
        var module = require(moduleName);
        // <runs/>
        if (strategy == 'r') {
            continue;
        }
        var symbolPath = symbolList[i + 2];
        var lastDot = symbolPath.lastIndexOf('.');
        var namespace = symbolPath.substr(0, lastDot);
        var lastName = symbolPath.substr(lastDot + 1);

        var deprecationMsg = symbolPath in deprecationMap ? 'Access made to deprecated symbol: ' + symbolPath + '. ' + deprecationMsg : null;
        var parentObj = prepareNamespace(namespace, context);
        var target = parentObj[lastName];

        if (strategy == 'm' && target) {
            builder.recursiveMerge(target, module);
        } else if ((strategy == 'd' && !target) || (strategy != 'd')) {
            if (!(symbolPath in origSymbols)) {
                origSymbols[symbolPath] = target;
            }
            builder.assignOrWrapInDeprecateGetter(parentObj, lastName, module, deprecationMsg);
        }
    }
};

exports.getOriginalSymbol = function(context, symbolPath) {
    var origSymbols = context.CDV_origSymbols;
    if (origSymbols && (symbolPath in origSymbols)) {
        return origSymbols[symbolPath];
    }
    var parts = symbolPath.split('.');
    var obj = context;
    for (var i = 0; i < parts.length; ++i) {
        obj = obj && obj[parts[i]];
    }
    return obj;
};

exports.loadMatchingModules = function(matchingRegExp) {
    for (var k in moduleMap) {
        if (matchingRegExp.exec(k)) {
            require(k);
        }
    }
};

exports.reset();


});

// file: lib/tizen/platform.js
define("cordova/platform", function(require, exports, module) {

//console.log("TIZEN PLATFORM START");


module.exports = {
    id: "tizen",
    initialize: function() {

        //console.log("TIZEN PLATFORM initialize start");

        var modulemapper = require('cordova/modulemapper');

        //modulemapper.loadMatchingModules(/cordova.*\/plugininit$/);

        modulemapper.loadMatchingModules(/cordova.*\/symbols$/);

        modulemapper.mapModules(window);

        //console.log("TIZEN PLATFORM initialize end");

    }
};

//console.log("TIZEN PLATFORM START");


});

// file: lib/tizen/plugin/device/symbols.js
define("cordova/plugin/device/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.clobbers('cordova/plugin/tizen/Device', 'device');
modulemapper.merges('cordova/plugin/tizen/Device', 'navigator.device');

});

// file: lib/common/plugin/echo.js
define("cordova/plugin/echo", function(require, exports, module) {

var exec = require('cordova/exec'),
    utils = require('cordova/utils');

/**
 * Sends the given message through exec() to the Echo plugin, which sends it back to the successCallback.
 * @param successCallback  invoked with a FileSystem object
 * @param errorCallback  invoked if error occurs retrieving file system
 * @param message  The string to be echoed.
 * @param forceAsync  Whether to force an async return value (for testing native->js bridge).
 */
module.exports = function(successCallback, errorCallback, message, forceAsync) {
    var action = 'echo';
    var messageIsMultipart = (utils.typeName(message) == "Array");
    var args = messageIsMultipart ? message : [message];

    if (utils.typeName(message) == 'ArrayBuffer') {
        if (forceAsync) {
            console.warn('Cannot echo ArrayBuffer with forced async, falling back to sync.');
        }
        action += 'ArrayBuffer';
    } else if (messageIsMultipart) {
        if (forceAsync) {
            console.warn('Cannot echo MultiPart Array with forced async, falling back to sync.');
        }
        action += 'MultiPart';
    } else if (forceAsync) {
        action += 'Async';
    }

    exec(successCallback, errorCallback, "Echo", action, args);
};


});

// file: lib/tizen/plugin/file/symbols.js
define("cordova/plugin/file/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper'),
    symbolshelper = require('cordova/plugin/file/symbolshelper');

symbolshelper(modulemapper.defaults);
modulemapper.clobbers('cordova/plugin/File', 'File');
modulemapper.clobbers('cordova/plugin/FileReader', 'FileReader');
modulemapper.clobbers('cordova/plugin/FileError', 'FileError');

});

// file: lib/tizen/plugin/globalization/symbols.js
define("cordova/plugin/globalization/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.merges('cordova/plugin/tizen/Globalization', 'navigator.globalization');

});

// file: lib/tizen/plugin/media/symbols.js
define("cordova/plugin/media/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.defaults('cordova/plugin/Media', 'Media');
modulemapper.defaults('cordova/plugin/MediaError', 'MediaError');
modulemapper.merges('cordova/plugin/tizen/MediaError', 'MediaError');

});

// file: lib/tizen/plugin/notification/symbols.js
define("cordova/plugin/notification/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.defaults('cordova/plugin/notification', 'navigator.notification');
modulemapper.merges('cordova/plugin/tizen/Notification', 'navigator.notification');

});

// file: lib/tizen/plugin/splashscreen/symbol.js
define("cordova/plugin/splashscreen/symbol", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.merges('cordova/plugin/tizen/SplashScreen', 'splashscreen'); /// is that correct???  PPL

});

// file: lib/tizen/plugin/tizen/Accelerometer.js
define("cordova/plugin/tizen/Accelerometer", function(require, exports, module) {

var accelerometerCallback = null;

//console.log("TIZEN ACCELEROMETER START");

module.exports = {

    start: function (successCallback, errorCallback) {

        if (accelerometerCallback) {
            window.removeEventListener("devicemotion", accelerometerCallback, true);
        }

        accelerometerCallback = function (motion) {
            successCallback({
                x: motion.accelerationIncludingGravity.x,
                y: motion.accelerationIncludingGravity.y,
                z: motion.accelerationIncludingGravity.z,
                timestamp: new Date().getTime()
            });
        };
        window.addEventListener("devicemotion", accelerometerCallback, true);
    },

    stop: function (successCallback, errorCallback) {
        window.removeEventListener("devicemotion", accelerometerCallback, true);
        accelerometerCallback = null;
    }
};

//console.log("TIZEN ACCELEROMETER END");


});

// file: lib/tizen/plugin/tizen/Battery.js
define("cordova/plugin/tizen/Battery", function(require, exports, module) {

/*global tizen:false */
var batteryListenerId = null;

//console.log("TIZEN BATTERY START");

module.exports = {
    start: function(successCallback, errorCallback) {
        var batterySuccessCallback = function(power) {
            if (successCallback) {
                successCallback({level: Math.round(power.level * 100), isPlugged: power.isCharging});
            }
        };

        if (batteryListenerId === null) {
            batteryListenerId = tizen.systeminfo.addPropertyValueChangeListener("BATTERY", batterySuccessCallback);
        }

        tizen.systeminfo.getPropertyValue("BATTERY", batterySuccessCallback, errorCallback);
    },

    stop: function(successCallback, errorCallback) {
        tizen.systeminfo.removePropertyValueChangeListener(batteryListenerId);
        batteryListenerId = null;
    }
};

//console.log("TIZEN BATTERY END");

});

// file: lib/tizen/plugin/tizen/BufferLoader.js
define("cordova/plugin/tizen/BufferLoader", function(require, exports, module) {

/*
 * Buffer Loader Object
 * This class provides a sound buffer for one or more sounds
 * held in a local file located by an url
 *
 * uses W3C  Web Audio API
 *
 * @constructor
 *
 * @param {AudioContext} audio context object
 * @param {Array} urlList, array of url for sound to load
 * @param {function} callback , called after buffer was loaded
 *
 */

function BufferLoader(context, urlList, callback) {
    this.context = context;
    this.urlList = urlList;
    this.onload = callback;
    this.bufferList = [];
    this.loadCount = 0;
}

/*
 * This method loads a sound into a buffer
 * @param {Array} urlList, array of url for sound to load
 * @param {Number} index, buffer index in the array where to load the url sound
 *
 */

BufferLoader.prototype.loadBuffer = function(url, index) {
    // Load buffer asynchronously
    var request = null,
        loader = null;

    request = new XMLHttpRequest();

    if (request === null) {
        console.log ("BufferLoader.prototype.loadBuffer, cannot allocate XML http request");
        return;
    }

    request.open("GET", url, true);
    request.responseType = "arraybuffer";

    loader = this;

    request.onload = function() {
    // Asynchronously decode the audio file data in request.response
    loader.context.decodeAudioData(
        request.response,
        function(buffer) {
                if (!buffer) {
                    console.log ("BufferLoader.prototype.loadBuffer,error decoding file data: " + url);
                    return;
                }

                loader.bufferList[index] = buffer;

                if (++loader.loadCount == loader.urlList.length) {
                    loader.onload(loader.bufferList);
                }
            }
        );
    };

    request.onerror = function() {
        console.log ("BufferLoader.prototype.loadBuffer, XHR error");
    };

    request.send();
};

/*
 * This method loads all sounds identified by their url
 * and that where given to the object constructor
 *
 */

BufferLoader.prototype.load = function() {
    for (var i = 0; i < this.urlList.length; ++i) {
        this.loadBuffer(this.urlList[i], i);
    }
};

module.exports = BufferLoader;

});

// file: lib/tizen/plugin/tizen/Camera.js
define("cordova/plugin/tizen/Camera", function(require, exports, module) {

/*global tizen:false */
var Camera = require('cordova/plugin/CameraConstants');


//console.log("TIZEN CAMERA START");

function cameraMakeReplyCallback(successCallback, errorCallback) {
    return {
        onsuccess: function(reply) {
            if (reply.length > 0) {
                successCallback(reply[0].value);
            }
            else {
                errorCallback('Picture selection aborted');
            }
        },
        onfail: function() {
           console.log('The service launch failed');
        }
    };
}

module.exports = {
    takePicture: function(successCallback, errorCallback, args) {
        var destinationType = args[1],
            sourceType = args[2],
            encodingType = args[5],
            mediaType = args[6];

            // Not supported
            /*
            quality = args[0]
            targetWidth = args[3]
            targetHeight = args[4]
            allowEdit = args[7]
            correctOrientation = args[8]
            saveToPhotoAlbum = args[9]
            */

            if (destinationType !== Camera.DestinationType.FILE_URI) {
                errorCallback('DestinationType not supported');
                return;
            }

            if (mediaType !== Camera.MediaType.PICTURE) {
                errorCallback('MediaType not supported');
                return;
            }

            var mimeType;
            if (encodingType === Camera.EncodingType.JPEG) {
                mimeType = 'image/jpeg';
            }
            else if (encodingType === Camera.EncodingType.PNG) {
                mimeType = 'image/png';
            }
            else {
                mimeType = 'image/*';
            }

            var serviceId;
            if (sourceType === Camera.PictureSourceType.CAMERA) {
                serviceId = 'http://tizen.org/appcontrol/operation/create_content';
            }
            else {
                serviceId = 'http://tizen.org/appcontrol/operation/pick';
            }

            var serviceControl = new tizen.ApplicationControl(
                                serviceId,
                                null,
                                mimeType,
                                null);

            tizen.application.launchAppControl(
                    serviceControl,
                    null,
                    null,
                    function(error) {
                        errorCallback(error.message);
                    },
                    cameraMakeReplyCallback(successCallback, errorCallback)
            );
        }
};

//console.log("TIZEN CAMERA END");

});

// file: lib/tizen/plugin/tizen/Compass.js
define("cordova/plugin/tizen/Compass", function(require, exports, module) {

var CompassError = require('cordova/plugin/CompassError'),
    CompassHeading = require('cordova/plugin/CompassHeading');

var compassCallback = null,
    compassReady = false;

//console.log("TIZEN COMPASS START");

module.exports = {
    getHeading: function(successCallback, errorCallback) {

        if (window.DeviceOrientationEvent !== undefined) {

            compassCallback = function (orientation) {
                var heading = 360 - orientation.alpha;

                if (compassReady) {
                    successCallback( new CompassHeading (heading, heading, 0, 0));
                    window.removeEventListener("deviceorientation", compassCallback, true);
                }
                compassReady = true;
            };
            compassReady = false; // workaround invalid first event value returned by WRT
            window.addEventListener("deviceorientation", compassCallback, true);
        }
        else {
            errorCallback(CompassError.COMPASS_NOT_SUPPORTED);
        }
    }
};

//console.log("TIZEN COMPASS END");


});

// file: lib/tizen/plugin/tizen/Contact.js
define("cordova/plugin/tizen/Contact", function(require, exports, module) {

/*global tizen:false */
//var ContactError = require('cordova/plugin/ContactError'),
//    ContactUtils = require('cordova/plugin/tizen/ContactUtils');

// ------------------
// Utility functions
// ------------------


//console.log("TIZEN CONTACT START");


var ContactError = require('cordova/plugin/ContactError'),
    ContactUtils = require('cordova/plugin/tizen/ContactUtils'),
    utils = require('cordova/utils'),
    exec = require('cordova/exec');



/**
 * Retrieves a Tizen Contact object from the device by its unique id.
 *
 * @param uid
 *            Unique id of the contact on the device
 * @return {tizen.Contact} Tizen Contact object or null if contact with
 *         specified id is not found
 */
var findByUniqueId = function(id) {

    if (!id) {
        return null;
    }

    var tizenContact = null;

    tizen.contact.getDefaultAddressBook().find(
        function _successCallback(contacts){
            tizenContact = contacts[0];
        },
        function _errorCallback(error){
            console.log("tizen find error " + error);
        },
        new tizen.AttributeFilter('id', 'CONTAINS', id),
        new tizen.SortMode('id', 'ASC'));

    return tizenContact || null;
};


var traceTizenContact = function (tizenContact) {
    console.log("cordova/plugin/tizen/Contact/  tizenContact.id " + tizenContact.id);
    console.log("cordova/plugin/tizen/Contact/  tizenContact.personId " + tizenContact.personId);     //Tizen 2.0
    console.log("cordova/plugin/tizen/Contact/  tizenContact.addressBookId " + tizenContact.addressBookId);  //Tizen 2.0

    console.log("cordova/plugin/tizen/Contact/  tizenContact.lastUpdated " + tizenContact.lastUpdated);
    console.log("cordova/plugin/tizen/Contact/  tizenContact.isFavorite " + tizenContact.isFavorite);  //Tizen 2.0

    console.log("cordova/plugin/tizen/Contact/  tizenContact.name " + tizenContact.name);

    //console.log("cordova/plugin/tizen/Contact/  tizenContact.account " + tizenContact.account);  //Tizen 2.0

    console.log("cordova/plugin/tizen/Contact/  tizenContact.addresses " + tizenContact.addresses);
    console.log("cordova/plugin/tizen/Contact/  tizenContact.photoURI " + tizenContact.photoURI);
    console.log("cordova/plugin/tizen/Contact/  tizenContact.phoneNumbers " + tizenContact.phoneNumbers);
    console.log("cordova/plugin/tizen/Contact/  tizenContact.emails " + tizenContact.emails);
    console.log("cordova/plugin/tizen/Contact/  tizenContact.birthday " + tizenContact.birthday);
    console.log("cordova/plugin/tizen/Contact/  tizenContact.anniversaries " + tizenContact.anniversaries);

    console.log("cordova/plugin/tizen/Contact/  tizenContact.organizations " + tizenContact.organizations);
    console.log("cordova/plugin/tizen/Contact/  tizenContact.notes " + tizenContact.notes);
    console.log("cordova/plugin/tizen/Contact/  tizenContact.urls " + tizenContact.urls);
    console.log("cordova/plugin/tizen/Contact/  tizenContact.ringtonesURI " + tizenContact.ringtonesURI);
    console.log("cordova/plugin/tizen/Contact/  tizenContact.groupIds " + tizenContact.groupIds);    //Tizen 2.0

    //console.log("cordova/plugin/tizen/Contact/  tizenContact.categories " + tizenContact.categories);  //Tizen 2.0
};


/**
 * Creates a Tizen contact object from the W3C Contact object and persists
 * it to device storage.
 *
 * @param {Contact}
 *            contact The contact to save
 * @return a new contact object with all properties set
 */
var saveToDevice = function(contact) {

    if (!contact) {
        return;
    }

    var tizenContact = null;
    var update = false;
    var i = 0;

    // if the underlying Tizen Contact object already exists, retrieve it for
    // update
    if (contact.id) {
        // we must attempt to retrieve the BlackBerry contact from the device
        // because this may be an update operation
        tizenContact = findByUniqueId(contact.id);
    }

    // contact not found on device, create a new one
    if (!tizenContact) {
        tizenContact = new tizen.Contact();
    }
    // update the existing contact
    else {
        update = true;
    }

    // NOTE: The user may be working with a partial Contact object, because only
    // user-specified Contact fields are returned from a find operation (blame
    // the W3C spec). If this is an update to an existing Contact, we don't
    // want to clear an attribute from the contact database simply because the
    // Contact object that the user passed in contains a null value for that
    // attribute. So we only copy the non-null Contact attributes to the
    // Tizen Contact object before saving.
    //
    // This means that a user must explicitly set a Contact attribute to a
    // non-null value in order to update it in the contact database.
    //
    traceTizenContact (tizenContact);

    // display name
    if (contact.displayName !== null) {
        if (tizenContact.name === null) {
            tizenContact.name = new tizen.ContactName();
        }
        if (tizenContact.name !== null) {
            tizenContact.name.displayName = contact.displayName;
        }
    }

    // name
    if (contact.name !== null) {
        if (contact.name.givenName) {
            if (tizenContact.name === null) {
                tizenContact.name = new tizen.ContactName();
            }
            if (tizenContact.name !== null) {
                tizenContact.name.firstName = contact.name.givenName;
            }
        }

        if  (contact.name.middleName) {
            if (tizenContact.name === null) {
                tizenContact.name = new tizen.ContactName();
            }
            if (tizenContact.name !== null) {
                tizenContact.name.middleName = contact.name.middleName;
            }
        }

        if (contact.name.familyName) {
            if (tizenContact.name === null) {
                tizenContact.name = new tizen.ContactName();
            }
            if (tizenContact.name !== null) {
                tizenContact.name.lastName = contact.name.familyName;
            }
        }

        if (contact.name.honorificPrefix) {
            if (tizenContact.name === null) {
                tizenContact.name = new tizen.ContactName();
            }
            if (tizenContact.name !== null) {
                tizenContact.name.prefix = contact.name.honorificPrefix;
            }
        }

        //Tizen 2.0
        if (contact.name.honorificSuffix) {
            if (tizenContact.name === null) {
                tizenContact.name = new tizen.ContactName();
            }
            if (tizenContact.name !== null) {
                tizenContact.name.suffix = contact.name.honorificSuffix;
            }
        }
    }

    // nickname
    if (contact.nickname !== null) {
        if (tizenContact.name === null) {
            tizenContact.name = new tizen.ContactName();
        }
        if (tizenContact.name !== null) {
            if (!utils.isArray(tizenContact.name.nicknames))
            {
                tizenContact.name.nicknames = [];
            }
            tizenContact.name.nicknames[0] = contact.nickname;
        }
    }
    else {
        tizenContact.name.nicknames = [];
    }

    // notes - Tizen 2.0 (was note)
    if (contact.note !== null) {
        if (tizenContact.notes === null) {
            tizenContact.notes = [];
        }
        if (tizenContact.notes !== null) {
            tizenContact.notes[0] = contact.note;
        }
    }

    // photos
    if (contact.photos && utils.isArray(contact.photos) && contact.photos.length > 0) {
        tizenContact.photoURI = contact.photos[0];
    }

    if (utils.isDate(contact.birthday)) {
        if (!utils.isDate(tizenContact.birthday)) {
            tizenContact.birthday = new Date();
        }
        if (utils.isDate(tizenContact.birthday)) {
            tizenContact.birthday.setDate(contact.birthday.getDate());
        }
    }

    // Tizen supports many email addresses
    if (utils.isArray(contact.emails)) {

        // if this is an update, re initialize email addresses
        if (update) {
            // doit on effacer sur un update??????
        }

        // copy the first three email addresses found
        var emails = [];
        for (i = 0; i < contact.emails.length; i += 1) {
            var emailTypes = [];

            emailTypes.push (contact.emails[i].type);

            emails.push(
                new tizen.ContactEmailAddress(
                    contact.emails[i].value,
                    emailTypes,
                    contact.emails[i].pref));    //Tizen 2.0

        }
        tizenContact.emails = emails.length > 0 ? emails : [];
    }
    else {
        tizenContact.emails = [];
    }

    // Tizen supports many phone numbers
    // copy into appropriate fields based on type
    if (utils.isArray(contact.phoneNumbers)) {
        // if this is an update, re-initialize phone numbers
        if (update) {
        }

        var phoneNumbers = [];

        for (i = 0; i < contact.phoneNumbers.length; i += 1) {

            if (!contact.phoneNumbers[i]) {
                continue;
            }

            var phoneTypes = [];
            phoneTypes.push (contact.phoneNumbers[i].type);


            phoneNumbers.push(
                new tizen.ContactPhoneNumber(
                    contact.phoneNumbers[i].value,
                    phoneTypes,
                    contact.phoneNumbers[i].pref)    //Tizen 2.0
            );
        }

        tizenContact.phoneNumbers = phoneNumbers.length > 0 ? phoneNumbers : [];
    }
    else {
        tizenContact.phoneNumbers = [];
    }

    if (utils.isArray(contact.addresses)) {
        // if this is an update, re-initialize addresses
        if (update) {
        }

        var addresses = [],
            address = null;

        for ( i = 0; i < contact.addresses.length; i += 1) {
            address = contact.addresses[i];

            if (!address) {
                continue;
            }

            var addressTypes = [];
            addressTypes.push (address.type);

            addresses.push(
                new tizen.ContactAddress({
                         country:                   address.country,
                         region :                   address.region,
                         city:                      address.locality,
                         streetAddress:             address.streetAddress,
                         additionalInformation:     "",
                         postalCode:                address.postalCode,
                         isDefault:                    address.pref, //Tizen 2.0
                         types :                    addressTypes
                }));

        }
        tizenContact.addresses = addresses.length > 0 ? addresses : [];

    }
    else{
        tizenContact.addresses = [];
    }

    // copy first url found to cordova 'urls' field
    if (utils.isArray(contact.urls)) {
        // if this is an update, re-initialize web page
        if (update) {
        }

        var url = null,
            urls = [];

        for ( i = 0; i< contact.urls.length; i+= 1) {
            url = contact.urls[i];

            if (!url || !url.value) {
                continue;
            }

            urls.push( new tizen.ContactWebSite(url.value, url.type));
        }
        tizenContact.urls = urls.length > 0 ? urls : [];
    }
    else{
        tizenContact.urls = [];
    }

    if (utils.isArray(contact.organizations) && contact.organizations.length > 0 ) {
         // if this is an update, re-initialize addresses
        if (update) {
        }

        var organizations = [],
            organization = null;

        for ( i = 0; i < contact.organizations.length; i += 1) {
            organization = contact.organizations[i];

            if (!organization) {
                continue;
            }

            organizations.push(
                new tizen.ContactOrganization({
                    name:          organization.name,
                    department:    organization.department,
                    title:         organization.title,
                    role:          "",
                    logoURI:       ""
                }));

        }
        tizenContact.organizations = organizations.length > 0 ? organizations : [];

    }
    else{
        tizenContact.organizations = [];
    }

    // categories
    if (utils.isArray(contact.categories)) {
        tizenContact.categories = [];

        var category = null;

        for (i = 0; i < contact.categories.length; i += 1) {
            category = contact.categories[i];

            if (typeof category === "string") {
                tizenContact.categories.push(category);
            }
        }
    }
    else {
        tizenContact.categories = [];
    }

    // save to device
    // in tizen contact mean update or add
    // later we might use addBatch and updateBatch
    if (update){
        tizen.contact.getDefaultAddressBook().update(tizenContact);
    }
    else {
        tizen.contact.getDefaultAddressBook().add(tizenContact);
    }

    // Use the fully populated Tizen contact object to create a
    // corresponding W3C contact object.
    return ContactUtils.createContact(tizenContact, [ "*" ]);
};


/**
 * Creates a Tizen ContactAddress object from a W3C ContactAddress.
 *
 * @return {tizen.ContactAddress} a Tizen ContactAddress object
 */
var createTizenAddress = function(address) {

    var type = null,
        pref = null,
        typesAr = [];

    if (address === null) {
        return null;
    }

    var tizenAddress = new tizen.ContactAddress();

    if (tizenAddress === null) {
        return null;
    }

    typesAr.push(address.type);

    tizenAddress.country = address.country || "";
    tizenAddress.region = address.region || "";
    tizenAddress.city = address.locality || "";
    tizenAddress.streetAddress = address.streetAddress || "";
    tizenAddress.postalCode = address.postalCode || "";
    tizenAddress.isDefault = address.pref || false;   //Tizen SDK 2.0
    tizenAddress.types = typesAr || "";

    return tizenAddress;
};

module.exports = {
    /**
     * Persists contact to device storage.
     */

    save : function(successCB, failCB) {

        try {
            // save the contact and store it's unique id
            var fullContact = saveToDevice(this);

            this.id = fullContact.id;

            // This contact object may only have a subset of properties
            // if the save was an update of an existing contact. This is
            // because the existing contact was likely retrieved using a
            // subset of properties, so only those properties were set in the
            // object. For this reason, invoke success with the contact object
            // returned by saveToDevice since it is fully populated.

            if (typeof successCB === 'function') {
                successCB(fullContact);
            }
        }
        catch (error) {
            console.log('Error saving contact: ' +  error);

            if (typeof failCB === 'function') {
                failCB (new ContactError(ContactError.UNKNOWN_ERROR));
            }
        }
    },

    /**
     * Removes contact from device storage.
     *
     * @param successCB
     *            successCB callback
     * @param failCB
     *            error callback
     */
    remove : function (successCB, failCB) {

        try {
            // retrieve contact from device by id
            var tizenContact = null;

            if (this.id) {
                tizenContact = findByUniqueId(this.id);
            }

            // if contact was found, remove it
            if (tizenContact) {
                //var addressBook =  tizen.contact.getDefaultAddressBook();
                var addressBook =  tizen.contact.getAddressBook(tizenContact.addressBookId);   //Tizen SDk 2.0

                addressBook.remove(tizenContact.id);

                if (typeof success === 'function') {
                    successCB(this);
                }
            }
            // attempting to remove a contact that hasn't been saved
            else if (typeof failCB === 'function') {
                failCB(new ContactError(ContactError.UNKNOWN_ERROR));
            }
        }
        catch (error) {
            console.log('Error removing contact ' + this.id + ": " + error);
            if (typeof failCB === 'function') {
                failCB(new ContactError(ContactError.UNKNOWN_ERROR));
            }
        }
    }
};

//console.log("TIZEN CONTACT END");

});

// file: lib/tizen/plugin/tizen/ContactUtils.js
define("cordova/plugin/tizen/ContactUtils", function(require, exports, module) {

/*global tizen:false */
var Contact = require('cordova/plugin/Contact'),
    ContactAddress = require('cordova/plugin/ContactAddress'),
    ContactName = require('cordova/plugin/ContactName'),
    ContactField = require('cordova/plugin/ContactField'),
    ContactOrganization = require('cordova/plugin/ContactOrganization'),
    utils = require('cordova/utils');



/**
 * Mappings for each Contact field that may be used in a find operation. Maps
 * W3C Contact fields to one or more fields in a Tizen contact object.
 *
 * Example: user searches with a filter on the Contact 'name' field:
 *
 * <code>Contacts.find(['name'], onSuccess, onFail, {filter:'Bob'});</code>
 *
 * The 'name' field does not exist in a Tizen contact. Instead, a filter
 * expression will be built to search the Tizen contacts using the
 * Tizen 'title', 'firstName' and 'lastName' fields.
 */
var fieldMappings = {
    "id" : ["id"],
    "displayName" : ["name.displayName"],
    "nickname": ["name.nicknames"],
    "name" : [ "name.prefix", "name.firstName", "name.lastName" ],
    "phoneNumbers" : ["phoneNumbers.number","phoneNumbers.types"],
    "emails" : ["emails.types", "emails.email"],
    "addresses" : ["addresses.country","addresses.region","addresses.city","addresses.streetAddress","addresses.postalCode","addresses.country","addresses.types"],
    "organizations" : ["organizations.name","organizations.department","organizations.office", "organizations.title"],
    "birthday" : ["birthday"],
    "note" : ["notes"],
    "photos" : ["photoURI"],
    "urls" : ["urls.url", "urls.type"]
};

/*
 * Build an array of all of the valid W3C Contact fields. This is used to
 * substitute all the fields when ["*"] is specified.
 */
var allFields = [];

(function() {
    for ( var key in fieldMappings) {
        allFields.push(key);
    }
})();

/**
 * Create a W3C ContactAddress object from a Tizen Address object
 *
 * @param {String}
 *            type the type of address (e.g. work, home)
 * @param {tizen.ContactAddress}
 *            tizenAddress a Tizen Address object
 * @return {ContactAddress} a contact address object or null if the specified
 *         address is null
 */
var createContactAddress = function(type, tizenAddress) {
    if (!tizenAddress) {
        return null;
    }

    var isDefault = tizenAddress.isDefault;            //Tizen 2.0
    var streetAddress = tizenAddress.streetAddress;
    var locality = tizenAddress.city || "";
    var region = tizenAddress.region || "";
    var postalCode = tizenAddress.postalCode || "";
    var country = tizenAddress.country || "";

    //TODO improve formatted
    var formatted = streetAddress + ", " + locality + ", " + region + ", " + postalCode + ", " + country;

    var contact = new ContactAddress(isDefault, type, formatted, streetAddress, locality, region, postalCode, country);

    return contact;
};

module.exports = {
    /**
     * Builds Tizen filter expressions for contact search using the
     * contact fields and search filter provided.
     *
     * @param {String[]}
     *            fields Array of Contact fields to search
     * @param {String}
     *            filter Filter, or search string
     * @param {Boolean}
     *                 multiple, one contacts or more wanted as result
     * @return filter expression or null if fields is empty or filter is null or
     *         empty
     */

    buildFilterExpression: function(fields, filter) {
        // ensure filter exists
        if (!filter || filter === "") {
            return null;
        }

        if ((fields.length === 1) && (fields[0] === "*")) {
            // Cordova enhancement to allow fields value of ["*"] to indicate
            // all supported fields.
            fields = allFields;
        }

        // build a filter expression using all Contact fields provided
        var compositeFilter = null,
            attributeFilter = null,
            filterExpression = null,
            matchFlag = "CONTAINS",
            matchValue = filter,
            attributesArray = [];

        if (fields && utils.isArray(fields)) {

            for ( var field in fields) {

                if (!fields[field]) {
                    continue;
                }

                // retrieve Tizen contact fields that map Cordova fields specified
                // (tizenFields is a string or an array of strings)
                var tizenFields = fieldMappings[fields[field]];

                if (!tizenFields) {
                    // does something maps
                    continue;
                }

                // construct the filter expression using the Tizen fields
                for ( var index in tizenFields) {
                    attributeFilter = new tizen.AttributeFilter(tizenFields[index], matchFlag, matchValue);
                    if (attributeFilter !== null) {
                        attributesArray.push(attributeFilter);
                    }
                }
            }
        }

        // fulfill Tizen find attribute as a single or a composite attribute
        if (attributesArray.length == 1 ) {
            filterExpression = attributeFilter[0];
        } else if (attributesArray.length > 1) {
            // combine the filters as a Union
            filterExpression = new tizen.CompositeFilter("UNION", attributesArray);
        } else {
            filterExpression = null;
        }

        return filterExpression;
    },


    /**
     * Creates a Contact object from a Tizen Contact object, copying only
     * the fields specified.
     *
     * This is intended as a privately used function but it is made globally
     * available so that a Contact.save can convert a BlackBerry contact object
     * into its W3C equivalent.
     *
     * @param {tizen.Contact}
     *            tizenContact Tizen Contact object
     * @param {String[]}
     *            fields array of contact fields that should be copied
     * @return {Contact} a contact object containing the specified fields or
     *         null if the specified contact is null
     */
    createContact: function(tizenContact, fields) {

        if (!tizenContact) {
            return null;
        }

        // construct a new contact object
        // always copy the contact id and displayName fields
        var contact = new Contact(tizenContact.id, tizenContact.name.displayName);


        // nothing to do
        if (!fields || !(utils.isArray(fields)) || fields.length === 0) {
            return contact;
        }
        else if (fields.length === 1 && fields[0] === "*") {
            // Cordova enhancement to allow fields value of ["*"] to indicate
            // all supported fields.
            fields = allFields;
        }

        // add the fields specified
        for ( var key in fields) {

            var field = fields[key],
                index = 0;

            if (!field) {
                continue;
            }

            // name
            if (field.indexOf('name') === 0) {
                var formattedName = (tizenContact.name.prefix || "");

                if (tizenContact.name.firstName) {
                    formattedName += ' ';
                    formattedName += (tizenContact.name.firstName || "");
                }

                if (tizenContact.name.middleName) {
                    formattedName += ' ';
                    formattedName += (tizenContact.name.middleName || "");
                }

                if (tizenContact.name.lastName) {
                    formattedName += ' ';
                    formattedName += (tizenContact.name.lastName || "");
                }

                //Tizen 2.0
                if (tizenContact.name.suffix) {
                    formattedName += ' ';
                    formattedName += (tizenContact.name.suffix || "");
                }

                contact.name = new ContactName(
                        formattedName,
                        tizenContact.name.lastName,
                        tizenContact.name.firstName,
                        tizenContact.name.middleName,
                        tizenContact.name.prefix,
                        tizenContact.name.suffix);
            }
            // phoneNumbers - Tizen 2.0
            else if (field.indexOf('phoneNumbers') === 0) {
                var phoneNumbers = [];

                for (index = 0 ; index < tizenContact.phoneNumbers.length ; ++index) {
                    phoneNumbers.push(
                        new ContactField(
                            'PHONE',
                            tizenContact.phoneNumbers[index].number,
                            tizenContact.phoneNumbers[index].isDefault));
                }
                contact.phoneNumbers = phoneNumbers.length > 0 ? phoneNumbers : null;
            }

            // emails - Tizen 2.0
            else if (field.indexOf('emails') === 0) {
                var emails = [];

                for (index = 0 ; index < tizenContact.emails.length ; ++index) {
                    emails.push(
                        new ContactField(
                            'EMAILS',
                            tizenContact.emails[index].email,
                            tizenContact.emails[index].isDefault));
                }
                contact.emails = emails.length > 0 ? emails : null;
            }

            // addresses Tizen 2.0
            else if (field.indexOf('addresses') === 0) {
                var addresses = [];

                for (index = 0 ; index < tizenContact.addresses.length ; ++index) {
                    addresses.push(
                         new ContactAddress(
                            tizenContact.addresses[index].isDefault,
                            tizenContact.addresses[index].types[0] ? tizenContact.addresses[index].types[0] : "HOME",
                            null,
                            tizenContact.addresses[index].streetAddress,
                            tizenContact.addresses[index].city,
                            tizenContact.addresses[index].region,
                            tizenContact.addresses[index].postalCode,
                            tizenContact.addresses[index].country ));
                }
                contact.addresses = addresses.length > 0 ? addresses : null;
            }

            // birthday
            else if (field.indexOf('birthday') === 0) {
                if (utils.isDate(tizenContact.birthday)) {
                    contact.birthday = tizenContact.birthday;
                }
            }

            // note only one in Tizen Contact -Tizen 2.0
            else if (field.indexOf('note') === 0) {
                if (tizenContact.notes) {
                    contact.note = tizenContact.notes[0];
                }
            }
            // organizations Tizen 2.0
            else if (field.indexOf('organizations') === 0) {
                var organizations = [];

                for (index = 0 ; index < tizenContact.organizations.length ; ++index) {
                    organizations.push(
                            new ContactOrganization(
                                    (index === 0),
                                    'WORK',
                                    tizenContact.organizations.name,
                                    tizenContact.organizations.department,
                                    tizenContact.organizations.jobTitle));
                }
                contact.organizations = organizations.length > 0 ? organizations : null;
            }

            // urls
            else if (field.indexOf('urls') === 0) {
                var urls = [];

                if (tizenContact.urls) {
                    for (index = 0 ; index <tizenContact.urls.length ; ++index) {
                        urls.push(
                                new ContactField(
                                        tizenContact.urls[index].type,
                                        tizenContact.urls[index].url,
                                        (index === 0)));
                    }
                }
                contact.urls = urls.length > 0 ? urls : null;
            }

            // photos
            else if (field.indexOf('photos') === 0) {
                var photos = [];

                if (tizenContact.photoURI) {
                    photos.push(new ContactField('URI', tizenContact.photoURI, true));
                }
                contact.photos = photos.length > 0 ? photos : null;
            }
        }

        return contact;
    }
};

});

// file: lib/tizen/plugin/tizen/Device.js
define("cordova/plugin/tizen/Device", function(require, exports, module) {

/*global tizen:false */
var channel = require('cordova/channel');

//console.log("TIZEN DEVICE START");


// Tell cordova channel to wait on the CordovaInfoReady event - PPL is this useful?
//channel.waitForInitialization('onCordovaInfoReady');

function Device() {
    this.version = "2.1.0"; // waiting a working solution of the security error see below
    this.uuid = null;
    this.model = null;
    this.cordova = CORDOVA_JS_BUILD_LABEL;
    this.platform = "Tizen";
   
    this.getDeviceInfo();
}

Device.prototype.getDeviceInfo = function() {

    var deviceCapabilities =  tizen.systeminfo.getCapabilities();

    if (deviceCapabilities) {
        this.version = deviceCapabilities.platformVersion; // requires http://tizen.org/privilege/system  (and not "systeminfo")  privileges to be added in config.xml
        this.uuid = deviceCapabilities.duid;
        this.model = deviceCapabilities.platformName;
        
        channel.onCordovaInfoReady.fire();
     }
     else {
         console.log("error initializing cordova: ");
     }
};

module.exports = new Device();

//console.log("TIZEN DEVICE END");



});

// file: lib/tizen/plugin/tizen/File.js
define("cordova/plugin/tizen/File", function(require, exports, module) {


//console.log("TIZEN FILE START");

/*global WebKitBlobBuilder:false */
var FileError = require('cordova/plugin/FileError'),
    DirectoryEntry = require('cordova/plugin/DirectoryEntry'),
    FileEntry = require('cordova/plugin/FileEntry'),
    File = require('cordova/plugin/File'),
    FileSystem = require('cordova/plugin/FileSystem');

var nativeRequestFileSystem = window.webkitRequestFileSystem,
    nativeResolveLocalFileSystemURI = window.webkitResolveLocalFileSystemURL,
    NativeFileReader = window.FileReader;

function getFileSystemName(nativeFs) {
    return (nativeFs.name.indexOf("Persistent") != -1) ? "persistent" : "temporary";
}

function makeEntry(entry) {
    if (entry.isDirectory) {
        return new DirectoryEntry(entry.name, decodeURI(entry.toURL()));
    }
    else {
        return new FileEntry(entry.name, decodeURI(entry.toURL()));
    }
}

module.exports = {
    /* common/equestFileSystem.js, args = [type, size] */
    requestFileSystem: function(successCallback, errorCallback, args) {
        var type = args[0],
            size = args[1];

        nativeRequestFileSystem(
            type,
            size,
            function(nativeFs) {
                successCallback(new FileSystem(getFileSystemName(nativeFs), makeEntry(nativeFs.root)));
            },
            function(error) {
                errorCallback(error.code);
            }
        );
    },

    /* common/resolveLocalFileSystemURI.js, args= [uri] */
    resolveLocalFileSystemURI: function(successCallback, errorCallback, args) {
        var uri = args[0];

        nativeResolveLocalFileSystemURI(
            uri,
            function(entry) {
                successCallback(makeEntry(entry));
            },
            function(error) {
                errorCallback(error.code);
            }
        );
    },

    /* common/DirectoryReader.js, args = [this.path] */
    readEntries: function(successCallback, errorCallback, args) {
        var uri = args[0];

        nativeResolveLocalFileSystemURI(
            uri,
            function(dirEntry) {
                var reader = dirEntry.createReader();

                reader.readEntries(
                    function(entries) {
                        var retVal = [];
                        for (var i = 0; i < entries.length; i++) {
                            retVal.push(makeEntry(entries[i]));
                        }
                        successCallback(retVal);
                    },
                    function(error) {
                        errorCallback(error.code);
                    }
                );
            },
            function(error) {
                errorCallback(error.code);
            }
        );
    },

    /* common/Entry.js , args = [this.fullPath] */
    getMetadata: function(successCallback, errorCallback, args) {
        var uri = args[0];

        nativeResolveLocalFileSystemURI(
            uri,
            function(entry) {
                entry.getMetadata(
                    function(metaData) {
                        successCallback(metaData.modificationTime);
                    },
                    function(error) {
                        errorCallback(error.code);
                    }
                );
            },
            function(error) {
                errorCallback(error.code);
            }
        );
    },

    /* args = [this.fullPath, metadataObject] */
    /* PPL to be implemented */
    setMetadata: function(successCallback, errorCallback, args) {
        var uri = args[0],
            metadata = args[1];

        if (errorCallback) {
            errorCallback(FileError.NOT_FOUND_ERR);
        }
    },


    /* args = [srcPath, parent.fullPath, name] */
    moveTo: function(successCallback, errorCallback, args) {
        var srcUri = args[0],
            parentUri = args[1],
            name = args[2];

        nativeResolveLocalFileSystemURI(
            srcUri,
            function(source) {
                nativeResolveLocalFileSystemURI(
                    parentUri,
                    function(parent) {
                        source.moveTo(
                            parent,
                            name,
                            function(entry) {
                                successCallback(makeEntry(entry));
                            },
                            function(error) {
                                errorCallback(error.code);
                        }
                        );
                    },
                    function(error) {
                        errorCallback(error.code);
                    }
                );
            },
            function(error) {
                errorCallback(error.code);
            }
        );
    },

    /* args = [srcPath, parent.fullPath, name] */
    copyTo: function(successCallback, errorCallback, args) {
        var srcUri = args[0],
            parentUri = args[1],
            name = args[2];

        nativeResolveLocalFileSystemURI(
            srcUri,
            function(source) {
                nativeResolveLocalFileSystemURI(
                    parentUri,
                    function(parent) {
                        source.copyTo(
                            parent,
                            name,
                            function(entry) {
                                successCallback(makeEntry(entry));
                            },
                            function(error) {
                                errorCallback(error.code);
                            }
                        );
                    },
                    function(error) {
                        errorCallback(error.code);
                    }
                );
            },
            function(error) {
                errorCallback(error.code);
            }
        );
    },


    /* args = [this.fullPath] */
    remove: function(successCallback, errorCallback, args) {
        var uri = args[0];

        nativeResolveLocalFileSystemURI(
            uri,
            function(entry) {
                if (entry.fullPath === "/") {
                    errorCallback(FileError.NO_MODIFICATION_ALLOWED_ERR);
                }
                else {
                    entry.remove(
                        successCallback,
                        function(error) {
                            errorCallback(error.code);
                        }
                    );
                }
            },
            function(error) {
                errorCallback(error.code);
            }
        );
    },

    /* args = [this.fullPath] */
    getParent: function(successCallback, errorCallback, args) {
        var uri = args[0];

        nativeResolveLocalFileSystemURI(
            uri,
            function(entry) {
                entry.getParent(
                    function(entry) {
                        successCallback(makeEntry(entry));
                    },
                    function(error) {
                        errorCallback(error.code);
                    }
                );
            },
            function(error) {
                errorCallback(error.code);
            }
        );
    },

    /* common/FileEntry.js, args = [this.fullPath] */
    getFileMetadata: function(successCallback, errorCallback, args) {
        var uri = args[0];

        nativeResolveLocalFileSystemURI(
            uri,
            function(entry) {
                entry.file(
                    function(file) {
                        var retVal = new File(file.name, decodeURI(entry.toURL()), file.type, file.lastModifiedDate, file.size);
                        successCallback(retVal);
                    },
                    function(error) {
                        errorCallback(error.code);
                    }
                );
            },
            function(error) {
                errorCallback(error.code);
            }
        );
    },

    /* common/DirectoryEntry.js , args = [this.fullPath, path, options] */
    getDirectory: function(successCallback, errorCallback, args) {
        var uri = args[0],
            path = args[1],
            options = args[2];

        nativeResolveLocalFileSystemURI(
            uri,
            function(entry) {
                entry.getDirectory(
                    path,
                    options,
                    function(entry) {
                        successCallback(makeEntry(entry));
                    },
                    function(error) {
                        if (error.code === FileError.INVALID_MODIFICATION_ERR) {
                            if (options.create) {
                                errorCallback(FileError.PATH_EXISTS_ERR);
                            }
                            else {
                                errorCallback(FileError.ENCODING_ERR);
                            }
                        }
                        else {
                            errorCallback(error.code);
                        }
                    }
                );
            },
            function(error) {
                errorCallback(error.code);
            }
        );
    },

    /* args = [this.fullPath] */
    removeRecursively: function(successCallback, errorCallback, args) {
        var uri = args[0];

        nativeResolveLocalFileSystemURI(
            uri,
            function(entry) {
                if (entry.fullPath === "/") {
                    errorCallback(FileError.NO_MODIFICATION_ALLOWED_ERR);
                }
                else {
                    entry.removeRecursively(
                        successCallback,
                        function(error) {
                            errorCallback(error.code);
                        }
                    );
                }
            },
            function(error) {
                errorCallback(error.code);
            }
        );
    },

    /* args = [this.fullPath, path, options] */
    getFile: function(successCallback, errorCallback, args) {
        var uri = args[0],
            path = args[1],
            options = args[2];

        nativeResolveLocalFileSystemURI(
            uri,
            function(entry) {
                entry.getFile(
                    path,
                    options,
                    function(entry) {
                        successCallback(makeEntry(entry));
                    },
                    function(error) {
                        if (error.code === FileError.INVALID_MODIFICATION_ERR) {
                            if (options.create) {
                                errorCallback(FileError.PATH_EXISTS_ERR);
                            }
                            else {
                                errorCallback(FileError.ENCODING_ERR);
                            }
                        }
                        else {
                            errorCallback(error.code);
                        }
                    }
                );
            },
            function(error) {
                errorCallback(error.code);
            }
        );
    },

    /* common/FileReader.js, args = execArgs = [filepath, encoding, file.start, file.end] */
    readAsText: function(successCallback, errorCallback, args) {
        var uri = args[0],
            encoding = args[1];

        nativeResolveLocalFileSystemURI(
            uri,
            function(entry) {
                var onLoadEnd = function(evt) {
                        if (!evt.target.error) {
                            successCallback(evt.target.result);
                        }
                    },
                    onError = function(evt) {
                        errorCallback(evt.target.error.code);
                    };

                var reader = new NativeFileReader();

                reader.onloadend = onLoadEnd;
                reader.onerror = onError;

                entry.file(
                    function(file) {
                        reader.readAsText(file, encoding);
                    },
                    function(error) {
                        errorCallback(error.code);
                    }
                );
            },
            function(error) {
                errorCallback(error.code);
            }
        );
    },

    /* args = execArgs = [this._fileName, file.start, file.end] */
    readAsDataURL: function(successCallback, errorCallback, args) {
        var uri = args[0];

        nativeResolveLocalFileSystemURI(
            uri,
            function(entry) {
                var onLoadEnd = function(evt) {
                        if (!evt.target.error) {
                            successCallback(evt.target.result);
                        }
                    },
                    onError = function(evt) {
                        errorCallback(evt.target.error.code);
                    };

                var reader = new NativeFileReader();

                reader.onloadend = onLoadEnd;
                reader.onerror = onError;
                entry.file(
                    function(file) {
                        reader.readAsDataURL(file);
                    },
                    function(error) {
                        errorCallback(error.code);
                    }
                );
            },
            function(error) {
                errorCallback(error.code);
            }
        );
    },

    /* args = execArgs =  [this._fileName, file.start, file.end] */
    /* PPL, to Be implemented , for now it is pasted from readAsText...*/
    readAsBinaryString: function(successCallback, errorCallback, args) {
        var uri = args[0];

        nativeResolveLocalFileSystemURI(
            uri,
            function(entry) {
                var onLoadEnd = function(evt) {
                        if (!evt.target.error) {
                            successCallback(evt.target.result);
                        }
                    },
                    onError = function(evt) {
                        errorCallback(evt.target.error.code);
                    };

                var reader = new NativeFileReader();

                reader.onloadend = onLoadEnd;
                reader.onerror = onError;

                entry.file(
                    function(file) {
                        reader.readAsDataURL(file);
                    },
                    function(error) {
                        errorCallback(error.code);
                    }
                );
            },
            function(error) {
                errorCallback(error.code);
            }
        );
    },


    /* args = execArgs =  [this._fileName, file.start, file.end] */
    /* PPL, to Be implemented , for now it is pasted from readAsText...*/
    readAsArrayBuffer: function(successCallback, errorCallback, args) {
        var uri = args[0];

        nativeResolveLocalFileSystemURI(
            uri,
            function(entry) {
                var onLoadEnd = function(evt) {
                        if (!evt.target.error) {
                        successCallback(evt.target.result);
                        }
                    },
                    onError = function(evt) {
                        errorCallback(evt.target.error.code);
                    };

                var reader = new NativeFileReader();

                reader.onloadend = onLoadEnd;
                reader.onerror = onError;

                entry.file(
                    function(file) {
                        reader.readAsDataURL(file);
                    },
                    function(error) {
                        errorCallback(error.code);
                    }
                );
            },
            function(error) {
                errorCallback(error.code);
            }
        );
    },

    /* common/FileWriter.js, args = [this.fileName, text, this.position] */
    write: function(successCallback, errorCallback, args) {
        var uri = args[0],
            text = args[1],
            position = args[2];

        nativeResolveLocalFileSystemURI(
            uri,
            function(entry) {
                var onWriteEnd = function(evt) {
                        if(!evt.target.error) {
                            successCallback(evt.target.position - position);
                        }
                        else {
                            errorCallback(evt.target.error.code);
                        }
                    },
                    onError = function(evt) {
                        errorCallback(evt.target.error.code);
                    };

                entry.createWriter(
                    function(writer) {
                        var blob = new WebKitBlobBuilder();
                        blob.append(text);

                        writer.onwriteend = onWriteEnd;
                        writer.onerror = onError;

                        writer.seek(position);
                        writer.write(blob.getBlob('text/plain'));
                    },
                    function(error) {
                        errorCallback(error.code);
                    }
                );
            },
            function(error) {
                errorCallback(error.code);
            }
        );
    },

    /* args = [this.fileName, size] */
    truncate: function(successCallback, errorCallback, args) {
        var uri = args[0],
            size = args[1];

        nativeResolveLocalFileSystemURI(
            uri,
            function(entry) {
                var onWriteEnd = function(evt) {
                        if(!evt.target.error) {
                            successCallback(evt.target.length);
                        }
                        else {
                            errorCallback(evt.target.error.code);
                        }
                    },
                    onError = function(evt) {
                        errorCallback(evt.target.error.code);
                    };

                entry.createWriter(
                    function(writer) {
                        writer.onwriteend = onWriteEnd;
                        writer.onerror = onError;
                        writer.truncate(size);
                    },
                    function(error) {
                        errorCallback(error.code);
                    }
                );
            },
            function(error) {
                errorCallback(error.code);
            }
        );
    }
};


//console.log("TIZEN FILE END");


});

// file: lib/tizen/plugin/tizen/FileTransfer.js
define("cordova/plugin/tizen/FileTransfer", function(require, exports, module) {

/*global WebKitBlobBuilder:false */


//console.log("TIZEN FILE TRANSFER START");

var FileEntry = require('cordova/plugin/FileEntry'),
    FileTransferError = require('cordova/plugin/FileTransferError'),
    FileUploadResult = require('cordova/plugin/FileUploadResult');

var nativeResolveLocalFileSystemURI = window.webkitResolveLocalFileSystemURL;

function getParentPath(filePath) {
    var pos = filePath.lastIndexOf('/');
    return filePath.substring(0, pos + 1);
}

function getFileName(filePath) {
    var pos = filePath.lastIndexOf('/');
    return filePath.substring(pos + 1);
}

module.exports = {
    /* common/FileTransfer.js, args = [filePath, server, fileKey, fileName, mimeType, params, trustAllHosts, chunkedMode, headers, this._id, httpMethod] */
    upload: function(successCallback, errorCallback, args) {
        var filePath = args[0],
            server = args[1],
            fileKey = args[2],
            fileName = args[3],
            mimeType = args[4],
            params = args[5],
            /*trustAllHosts = args[6],*/
            chunkedMode = args[7];

        nativeResolveLocalFileSystemURI(
            filePath,
            function(entry) {
                entry.file(
                    function(file) {
                        function uploadFile(blobFile) {
                            var fd = new FormData();

                            fd.append(fileKey, blobFile, fileName);

                            for (var prop in params) {
                                if(params.hasOwnProperty(prop)) {
                                    fd.append(prop, params[prop]);
                                }
                            }
                            var xhr = new XMLHttpRequest();

                            xhr.open("POST", server);

                            xhr.onload = function(evt) {
                                if (xhr.status == 200) {
                                    var result = new FileUploadResult();
                                    result.bytesSent = file.size;
                                    result.responseCode = xhr.status;
                                    result.response = xhr.response;
                                    successCallback(result);
                                }
                                else if (xhr.status == 404) {
                                    errorCallback(new FileTransferError(FileTransferError.INVALID_URL_ERR));
                                }
                                else {
                                    errorCallback(new FileTransferError(FileTransferError.CONNECTION_ERR));
                                }
                            };

                            xhr.ontimeout = function(evt) {
                                errorCallback(new FileTransferError(FileTransferError.CONNECTION_ERR));
                            };

                            xhr.send(fd);
                        }

                        var bytesPerChunk;

                        if (chunkedMode === true) {
                            bytesPerChunk = 1024 * 1024; // 1MB chunk sizes.
                        }
                        else {
                            bytesPerChunk = file.size;
                        }
                        var start = 0;
                        var end = bytesPerChunk;
                        while (start < file.size) {
                            var chunk = file.webkitSlice(start, end, mimeType);
                            uploadFile(chunk);
                            start = end;
                            end = start + bytesPerChunk;
                        }
                    },
                    function(error) {
                        errorCallback(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR));
                    }
                );
            },
            function(error) {
                errorCallback(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR));
            }
        );
    },

    /* args = [source, target, trustAllHosts, this._id, headers] */
    download: function(successCallback, errorCallback, args) {
        var url = args[0],
            filePath = args[1];

        var xhr = new XMLHttpRequest();

        function writeFile(fileEntry) {
            fileEntry.createWriter(
                function(writer) {
                    writer.onwriteend = function(evt) {
                        if (!evt.target.error) {
                            successCallback(new FileEntry(fileEntry.name, fileEntry.toURL()));
                        } else {
                            errorCallback(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR));
                        }
                    };

                    writer.onerror = function(evt) {
                        errorCallback(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR));
                    };

                    var builder = new WebKitBlobBuilder();
                    builder.append(xhr.response);

                    var blob = builder.getBlob();
                    writer.write(blob);
                },
                function(error) {
                    errorCallback(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR));
                }
            );
        }

        xhr.onreadystatechange = function () {
            if (xhr.readyState == xhr.DONE) {
                if (xhr.status == 200 && xhr.response) {
                    nativeResolveLocalFileSystemURI(
                        getParentPath(filePath),
                        function(dir) {
                            dir.getFile(
                                getFileName(filePath),
                                {create: true},
                                writeFile,
                                function(error) {
                                    errorCallback(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR));
                                }
                            );
                        },
                        function(error) {
                            errorCallback(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR));
                        }
                    );
                }
                else if (xhr.status == 404) {
                    errorCallback(new FileTransferError(FileTransferError.INVALID_URL_ERR));
                }
                else {
                    errorCallback(new FileTransferError(FileTransferError.CONNECTION_ERR));
                }
            }
        };

        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.send();
    },


    /* args = [this._id]); */
    abort: function(successCallback, errorCallback, args) {
        errorCallback(FileTransferError.ABORT_ERR);
    }

};


//console.log("TIZEN FILE TRANSFER END");


});

// file: lib/tizen/plugin/tizen/Globalization.js
define("cordova/plugin/tizen/Globalization", function(require, exports, module) {


/*global tizen:false */

var argscheck = require('cordova/argscheck'),
    exec = require('cordova/exec'),
    GlobalizationError = require('cordova/plugin/GlobalizationError');

var globalization = {

/**
* Returns the string identifier for the client's current language.
* It returns the language identifier string to the successCB callback with a
* properties object as a parameter. If there is an error getting the language,
* then the errorCB callback is invoked.
*
* @param {Function} successCB
* @param {Function} errorCB
*
* @return Object.value {String}: The language identifier
*
* @error GlobalizationError.UNKNOWN_ERROR
*
* Example
*    globalization.getPreferredLanguage(function (language) {alert('language:' + language.value + '\n');},
*                                function () {});
*/
getPreferredLanguage:function(successCB, failureCB) {
    console.log('exec(successCB, failureCB, "Globalization","getPreferredLanguage", []);');

    tizen.systeminfo.getPropertyValue (
        "LOCALE",
        function (localeInfo) {
            console.log("Cordova, getLocaleName, language is  " + localeInfo.language);
            successCB( {"value": localeInfo.language});
        },
        function(error) {
            console.log("Cordova, getLocaleName, An error occurred " + error.message);
            failureCB(new GlobalizationError(GlobalizationError.UNKNOWN_ERROR , "cannot retrieve language name"));
        }
    );
},

/**
* Returns the string identifier for the client's current locale setting.
* It returns the locale identifier string to the successCB callback with a
* properties object as a parameter. If there is an error getting the locale,
* then the errorCB callback is invoked.
*
* @param {Function} successCB
* @param {Function} errorCB
*
* @return Object.value {String}: The locale identifier
*
* @error GlobalizationError.UNKNOWN_ERROR
*
* Example
*    globalization.getLocaleName(function (locale) {alert('locale:' + locale.value + '\n');},
*                                function () {});
*/
getLocaleName:function(successCB, failureCB) {
    tizen.systeminfo.getPropertyValue (
        "LOCALE",
        function (localeInfo) {
            console.log("Cordova, getLocaleName, locale name (country) is  " + localeInfo.country);
            successCB( {"value":localeInfo.language});
        },
        function(error) {
            console.log("Cordova, getLocaleName, An error occurred " + error.message);
            failureCB(new GlobalizationError(GlobalizationError.UNKNOWN_ERROR , "cannot retrieve locale name"));
        }
    );
},


/**
* Returns a date formatted as a string according to the client's user preferences and
* calendar using the time zone of the client. It returns the formatted date string to the
* successCB callback with a properties object as a parameter. If there is an error
* formatting the date, then the errorCB callback is invoked.
*
* The defaults are: formatLenght="short" and selector="date and time"
*
* @param {Date} date
* @param {Function} successCB
* @param {Function} errorCB
* @param {Object} options {optional}
*            formatLength {String}: 'short', 'medium', 'long', or 'full'
*            selector {String}: 'date', 'time', or 'date and time'
*
* @return Object.value {String}: The localized date string
*
* @error GlobalizationError.FORMATTING_ERROR
*
* Example
*    globalization.dateToString(new Date(),
*                function (date) {alert('date:' + date.value + '\n');},
*                function (errorCode) {alert(errorCode);},
*                {formatLength:'short'});
*/
dateToString:function(date, successCB, failureCB, options) {
    var dateValue = date.valueOf();
    console.log('exec(successCB, failureCB, "Globalization", "dateToString", [{"date": dateValue, "options": options}]);');

    var tzdate = null;
    var format = null;

    tzdate = new tizen.TZDate(date);

    if (tzdate) {
        if (options && (options.formatLength == 'short') ){
            format = tzdate.toLocaleDateString();
        }
        else{
            format = tzdate.toLocaleString();
        }
        console.log('Cordova, globalization, dateToString ' +format);
    }

    if (format)
    {
        successCB ({"value": format});
    }
    else {
        failureCB(new GlobalizationError(GlobalizationError.FORMATTING_ERROR , "cannot format date string"));
    }
},


/**
* Parses a date formatted as a string according to the client's user
* preferences and calendar using the time zone of the client and returns
* the corresponding date object. It returns the date to the successCB
* callback with a properties object as a parameter. If there is an error
* parsing the date string, then the errorCB callback is invoked.
*
* The defaults are: formatLength="short" and selector="date and time"
*
* @param {String} dateString
* @param {Function} successCB
* @param {Function} errorCB
* @param {Object} options {optional}
*            formatLength {String}: 'short', 'medium', 'long', or 'full'
*            selector {String}: 'date', 'time', or 'date and time'
*
* @return    Object.year {Number}: The four digit year
*            Object.month {Number}: The month from (0 - 11)
*            Object.day {Number}: The day from (1 - 31)
*            Object.hour {Number}: The hour from (0 - 23)
*            Object.minute {Number}: The minute from (0 - 59)
*            Object.second {Number}: The second from (0 - 59)
*            Object.millisecond {Number}: The milliseconds (from 0 - 999),
*                                        not available on all platforms
*
* @error GlobalizationError.PARSING_ERROR
*
* Example
*    globalization.stringToDate('4/11/2011',
*                function (date) { alert('Month:' + date.month + '\n' +
*                    'Day:' + date.day + '\n' +
*                    'Year:' + date.year + '\n');},
*                function (errorCode) {alert(errorCode);},
*                {selector:'date'});
*/
stringToDate:function(dateString, successCB, failureCB, options) {
    argscheck.checkArgs('sfFO', 'Globalization.stringToDate', arguments);
    console.log('exec(successCB, failureCB, "Globalization", "stringToDate", [{"dateString": dateString, "options": options}]);');

    //not supported
    failureCB(new GlobalizationError(GlobalizationError.PARSING_ERROR , "unsupported"));
},


/**
* Returns a pattern string for formatting and parsing dates according to the client's
* user preferences. It returns the pattern to the successCB callback with a
* properties object as a parameter. If there is an error obtaining the pattern,
* then the errorCB callback is invoked.
*
* The defaults are: formatLength="short" and selector="date and time"
*
* @param {Function} successCB
* @param {Function} errorCB
* @param {Object} options {optional}
*            formatLength {String}: 'short', 'medium', 'long', or 'full'
*            selector {String}: 'date', 'time', or 'date and time'
*
* @return    Object.pattern {String}: The date and time pattern for formatting and parsing dates.
*                                    The patterns follow Unicode Technical Standard #35
*                                    http://unicode.org/reports/tr35/tr35-4.html
*            Object.timezone {String}: The abbreviated name of the time zone on the client
*            Object.utc_offset {Number}: The current difference in seconds between the client's
*                                        time zone and coordinated universal time.
*            Object.dst_offset {Number}: The current daylight saving time offset in seconds
*                                        between the client's non-daylight saving's time zone
*                                        and the client's daylight saving's time zone.
*
* @error GlobalizationError.PATTERN_ERROR
*
* Example
*    globalization.getDatePattern(
*                function (date) {alert('pattern:' + date.pattern + '\n');},
*                function () {},
*                {formatLength:'short'});
*/
getDatePattern:function(successCB, failureCB, options) {
    console.log(' exec(successCB, failureCB, "Globalization", "getDatePattern", [{"options": options}]);');

    var shortFormat = (options) ? ( options.formatLength === 'short') : true;

    var formatString = tizen.time.getDateFormat ( shortFormat);


    var current_datetime = tizen.time.getCurrentDateTime();

    // probably will require some control of operation...
    if (formatString)
    {
        successCB(
            {
                "pattern": formatString,
                "timezone": current_datetime.getTimezoneAbbreviation(),
                "utc_offset": current_datetime.difference(current_datetime.toUTC()).length,
                "dst_offset": current_datetime.isDST()
            }
        );
    }
    else {
        failureCB(new GlobalizationError(GlobalizationError.PATTERN_ERROR , "cannot get pattern"));
    }
},


/**
* Returns an array of either the names of the months or days of the week
* according to the client's user preferences and calendar. It returns the array of names to the
* successCB callback with a properties object as a parameter. If there is an error obtaining the
* names, then the errorCB callback is invoked.
*
* The defaults are: type="wide" and item="months"
*
* @param {Function} successCB
* @param {Function} errorCB
* @param {Object} options {optional}
*            type {String}: 'narrow' or 'wide'
*            item {String}: 'months', or 'days'
*
* @return Object.value {Array{String}}: The array of names starting from either
*                                        the first month in the year or the
*                                        first day of the week.
* @error GlobalizationError.UNKNOWN_ERROR
*
* Example
*    globalization.getDateNames(function (names) {
*        for(var i = 0; i < names.value.length; i++) {
*            alert('Month:' + names.value[i] + '\n');}},
*        function () {});
*/
getDateNames:function(successCB, failureCB, options) {
    argscheck.checkArgs('fFO', 'Globalization.getDateNames', arguments);
    console.log('exec(successCB, failureCB, "Globalization", "getDateNames", [{"options": options}]);');

    failureCB(new GlobalizationError(GlobalizationError.UNKNOWN_ERROR , "unsupported"));
},

/**
* Returns whether daylight savings time is in effect for a given date using the client's
* time zone and calendar. It returns whether or not daylight savings time is in effect
* to the successCB callback with a properties object as a parameter. If there is an error
* reading the date, then the errorCB callback is invoked.
*
* @param {Date} date
* @param {Function} successCB
* @param {Function} errorCB
*
* @return Object.dst {Boolean}: The value "true" indicates that daylight savings time is
*                                in effect for the given date and "false" indicate that it is not.
*
* @error GlobalizationError.UNKNOWN_ERROR
*
* Example
*    globalization.isDayLightSavingsTime(new Date(),
*                function (date) {alert('dst:' + date.dst + '\n');}
*                function () {});
*/
isDayLightSavingsTime:function(date, successCB, failureCB) {

    var tzdate = null,
        isDLS = false;

    console.log('exec(successCB, failureCB, "Globalization", "isDayLightSavingsTime", [{"date": dateValue}]);');
    console.log("date " + date + " value " + date.valueOf()) ;

    tzdate = new tizen.TZDate(date);
    if (tzdate) {
        isDLS = false | (tzdate && tzdate.isDST());

        console.log ("Cordova, globalization, isDayLightSavingsTime, " + isDLS);

        successCB({"dst":isDLS});
    }
    else {
        failureCB(new GlobalizationError(GlobalizationError.UNKNOWN_ERROR , "cannot get information"));
    }
},

/**
* Returns the first day of the week according to the client's user preferences and calendar.
* The days of the week are numbered starting from 1 where 1 is considered to be Sunday.
* It returns the day to the successCB callback with a properties object as a parameter.
* If there is an error obtaining the pattern, then the errorCB callback is invoked.
*
* @param {Function} successCB
* @param {Function} errorCB
*
* @return Object.value {Number}: The number of the first day of the week.
*
* @error GlobalizationError.UNKNOWN_ERROR
*
* Example
*    globalization.getFirstDayOfWeek(function (day)
*                { alert('Day:' + day.value + '\n');},
*                function () {});
*/
getFirstDayOfWeek:function(successCB, failureCB) {
    argscheck.checkArgs('fF', 'Globalization.getFirstDayOfWeek', arguments);
    console.log('exec(successCB, failureCB, "Globalization", "getFirstDayOfWeek", []);');

    // there is no API to get the fist day of the week in Tizen Dvice API
    successCB({value:1});

    // first day of week is a settings in the date book app
    // what about : getting the settings directly or asking the date book ?
},


/**
* Returns a number formatted as a string according to the client's user preferences.
* It returns the formatted number string to the successCB callback with a properties object as a
* parameter. If there is an error formatting the number, then the errorCB callback is invoked.
*
* The defaults are: type="decimal"
*
* @param {Number} number
* @param {Function} successCB
* @param {Function} errorCB
* @param {Object} options {optional}
*            type {String}: 'decimal', "percent", or 'currency'
*
* @return Object.value {String}: The formatted number string.
*
* @error GlobalizationError.FORMATTING_ERROR
*
* Example
*    globalization.numberToString(3.25,
*                function (number) {alert('number:' + number.value + '\n');},
*                function () {},
*                {type:'decimal'});
*/
numberToString:function(number, successCB, failureCB, options) {
    argscheck.checkArgs('nfFO', 'Globalization.numberToString', arguments);
    console.log('exec(successCB, failureCB, "Globalization", "numberToString", [{"number": number, "options": options}]);');
    //not supported
    failureCB(new GlobalizationError(GlobalizationError.UNKNOWN_ERROR , "unsupported"));
},

/**
* Parses a number formatted as a string according to the client's user preferences and
* returns the corresponding number. It returns the number to the successCB callback with a
* properties object as a parameter. If there is an error parsing the number string, then
* the errorCB callback is invoked.
*
* The defaults are: type="decimal"
*
* @param {String} numberString
* @param {Function} successCB
* @param {Function} errorCB
* @param {Object} options {optional}
*            type {String}: 'decimal', "percent", or 'currency'
*
* @return Object.value {Number}: The parsed number.
*
* @error GlobalizationError.PARSING_ERROR
*
* Example
*    globalization.stringToNumber('1234.56',
*                function (number) {alert('Number:' + number.value + '\n');},
*                function () { alert('Error parsing number');});
*/
stringToNumber:function(numberString, successCB, failureCB, options) {
    argscheck.checkArgs('sfFO', 'Globalization.stringToNumber', arguments);
    console.log('exec(successCB, failureCB, "Globalization", "stringToNumber", [{"numberString": numberString, "options": options}]);');

    //not supported
    failureCB(new GlobalizationError(GlobalizationError.UNKNOWN_ERROR , "unsupported"));
},

/**
* Returns a pattern string for formatting and parsing numbers according to the client's user
* preferences. It returns the pattern to the successCB callback with a properties object as a
* parameter. If there is an error obtaining the pattern, then the errorCB callback is invoked.
*
* The defaults are: type="decimal"
*
* @param {Function} successCB
* @param {Function} errorCB
* @param {Object} options {optional}
*            type {String}: 'decimal', "percent", or 'currency'
*
* @return    Object.pattern {String}: The number pattern for formatting and parsing numbers.
*                                    The patterns follow Unicode Technical Standard #35.
*                                    http://unicode.org/reports/tr35/tr35-4.html
*            Object.symbol {String}: The symbol to be used when formatting and parsing
*                                    e.g., percent or currency symbol.
*            Object.fraction {Number}: The number of fractional digits to use when parsing and
*                                    formatting numbers.
*            Object.rounding {Number}: The rounding increment to use when parsing and formatting.
*            Object.positive {String}: The symbol to use for positive numbers when parsing and formatting.
*            Object.negative: {String}: The symbol to use for negative numbers when parsing and formatting.
*            Object.decimal: {String}: The decimal symbol to use for parsing and formatting.
*            Object.grouping: {String}: The grouping symbol to use for parsing and formatting.
*
* @error GlobalizationError.PATTERN_ERROR
*
* Example
*    globalization.getNumberPattern(
*                function (pattern) {alert('Pattern:' + pattern.pattern + '\n');},
*                function () {});
*/
getNumberPattern:function(successCB, failureCB, options) {
    argscheck.checkArgs('fFO', 'Globalization.getNumberPattern', arguments);
    console.log('exec(successCB, failureCB, "Globalization", "getNumberPattern", [{"options": options}]);');

    //not supported
    failureCB(new GlobalizationError(GlobalizationError.UNKNOWN_ERROR , "unsupported"));
},

/**
* Returns a pattern string for formatting and parsing currency values according to the client's
* user preferences and ISO 4217 currency code. It returns the pattern to the successCB callback with a
* properties object as a parameter. If there is an error obtaining the pattern, then the errorCB
* callback is invoked.
*
* @param {String} currencyCode
* @param {Function} successCB
* @param {Function} errorCB
*
* @return    Object.pattern {String}: The currency pattern for formatting and parsing currency values.
*                                    The patterns follow Unicode Technical Standard #35
*                                    http://unicode.org/reports/tr35/tr35-4.html
*            Object.code {String}: The ISO 4217 currency code for the pattern.
*            Object.fraction {Number}: The number of fractional digits to use when parsing and
*                                    formatting currency.
*            Object.rounding {Number}: The rounding increment to use when parsing and formatting.
*            Object.decimal: {String}: The decimal symbol to use for parsing and formatting.
*            Object.grouping: {String}: The grouping symbol to use for parsing and formatting.
*
* @error GlobalizationError.FORMATTING_ERROR
*
* Example
*    globalization.getCurrencyPattern('EUR',
*                function (currency) {alert('Pattern:' + currency.pattern + '\n');}
*                function () {});
*/
getCurrencyPattern:function(currencyCode, successCB, failureCB) {
    argscheck.checkArgs('sfF', 'Globalization.getCurrencyPattern', arguments);
    console.log('exec(successCB, failureCB, "Globalization", "getCurrencyPattern", [{"currencyCode": currencyCode}]);');

    //not supported
    failureCB(new GlobalizationError(GlobalizationError.UNKNOWN_ERROR , "unsupported"));
}

};

module.exports = globalization;

});

// file: lib/tizen/plugin/tizen/Media.js
define("cordova/plugin/tizen/Media", function(require, exports, module) {

/*global Media:false, webkitURL:false */
var MediaError = require('cordova/plugin/MediaError'),
    audioObjects = {};

//console.log("TIZEN MEDIA START");

module.exports = {


    create: function (successCallback, errorCallback, args) {
        var id = args[0], src = args[1];

        console.log("media::create() - id =" + id + ", src =" + src);

        audioObjects[id] = new Audio(src);

        audioObjects[id].onStalledCB = function () {
            console.log("media::onStalled()");

            audioObjects[id].timer = window.setTimeout(
                    function () {
                        audioObjects[id].pause();

                        if (audioObjects[id].currentTime !== 0)
                            audioObjects[id].currentTime = 0;

                        console.log("media::onStalled() - MEDIA_ERROR -> " + MediaError.MEDIA_ERR_ABORTED);

                        var err = new MediaError(MediaError.MEDIA_ERR_ABORTED, "Stalled");

                        Media.onStatus(id, Media.MEDIA_ERROR, err);
                    },
                    2000);
        };

        audioObjects[id].onEndedCB = function () {
            console.log("media::onEndedCB() - MEDIA_STATE -> MEDIA_STOPPED");

            Media.onStatus(id, Media.MEDIA_STATE, Media.MEDIA_STOPPED);
        };

        audioObjects[id].onErrorCB = function () {
            console.log("media::onErrorCB() - MEDIA_ERROR -> " + event.srcElement.error);

            Media.onStatus(id, Media.MEDIA_ERROR, event.srcElement.error);
        };

        audioObjects[id].onPlayCB = function () {
            console.log("media::onPlayCB() - MEDIA_STATE -> MEDIA_STARTING");

            Media.onStatus(id, Media.MEDIA_STATE, Media.MEDIA_STARTING);
        };

        audioObjects[id].onPlayingCB = function () {
            console.log("media::onPlayingCB() - MEDIA_STATE -> MEDIA_RUNNING");

            Media.onStatus(id, Media.MEDIA_STATE, Media.MEDIA_RUNNING);
        };

        audioObjects[id].onDurationChangeCB = function () {
            console.log("media::onDurationChangeCB() - MEDIA_DURATION -> " +  audioObjects[id].duration);

            Media.onStatus(id, Media.MEDIA_DURATION, audioObjects[id].duration);
        };

        audioObjects[id].onTimeUpdateCB = function () {
            console.log("media::onTimeUpdateCB() - MEDIA_POSITION -> " +  audioObjects[id].currentTime);

            Media.onStatus(id, Media.MEDIA_POSITION, audioObjects[id].currentTime);
        };

        audioObjects[id].onCanPlayCB = function () {
            console.log("media::onCanPlayCB()");

            window.clearTimeout(audioObjects[id].timer);

            audioObjects[id].play();
        };
      },

    startPlayingAudio: function (successCallback, errorCallback, args) {
        var id = args[0], src = args[1], options = args[2];

        console.log("media::startPlayingAudio() - id =" + id + ", src =" + src + ", options =" + options);

        audioObjects[id].addEventListener('canplay', audioObjects[id].onCanPlayCB);
        audioObjects[id].addEventListener('ended', audioObjects[id].onEndedCB);
        audioObjects[id].addEventListener('timeupdate', audioObjects[id].onTimeUpdateCB);
        audioObjects[id].addEventListener('durationchange', audioObjects[id].onDurationChangeCB);
        audioObjects[id].addEventListener('playing', audioObjects[id].onPlayingCB);
        audioObjects[id].addEventListener('play', audioObjects[id].onPlayCB);
        audioObjects[id].addEventListener('error', audioObjects[id].onErrorCB);
        audioObjects[id].addEventListener('stalled', audioObjects[id].onStalledCB);

        audioObjects[id].play();
    },

    stopPlayingAudio: function (successCallback, errorCallback, args) {
        var id = args[0];

        window.clearTimeout(audioObjects[id].timer);

        audioObjects[id].pause();

        if (audioObjects[id].currentTime !== 0)
            audioObjects[id].currentTime = 0;

        console.log("media::stopPlayingAudio() - MEDIA_STATE -> MEDIA_STOPPED");

        Media.onStatus(id, Media.MEDIA_STATE, Media.MEDIA_STOPPED);

        audioObjects[id].removeEventListener('canplay', audioObjects[id].onCanPlayCB);
        audioObjects[id].removeEventListener('ended', audioObjects[id].onEndedCB);
        audioObjects[id].removeEventListener('timeupdate', audioObjects[id].onTimeUpdateCB);
        audioObjects[id].removeEventListener('durationchange', audioObjects[id].onDurationChangeCB);
        audioObjects[id].removeEventListener('playing', audioObjects[id].onPlayingCB);
        audioObjects[id].removeEventListener('play', audioObjects[id].onPlayCB);
        audioObjects[id].removeEventListener('error', audioObjects[id].onErrorCB);
        audioObjects[id].removeEventListener('error', audioObjects[id].onStalledCB);
    },

    seekToAudio: function (successCallback, errorCallback, args) {

        var id = args[0], milliseconds = args[1];

        console.log("media::seekToAudio()");

        audioObjects[id].currentTime = milliseconds;
        successCallback( audioObjects[id].currentTime);
    },

    pausePlayingAudio: function (successCallback, errorCallback, args) {
        var id = args[0];

        console.log("media::pausePlayingAudio() - MEDIA_STATE -> MEDIA_PAUSED");

        audioObjects[id].pause();

        Media.onStatus(id, Media.MEDIA_STATE, Media.MEDIA_PAUSED);
    },

    getCurrentPositionAudio: function (successCallback, errorCallback, args) {
        var id = args[0];
        console.log("media::getCurrentPositionAudio()");
        successCallback(audioObjects[id].currentTime);
    },

    release: function (successCallback, errorCallback, args) {
        var id = args[0];
        window.clearTimeout(audioObjects[id].timer);
        console.log("media::release()");
    },

    setVolume: function (successCallback, errorCallback, args) {
        var id = args[0], volume = args[1];

        console.log("media::setVolume()");

        audioObjects[id].volume = volume;
    },

    startRecordingAudio: function (successCallback, errorCallback, args) {
        var id = args[0], src = args[1];

        console.log("media::startRecordingAudio() - id =" + id + ", src =" + src);

        function gotStreamCB(stream) {
            audioObjects[id].src = webkitURL.createObjectURL(stream);
            console.log("media::startRecordingAudio() - stream CB");
        }

        function gotStreamFailedCB(error) {
            console.log("media::startRecordingAudio() - error CB:" + error.toString());
        }

        if (navigator.webkitGetUserMedia) {
            audioObjects[id] = new Audio();
            navigator.webkitGetUserMedia('audio', gotStreamCB, gotStreamFailedCB);
        } else {
            console.log("webkitGetUserMedia not supported");
        }
        successCallback();
    },

    stopRecordingAudio: function (successCallback, errorCallback, args) {
        var id = args[0];

        console.log("media::stopRecordingAudio() - id =" + id);

        audioObjects[id].pause();
        successCallback();
    }
};

//console.log("TIZEN MEDIA END");


});

// file: lib/tizen/plugin/tizen/MediaError.js
define("cordova/plugin/tizen/MediaError", function(require, exports, module) {


// The MediaError object already exists on Tizen. This prevents the Cordova
// version from being defined. This object is used to merge in differences
// between Tizen and Cordova MediaError objects.
module.exports = {
        MEDIA_ERR_NONE_ACTIVE : 0,
        MEDIA_ERR_NONE_SUPPORTED : 4
};

});

// file: lib/tizen/plugin/tizen/NetworkStatus.js
define("cordova/plugin/tizen/NetworkStatus", function(require, exports, module) {

/*global tizen:false */
var Connection = require('cordova/plugin/Connection');

//console.log("TIZEN CONNECTION AKA NETWORK STATUS START");

module.exports = {
    getConnectionInfo: function (successCallback, errorCallback) {

        var cncType = Connection.NONE;
        var infoCount = 0;
        var deviceCapabilities = null;
        var timerId = 0;
        var timeout = 300;


        function connectionCB() {

            if (timerId !== null) {
                clearTimeout(timerId);
                timerId = null;
            }

            infoCount++;

            if (infoCount > 1) {
                if (successCallback) {
                    successCallback(cncType);
                }
            }
        }

        function errorCB(error) {
            console.log("Error: " + error.code + "," + error.name + "," + error.message);

            if (errorCallback) {
                errorCallback();
            }
        }

        function wifiSuccessCB(wifi) {
            if ((wifi.status === "ON")  && (wifi.ipAddress.length !== 0)) {
                cncType = Connection.WIFI;
            }
            connectionCB();
        }

        function cellularSuccessCB(cell) {
            if ((cncType === Connection.NONE) && (cell.status === "ON") && (cell.ipAddress.length !== 0)) {
                cncType = Connection.CELL_2G;
            }
            connectionCB();
        }


        deviceCapabilities = tizen.systeminfo.getCapabilities();


        timerId = setTimeout( function(){
            timerId = null;
            infoCount = 1;
            connectionCB();
        }, timeout);


        if (deviceCapabilities.wifi) {
            tizen.systeminfo.getPropertyValue("WIFI_NETWORK", wifiSuccessCB, errorCB);
        }

        if (deviceCapabilities.telephony) {
            tizen.systeminfo.getPropertyValue("CELLULAR_NETWORK", cellularSuccessCB, errorCB);
        }

    }
};

//console.log("TIZEN CONNECTION AKA NETWORK STATUS END");

});

// file: lib/tizen/plugin/tizen/Notification.js
define("cordova/plugin/tizen/Notification", function(require, exports, module) {

var SoundBeat = require('cordova/plugin/tizen/SoundBeat');

/* TODO: get resource path from app environment? */
var soundBeat = new SoundBeat(["./sounds/beep.wav"]);


//console.log("TIZEN NOTIFICATION START");


module.exports = {

    alert: function(message, alertCallback, title, buttonName) {
        return this.confirm(message, alertCallback, title, buttonName);
    },

    confirm: function(message, confirmCallback, title, buttonLabels) {
        var index            =    null,
            overlayElement    =    null,
            popup            =    null,
            element         =    null,
            titleString        =     null,
            messageString    =    null,
            buttonString    =    null,
            buttonsArray    =    null;


        console.log ("message" , message);
        console.log ("confirmCallback" , confirmCallback);
        console.log ("title" , title);
        console.log ("buttonLabels" , buttonLabels);

        titleString = '<div class="popup-title"><p>' + title + '</p></div>';
        messageString = '<div class="popup-text"><p>' + message + '</p></div>';
        buttonString = '<div class="popup-button-bg"><ul>';

        switch(typeof(buttonLabels))
        {
        case "string":
            buttonsArray = buttonLabels.split(",");

            if (buttonsArray === null) {
                buttonsArray = buttonLabels;
            }

            for (index in buttonsArray) {
                buttonString += '<li><input id="popup-button-' + buttonsArray[index]+
                                '" type="button" value="' + buttonsArray[index] + '" /></li>';
                console.log ("index: ", index,"");
                console.log ("buttonsArray[index]: ", buttonsArray[index]);
                console.log ("buttonString: ", buttonString);
            }
            break;

        case "array":
            if (buttonsArray === null) {
                buttonsArray = buttonLabels;
            }

            for (index in buttonsArray) {
                buttonString += '<li><input id="popup-button-' + buttonsArray[index]+
                                '" type="button" value="' + buttonsArray[index] + '" /></li>';
                console.log ("index: ", index,"");
                console.log ("buttonsArray[index]: ", buttonsArray[index]);
                console.log ("buttonString: ", buttonString);
            }
            break;
        default:
            console.log ("cordova/plugin/tizen/Notification, default, buttonLabels: ", buttonLabels);
            break;
        }

        buttonString += '</ul></div>';

        overlayElement = document.createElement("div");
        overlayElement.className = 'ui-popupwindow-screen';

        overlayElement.style.zIndex = 1001;
        overlayElement.style.width = "100%";
        overlayElement.style.height = "100%";
        overlayElement.style.top = 0;
        overlayElement.style.left = 0;
        overlayElement.style.margin = 0;
        overlayElement.style.padding = 0;
        overlayElement.style.position = "absolute";

        popup = document.createElement("div");
        popup.className = "ui-popupwindow";
        popup.style.position = "fixed";
        popup.style.zIndex = 1002;
        popup.innerHTML = titleString + messageString + buttonString;

        document.body.appendChild(overlayElement);
        document.body.appendChild(popup);

        function createListener(button) {
            return function() {
                document.body.removeChild(overlayElement);
                document.body.removeChild(popup);
                confirmCallback(button.value);
            };
        }

       for (index in buttonsArray) {
           console.log ("index: ", index);

           element = document.getElementById("popup-button-" + buttonsArray[index]);
           element.addEventListener("click", createListener(element), false);
       }
    },

    prompt: function (message, promptCallback, title, buttonLabels) {
        console.log ("message" , message);
        console.log ("promptCallback" , promptCallback);
        console.log ("title" , title);
        console.log ("buttonLabels" , buttonLabels);

        //a temporary implementation using window.prompt()
        // note taht buttons are cancel ok (in that order)
        // gonna to return based on having OK  / Cancel
        // ok is 1, cancel is 2

        var result = prompt(message);

        if (promptCallback && (typeof promptCallback == "function")) {
            promptCallback((result === null) ? 2 : 1, result);
        }
    },

    vibrate: function(milliseconds) {
        console.log ("milliseconds" , milliseconds);

        if (navigator.vibrate) {
            navigator.vibrate(milliseconds);
        }
        else {
            console.log ("cordova/plugin/tizen/Notification, vibrate API does not exist");
        }
    },

    beep: function(count) {
        console.log ("count" , count);
        soundBeat.play(count);
    }
};

//console.log("TIZEN NOTIFICATION END");


});

// file: lib/tizen/plugin/tizen/SoundBeat.js
define("cordova/plugin/tizen/SoundBeat", function(require, exports, module) {

/*global webkitAudioContext:false */
/*
 *  SoundBeat
 * used by Notification Manager beep method
 *
 * This class provides sounds play
 *
 * uses W3C  Web Audio API
 * uses BufferLoader object
 *
 * NOTE: the W3C Web Audio doc tells we do not need to recreate the audio
 *       context to play a sound but only the audiosourcenode (createBufferSource)
 *       in the WebKit implementation we have to.
 *
 */

var BufferLoader = require('cordova/plugin/tizen/BufferLoader');

function SoundBeat(urlList) {
    this.context = null;
    this.urlList = urlList || null;
    this.buffers = null;
}

/*
 * This method play a loaded sounds on the Device
 * @param {Number} times Number of times to play loaded sounds.
 *
 */
SoundBeat.prototype.play = function(times) {

    var i = 0, sources = [], that = this;

    function finishedLoading (bufferList) {
        that.buffers = bufferList;

        for (i = 0; i < that.buffers.length ; i +=1) {
            if (that.context) {
                sources[i] = that.context.createBufferSource();

                sources[i].buffer = that.buffers[i];
                sources[i].connect (that.context.destination);

                sources[i].loop = true;
                sources[i].noteOn (0);
                sources[i].noteOff(sources[i].buffer.duration * times);
            }
        }
    }

    if (webkitAudioContext !== null) {
        this.context = new webkitAudioContext();
    }
    else {
        console.log ("SoundBeat.prototype.play, w3c web audio api not supported");
        this.context = null;
    }

    if (this.context === null) {
        console.log ("SoundBeat.prototype.play, cannot create audio context object");
        return;
    }

    this.bufferLoader = new BufferLoader (this.context, this.urlList, finishedLoading);
    if (this.bufferLoader === null) {
        console.log ("SoundBeat.prototype.play, cannot create buffer loader object");
        return;
    }

    this.bufferLoader.load();
};

module.exports = SoundBeat;

});

// file: lib/tizen/plugin/tizen/SplashScreen.js
define("cordova/plugin/tizen/SplashScreen", function(require, exports, module) {

var exec = require('cordova/exec');

var splashscreen = {

    window: null,


    show:function() {
        console.log ("tizen splashscreen show()");

        // open a windows in splashscreen.window
        // add DOM with an Image

    },
    hide:function() {
        console.log ("tizen splashscreen hide()");
        //delete the window splashscreen.window
        //set to null
    }
};

module.exports = splashscreen;

});

// file: lib/tizen/plugin/tizen/contacts.js
define("cordova/plugin/tizen/contacts", function(require, exports, module) {

/*global tizen:false */
var ContactError = require('cordova/plugin/ContactError'),
    utils = require('cordova/utils'),
    ContactUtils = require('cordova/plugin/tizen/ContactUtils');

module.exports = {
    /**
     * Returns an array of Contacts matching the search criteria.
     *
     * @return array of Contacts matching search criteria
     */
    find : function(fields, successCB, failCB, options) {

        // Success callback is required. Throw exception if not specified.
        if (typeof successCB !== 'function') {
            throw new TypeError("You must specify a success callback for the find command.");
        }

        // Search qualifier is required and cannot be empty.
        if (!fields || !(utils.isArray(fields)) || fields.length === 0) {
            if (typeof failCB === 'function') {
                failCB(new ContactError(ContactError.INVALID_ARGUMENT_ERROR));
            }
            return;
        }

        // options are optional
        var filter ="",
            multiple = false,
            contacts = [],
            tizenFilter = null;

        if (options) {
            filter = options.filter || "";
            multiple =  options.multiple || false;
        }

        if (filter){
            tizenFilter = ContactUtils.buildFilterExpression(fields, filter);
        }

        tizen.contact.getDefaultAddressBook().find(
            function(tizenContacts) {
                if (multiple) {
                    for (var index in tizenContacts) {
                        contacts.push(ContactUtils.createContact(tizenContacts[index], fields));
                    }
                }
                else {
                    contacts.push(ContactUtils.createContact(tizenContacts[0], fields));
                }

                // return results
                successCB(contacts);
            },
            function(error) {
                if (typeof failCB === 'function') {
                    failCB(ContactError.UNKNOWN_ERROR);
                }
            },
            tizenFilter,
            null);
    }
};

});

// file: lib/tizen/plugin/tizen/contacts/symbols.js
define("cordova/plugin/tizen/contacts/symbols", function(require, exports, module) {

require('cordova/plugin/contacts/symbols');

var modulemapper = require('cordova/modulemapper');

modulemapper.merges('cordova/plugin/tizen/contacts', 'navigator.contacts');
modulemapper.merges('cordova/plugin/tizen/Contact', 'Contact');

});

// file: lib/tizen/plugin/tizen/manager.js
define("cordova/plugin/tizen/manager", function(require, exports, module) {

var cordova = require('cordova');

module.exports = {
    exec: function (successCallback, errorCallback, clazz, action, args) {
        var plugin = require('cordova/plugin/tizen/' + clazz);

        if (plugin && typeof plugin[action] === 'function') {
            var result = plugin[action](successCallback, errorCallback, args);
            return result || {status: cordova.callbackStatus.NO_RESULT};
        }

        return {"status" : cordova.callbackStatus.CLASS_NOT_FOUND_EXCEPTION, "message" : "Function " + clazz + "::" + action + " cannot be found"};
    },
    resume: function () {},
    pause: function () {},
    destroy: function () {}
};

});

// file: lib/common/pluginloader.js
define("cordova/pluginloader", function(require, exports, module) {

var channel = require('cordova/channel');
var modulemapper = require('cordova/modulemapper');

// Helper function to inject a <script> tag.
function injectScript(url, onload, onerror) {
    var script = document.createElement("script");
    // onload fires even when script fails loads with an error.
    script.onload = onload;
    script.onerror = onerror || onload;
    script.src = url;
    document.head.appendChild(script);
}

function onScriptLoadingComplete(moduleList) {
    // Loop through all the plugins and then through their clobbers and merges.
    for (var i = 0, module; module = moduleList[i]; i++) {
        if (module) {
            try {
                if (module.clobbers && module.clobbers.length) {
                    for (var j = 0; j < module.clobbers.length; j++) {
                        modulemapper.clobbers(module.id, module.clobbers[j]);
                    }
                }

                if (module.merges && module.merges.length) {
                    for (var k = 0; k < module.merges.length; k++) {
                        modulemapper.merges(module.id, module.merges[k]);
                    }
                }

                // Finally, if runs is truthy we want to simply require() the module.
                // This can be skipped if it had any merges or clobbers, though,
                // since the mapper will already have required the module.
                if (module.runs && !(module.clobbers && module.clobbers.length) && !(module.merges && module.merges.length)) {
                    modulemapper.runs(module.id);
                }
            }
            catch(err) {
                // error with module, most likely clobbers, should we continue?
            }
        }
    }

    finishPluginLoading();
}

// Called when:
// * There are plugins defined and all plugins are finished loading.
// * There are no plugins to load.
function finishPluginLoading() {
    channel.onPluginsReady.fire();
}

// Handler for the cordova_plugins.js content.
// See plugman's plugin_loader.js for the details of this object.
// This function is only called if the really is a plugins array that isn't empty.
// Otherwise the onerror response handler will just call finishPluginLoading().
function handlePluginsObject(path, moduleList) {
    // Now inject the scripts.
    var scriptCounter = moduleList.length;

    if (!scriptCounter) {
        finishPluginLoading();
        return;
    }
    function scriptLoadedCallback() {
        if (!--scriptCounter) {
            onScriptLoadingComplete(moduleList);
        }
    }

    for (var i = 0; i < moduleList.length; i++) {
        injectScript(path + moduleList[i].file, scriptLoadedCallback);
    }
}

function injectPluginScript(pathPrefix) {
    injectScript(pathPrefix + 'cordova_plugins.js', function(){
        try {
            var moduleList = require("cordova/plugin_list");
            handlePluginsObject(pathPrefix, moduleList);
        } catch (e) {
            // Error loading cordova_plugins.js, file not found or something
            // this is an acceptable error, pre-3.0.0, so we just move on.
            finishPluginLoading();
        }
    },finishPluginLoading); // also, add script load error handler for file not found
}

function findCordovaPath() {
    var path = null;
    var scripts = document.getElementsByTagName('script');
    var term = 'cordova.js';
    for (var n = scripts.length-1; n>-1; n--) {
        var src = scripts[n].src;
        if (src.indexOf(term) == (src.length - term.length)) {
            path = src.substring(0, src.length - term.length);
            break;
        }
    }
    return path;
}

// Tries to load all plugins' js-modules.
// This is an async process, but onDeviceReady is blocked on onPluginsReady.
// onPluginsReady is fired when there are no plugins to load, or they are all done.
exports.load = function() {
    var pathPrefix = findCordovaPath();
    if (pathPrefix === null) {
        console.log('Could not find cordova.js script tag. Plugin loading may fail.');
        pathPrefix = '';
    }
    injectPluginScript(pathPrefix);
};


});

// file: lib/common/symbols.js
define("cordova/symbols", function(require, exports, module) {

var modulemapper = require('cordova/modulemapper');

// Use merges here in case others symbols files depend on this running first,
// but fail to declare the dependency with a require().
modulemapper.merges('cordova', 'cordova');
modulemapper.clobbers('cordova/exec', 'cordova.exec');
modulemapper.clobbers('cordova/exec', 'Cordova.exec');

});

// file: lib/common/utils.js
define("cordova/utils", function(require, exports, module) {

var utils = exports;

/**
 * Defines a property getter / setter for obj[key].
 */
utils.defineGetterSetter = function(obj, key, getFunc, opt_setFunc) {
    if (Object.defineProperty) {
        var desc = {
            get: getFunc,
            configurable: true
        };
        if (opt_setFunc) {
            desc.set = opt_setFunc;
        }
        Object.defineProperty(obj, key, desc);
    } else {
        obj.__defineGetter__(key, getFunc);
        if (opt_setFunc) {
            obj.__defineSetter__(key, opt_setFunc);
        }
    }
};

/**
 * Defines a property getter for obj[key].
 */
utils.defineGetter = utils.defineGetterSetter;

utils.arrayIndexOf = function(a, item) {
    if (a.indexOf) {
        return a.indexOf(item);
    }
    var len = a.length;
    for (var i = 0; i < len; ++i) {
        if (a[i] == item) {
            return i;
        }
    }
    return -1;
};

/**
 * Returns whether the item was found in the array.
 */
utils.arrayRemove = function(a, item) {
    var index = utils.arrayIndexOf(a, item);
    if (index != -1) {
        a.splice(index, 1);
    }
    return index != -1;
};

utils.typeName = function(val) {
    return Object.prototype.toString.call(val).slice(8, -1);
};

/**
 * Returns an indication of whether the argument is an array or not
 */
utils.isArray = function(a) {
    return utils.typeName(a) == 'Array';
};

/**
 * Returns an indication of whether the argument is a Date or not
 */
utils.isDate = function(d) {
    return utils.typeName(d) == 'Date';
};

/**
 * Does a deep clone of the object.
 */
utils.clone = function(obj) {
    if(!obj || typeof obj == 'function' || utils.isDate(obj) || typeof obj != 'object') {
        return obj;
    }

    var retVal, i;

    if(utils.isArray(obj)){
        retVal = [];
        for(i = 0; i < obj.length; ++i){
            retVal.push(utils.clone(obj[i]));
        }
        return retVal;
    }

    retVal = {};
    for(i in obj){
        if(!(i in retVal) || retVal[i] != obj[i]) {
            retVal[i] = utils.clone(obj[i]);
        }
    }
    return retVal;
};

/**
 * Returns a wrapped version of the function
 */
utils.close = function(context, func, params) {
    if (typeof params == 'undefined') {
        return function() {
            return func.apply(context, arguments);
        };
    } else {
        return function() {
            return func.apply(context, params);
        };
    }
};

/**
 * Create a UUID
 */
utils.createUUID = function() {
    return UUIDcreatePart(4) + '-' +
        UUIDcreatePart(2) + '-' +
        UUIDcreatePart(2) + '-' +
        UUIDcreatePart(2) + '-' +
        UUIDcreatePart(6);
};

/**
 * Extends a child object from a parent object using classical inheritance
 * pattern.
 */
utils.extend = (function() {
    // proxy used to establish prototype chain
    var F = function() {};
    // extend Child from Parent
    return function(Child, Parent) {
        F.prototype = Parent.prototype;
        Child.prototype = new F();
        Child.__super__ = Parent.prototype;
        Child.prototype.constructor = Child;
    };
}());

/**
 * Alerts a message in any available way: alert or console.log.
 */
utils.alert = function(msg) {
    if (window.alert) {
        window.alert(msg);
    } else if (console && console.log) {
        console.log(msg);
    }
};


//------------------------------------------------------------------------------
function UUIDcreatePart(length) {
    var uuidpart = "";
    for (var i=0; i<length; i++) {
        var uuidchar = parseInt((Math.random() * 256), 10).toString(16);
        if (uuidchar.length == 1) {
            uuidchar = "0" + uuidchar;
        }
        uuidpart += uuidchar;
    }
    return uuidpart;
}


});

window.cordova = require('cordova');
// file: lib/scripts/bootstrap.js

(function (context) {
    if (context._cordovaJsLoaded) {
        throw new Error('cordova.js included multiple times.');
    }
    context._cordovaJsLoaded = true;

    var channel = require('cordova/channel');
    var pluginloader = require('cordova/pluginloader');

    var platformInitChannelsArray = [channel.onNativeReady, channel.onPluginsReady];

    function logUnfiredChannels(arr) {
        for (var i = 0; i < arr.length; ++i) {
            if (arr[i].state != 2) {
                console.log('Channel not fired: ' + arr[i].type);
            }
        }
    }

    window.setTimeout(function() {
        if (channel.onDeviceReady.state != 2) {
            console.log('deviceready has not fired after 5 seconds.');
            logUnfiredChannels(platformInitChannelsArray);
            logUnfiredChannels(channel.deviceReadyChannelsArray);
        }
    }, 5000);

    // Replace navigator before any modules are required(), to ensure it happens as soon as possible.
    // We replace it so that properties that can't be clobbered can instead be overridden.
    function replaceNavigator(origNavigator) {
        var CordovaNavigator = function() {};
        CordovaNavigator.prototype = origNavigator;
        var newNavigator = new CordovaNavigator();
        // This work-around really only applies to new APIs that are newer than Function.bind.
        // Without it, APIs such as getGamepads() break.
        if (CordovaNavigator.bind) {
            for (var key in origNavigator) {
                if (typeof origNavigator[key] == 'function') {
                    newNavigator[key] = origNavigator[key].bind(origNavigator);
                }
            }
        }
        return newNavigator;
    }
    if (context.navigator) {
        context.navigator = replaceNavigator(context.navigator);
    }

    // _nativeReady is global variable that the native side can set
    // to signify that the native code is ready. It is a global since
    // it may be called before any cordova JS is ready.
    if (window._nativeReady) {
        channel.onNativeReady.fire();
    }

    /**
     * Create all cordova objects once native side is ready.
     */
    channel.join(function() {
        // Call the platform-specific initialization
        require('cordova/platform').initialize();

        // Fire event to notify that all objects are created
        channel.onCordovaReady.fire();

        // Fire onDeviceReady event once page has fully loaded, all
        // constructors have run and cordova info has been received from native
        // side.
        // This join call is deliberately made after platform.initialize() in
        // order that plugins may manipulate channel.deviceReadyChannelsArray
        // if necessary.
        channel.join(function() {
            require('cordova').fireDocumentEvent('deviceready');
        }, channel.deviceReadyChannelsArray);

    }, platformInitChannelsArray);

    // Don't attempt to load when running unit tests.
    if (typeof XMLHttpRequest != 'undefined') {
        pluginloader.load();
    }
}(window));

// file: lib/scripts/bootstrap-tizen.js

require('cordova/channel').onNativeReady.fire();

})();