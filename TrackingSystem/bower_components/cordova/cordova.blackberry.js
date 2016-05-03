// Platform: blackberry
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

// file: lib/blackberry/exec.js
define("cordova/exec", function(require, exports, module) {

var cordova = require('cordova'),
    platform = require('cordova/platform'),
    utils = require('cordova/utils');

/**
 * Execute a cordova command.  It is up to the native side whether this action
 * is synchronous or asynchronous.  The native side can return:
 *      Synchronous: PluginResult object as a JSON string
 *      Asynchronous: Empty string ""
 * If async, the native side will cordova.callbackSuccess or cordova.callbackError,
 * depending upon the result of the action.
 *
 * @param {Function} success    The success callback
 * @param {Function} fail       The fail callback
 * @param {String} service      The name of the service to use
 * @param {String} action       Action to be run in cordova
 * @param {String[]} [args]     Zero or more arguments to pass to the method
 */

module.exports = function(success, fail, service, action, args) {
    try {
        var manager = require('cordova/plugin/' + platform.runtime() + '/manager'),
            v = manager.exec(success, fail, service, action, args);

        // If status is OK, then return value back to caller
        if (v.status == cordova.callbackStatus.OK) {

            // If there is a success callback, then call it now with returned value
            if (success) {
                try {
                    success(v.message);
                }
                catch (e) {
                    console.log("Error in success callback: "+cordova.callbackId+" = "+e);
                }
            }
            return v.message;
        } else if (v.status == cordova.callbackStatus.NO_RESULT) {

        } else {
            // If error, then display error
            console.log("Error: Status="+v.status+" Message="+v.message);

            // If there is a fail callback, then call it now with returned value
            if (fail) {
                try {
                    fail(v.message);
                }
                catch (e) {
                    console.log("Error in error callback: "+cordova.callbackId+" = "+e);
                }
            }
            return null;
        }
    } catch (e) {
        utils.alert("Error: "+e);
    }
};

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

// file: lib/blackberry/platform.js
define("cordova/platform", function(require, exports, module) {

module.exports = {
    id: "blackberry",
    runtime: function () {
        if (navigator.userAgent.indexOf("PlayBook") > -1) {
            return 'air';
        }
        else if (navigator.userAgent.indexOf("BlackBerry") > -1) {
            return 'java';
        }
        else {
            console.log("Unknown user agent?!?!? defaulting to java");
            return 'java';
        }
    },
    initialize: function() {
        var modulemapper = require('cordova/modulemapper'),
            platform = require('cordova/plugin/' + this.runtime() + '/platform');

        modulemapper.loadMatchingModules(/cordova.*\/symbols$/);
        modulemapper.loadMatchingModules(new RegExp('cordova/.*' + this.runtime() + '/.*bbsymbols$'));
        modulemapper.mapModules(this.contextObj);

        platform.initialize();
    },
    contextObj: this // Used for testing.
};

});

// file: lib/blackberry/plugin/air/DirectoryEntry.js
define("cordova/plugin/air/DirectoryEntry", function(require, exports, module) {

var DirectoryEntry = require('cordova/plugin/DirectoryEntry'),
    DirectoryReader = require('cordova/plugin/air/DirectoryReader'),
    FileEntry = require('cordova/plugin/FileEntry'),
    FileError = require('cordova/plugin/FileError');

var validFileRe = new RegExp('^[a-zA-Z][0-9a-zA-Z._ ]*$');

module.exports = {
    createReader : function() {
        return new DirectoryReader(this.fullPath);
    },
    /**
     * Creates or looks up a directory; override for BlackBerry.
     *
     * @param path
     *            {DOMString} either a relative or absolute path from this
     *            directory in which to look up or create a directory
     * @param options
     *            {Flags} options to create or exclusively create the directory
     * @param successCallback
     *            {Function} called with the new DirectoryEntry
     * @param errorCallback
     *            {Function} called with a FileError
     */
    getDirectory : function(path, options, successCallback, errorCallback) {
    // create directory if it doesn't exist
        var create = (options && options.create === true) ? true : false,
        // if true, causes failure if create is true and path already exists
        exclusive = (options && options.exclusive === true) ? true : false,
        // directory exists
        exists,
        // create a new DirectoryEntry object and invoke success callback
        createEntry = function() {
            var path_parts = path.split('/'),
                name = path_parts[path_parts.length - 1],
                dirEntry = new DirectoryEntry(name, path);

            // invoke success callback
            if (typeof successCallback === 'function') {
                successCallback(dirEntry);
            }
        };

        var fail = function(error) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(error));
            }
        };

        // invalid path
        if(!validFileRe.exec(path)){
            fail(FileError.ENCODING_ERR);
            return;
        }

        // determine if path is relative or absolute
        if (!path) {
            fail(FileError.ENCODING_ERR);
            return;
        } else if (path.indexOf(this.fullPath) !== 0) {
            // path does not begin with the fullPath of this directory
            // therefore, it is relative
            path = this.fullPath + '/' + path;
        }

        // determine if directory exists
        try {
            // will return true if path exists AND is a directory
            exists = blackberry.io.dir.exists(path);
        } catch (e) {
            // invalid path
            // TODO this will not work on playbook - need to think how to find invalid urls
            fail(FileError.ENCODING_ERR);
            return;
        }


        // path is a directory
        if (exists) {
            if (create && exclusive) {
                // can't guarantee exclusivity
                fail(FileError.PATH_EXISTS_ERR);
            } else {
                // create entry for existing directory
                createEntry();
            }
        }
        // will return true if path exists AND is a file
        else if (blackberry.io.file.exists(path)) {
            // the path is a file
            fail(FileError.TYPE_MISMATCH_ERR);
        }
        // path does not exist, create it
        else if (create) {
            try {
                // directory path must have trailing slash
                var dirPath = path;
                if (dirPath.substr(-1) !== '/') {
                    dirPath += '/';
                }
                console.log('creating dir path at: ' + dirPath);
                blackberry.io.dir.createNewDir(dirPath);
                createEntry();
            } catch (eone) {
                // unable to create directory
                fail(FileError.NOT_FOUND_ERR);
            }
        }
        // path does not exist, don't create
        else {
            // directory doesn't exist
            fail(FileError.NOT_FOUND_ERR);
        }
    },

    /**
     * Create or look up a file.
     *
     * @param path {DOMString}
     *            either a relative or absolute path from this directory in
     *            which to look up or create a file
     * @param options {Flags}
     *            options to create or exclusively create the file
     * @param successCallback {Function}
     *            called with the new FileEntry object
     * @param errorCallback {Function}
     *            called with a FileError object if error occurs
     */
    getFile : function(path, options, successCallback, errorCallback) {
        // create file if it doesn't exist
        var create = (options && options.create === true) ? true : false,
            // if true, causes failure if create is true and path already exists
            exclusive = (options && options.exclusive === true) ? true : false,
            // file exists
            exists,
            // create a new FileEntry object and invoke success callback
            createEntry = function() {
                var path_parts = path.split('/'),
                    name = path_parts[path_parts.length - 1],
                    fileEntry = new FileEntry(name, path);

                // invoke success callback
                if (typeof successCallback === 'function') {
                    successCallback(fileEntry);
                }
            };

        var fail = function(error) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(error));
            }
        };

        // invalid path
        if(!validFileRe.exec(path)){
            fail(FileError.ENCODING_ERR);
            return;
        }
        // determine if path is relative or absolute
        if (!path) {
            fail(FileError.ENCODING_ERR);
            return;
        }
        else if (path.indexOf(this.fullPath) !== 0) {
            // path does not begin with the fullPath of this directory
            // therefore, it is relative
            path = this.fullPath + '/' + path;
        }

        // determine if file exists
        try {
            // will return true if path exists AND is a file
            exists = blackberry.io.file.exists(path);
        }
        catch (e) {
            // invalid path
            fail(FileError.ENCODING_ERR);
            return;
        }

        // path is a file
        if (exists) {
            if (create && exclusive) {
                // can't guarantee exclusivity
                fail(FileError.PATH_EXISTS_ERR);
            }
            else {
                // create entry for existing file
                createEntry();
            }
        }
        // will return true if path exists AND is a directory
        else if (blackberry.io.dir.exists(path)) {
            // the path is a directory
            fail(FileError.TYPE_MISMATCH_ERR);
        }
        // path does not exist, create it
        else if (create) {
            // create empty file
            var emptyBlob = blackberry.utils.stringToBlob('');
            blackberry.io.file.saveFile(path,emptyBlob);
            createEntry();
        }
        // path does not exist, don't create
        else {
            // file doesn't exist
            fail(FileError.NOT_FOUND_ERR);
        }
    },

    /**
     * Delete a directory and all of it's contents.
     *
     * @param successCallback {Function} called with no parameters
     * @param errorCallback {Function} called with a FileError
     */
    removeRecursively : function(successCallback, errorCallback) {
        // we're removing THIS directory
        var path = this.fullPath;

        var fail = function(error) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(error));
            }
        };

        // attempt to delete directory
        if (blackberry.io.dir.exists(path)) {
            // it is an error to attempt to remove the file system root
            //exec(null, null, "File", "isFileSystemRoot", [ path ]) === true
            if (false) {
                fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
            }
            else {
                try {
                    // delete the directory, setting recursive flag to true
                    blackberry.io.dir.deleteDirectory(path, true);
                    if (typeof successCallback === "function") {
                        successCallback();
                    }
                } catch (e) {
                    // permissions don't allow deletion
                    console.log(e);
                    fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
                }
            }
        }
        // it's a file, not a directory
        else if (blackberry.io.file.exists(path)) {
            fail(FileError.TYPE_MISMATCH_ERR);
        }
        // not found
        else {
            fail(FileError.NOT_FOUND_ERR);
        }
    }
};

});

// file: lib/blackberry/plugin/air/DirectoryReader.js
define("cordova/plugin/air/DirectoryReader", function(require, exports, module) {

var FileError = require('cordova/plugin/FileError');

/**
 * An interface that lists the files and directories in a directory.
 */
function DirectoryReader(path) {
    this.path = path || null;
}

/**
 * Returns a list of entries from a directory.
 *
 * @param {Function} successCallback is called with a list of entries
 * @param {Function} errorCallback is called with a FileError
 */
DirectoryReader.prototype.readEntries = function(successCallback, errorCallback) {
    var win = typeof successCallback !== 'function' ? null : function(result) {
        var retVal = [];
        for (var i=0; i<result.length; i++) {
            var entry = null;
            if (result[i].isDirectory) {
                entry = new (require('cordova/plugin/DirectoryEntry'))();
            }
            else if (result[i].isFile) {
                entry = new (require('cordova/plugin/FileEntry'))();
            }
            entry.isDirectory = result[i].isDirectory;
            entry.isFile = result[i].isFile;
            entry.name = result[i].name;
            entry.fullPath = result[i].fullPath;
            retVal.push(entry);
        }
        successCallback(retVal);
    };
    var fail = typeof errorCallback !== 'function' ? null : function(code) {
        errorCallback(new FileError(code));
    };

    var theEntries = [];
    // Entry object is borked - unable to instantiate a new Entry object so just create one
    var anEntry = function (isDirectory, name, fullPath) {
        this.isDirectory = (isDirectory ? true : false);
        this.isFile = (isDirectory ? false : true);
        this.name = name;
        this.fullPath = fullPath;
    };

    if(blackberry.io.dir.exists(this.path)){
        var theDirectories = blackberry.io.dir.listDirectories(this.path);
        var theFiles = blackberry.io.dir.listFiles(this.path);

        var theDirectoriesLength = theDirectories.length;
        var theFilesLength = theFiles.length;
        for(var i=0;i<theDirectoriesLength;i++){
            theEntries.push(new anEntry(true, theDirectories[i], this.path+theDirectories[i]));
        }

        for(var j=0;j<theFilesLength;j++){
            theEntries.push(new anEntry(false, theFiles[j], this.path+theFiles[j]));
        }
        win(theEntries);
    }else{
        fail(FileError.NOT_FOUND_ERR);
    }


};

module.exports = DirectoryReader;

});

// file: lib/blackberry/plugin/air/Entry.js
define("cordova/plugin/air/Entry", function(require, exports, module) {

var FileError = require('cordova/plugin/FileError'),
    LocalFileSystem = require('cordova/plugin/LocalFileSystem'),
    Metadata = require('cordova/plugin/Metadata'),
    resolveLocalFileSystemURI = require('cordova/plugin/air/resolveLocalFileSystemURI'),
    DirectoryEntry = require('cordova/plugin/DirectoryEntry'),
    FileEntry = require('cordova/plugin/FileEntry'),
    requestFileSystem = require('cordova/plugin/air/requestFileSystem');

var recursiveCopy = function(srcDirPath, dstDirPath){
    // get all the contents (file+dir) of the dir
    var files = blackberry.io.dir.listFiles(srcDirPath);
    var dirs = blackberry.io.dir.listDirectories(srcDirPath);

    for(var i=0;i<files.length;i++){
        blackberry.io.file.copy(srcDirPath + '/' + files[i], dstDirPath + '/' + files[i]);
    }

    for(var j=0;j<dirs.length;j++){
        if(!blackberry.io.dir.exists(dstDirPath + '/' + dirs[j])){
            blackberry.io.dir.createNewDir(dstDirPath + '/' + dirs[j]);
        }
        recursiveCopy(srcDirPath + '/' + dirs[j], dstDirPath + '/' + dirs[j]);
    }
};

var validFileRe = new RegExp('^[a-zA-Z][0-9a-zA-Z._ ]*$');

module.exports = {
    getMetadata : function(successCallback, errorCallback){
        var success = typeof successCallback !== 'function' ? null : function(lastModified) {
          var metadata = new Metadata(lastModified);
          successCallback(metadata);
        };
        var fail = typeof errorCallback !== 'function' ? null : function(code) {
          errorCallback(new FileError(code));
        };

        if(this.isFile){
            if(blackberry.io.file.exists(this.fullPath)){
                var theFileProperties = blackberry.io.file.getFileProperties(this.fullPath);
                success(theFileProperties.dateModified);
            }
        }else{
            console.log('Unsupported for directories');
            fail(FileError.INVALID_MODIFICATION_ERR);
        }
    },

    setMetadata : function(successCallback, errorCallback , metadataObject){
        console.log('setMetadata is unsupported for PlayBook');
    },

    moveTo : function(parent, newName, successCallback, errorCallback){
        var fail = function(code) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(code));
            }
        };
        // user must specify parent Entry
        if (!parent) {
            fail(FileError.NOT_FOUND_ERR);
            return;
        }
        // source path
        var srcPath = this.fullPath,
            // entry name
            name = newName || this.name,
            success = function(entry) {
                if (entry) {
                    if (typeof successCallback === 'function') {
                        // create appropriate Entry object
                        var result = (entry.isDirectory) ? new DirectoryEntry(entry.name, entry.fullPath) : new FileEntry(entry.name, entry.fullPath);
                        try {
                            successCallback(result);
                        }
                        catch (e) {
                            console.log('Error invoking callback: ' + e);
                        }
                    }
                }
                else {
                    // no Entry object returned
                    fail(FileError.NOT_FOUND_ERR);
                }
            };


        // Entry object is borked
        var theEntry = {};
        var dstPath = parent.fullPath + '/' + name;

        // invalid path
        if(!validFileRe.exec(name)){
            fail(FileError.ENCODING_ERR);
            return;
        }

        if(this.isFile){
            if(srcPath != dstPath){
                if(blackberry.io.file.exists(dstPath)){
                    blackberry.io.file.deleteFile(dstPath);
                    blackberry.io.file.copy(srcPath,dstPath);
                    blackberry.io.file.deleteFile(srcPath);

                    theEntry.fullPath = dstPath;
                    theEntry.name = name;
                    theEntry.isDirectory = false;
                    theEntry.isFile = true;
                    success(theEntry);
                }else if(blackberry.io.dir.exists(dstPath)){
                    // destination path is a directory
                    fail(FileError.INVALID_MODIFICATION_ERR);
                }else{
                    // make sure the directory that we are moving to actually exists
                    if(blackberry.io.dir.exists(parent.fullPath)){
                        blackberry.io.file.copy(srcPath,dstPath);
                        blackberry.io.file.deleteFile(srcPath);

                        theEntry.fullPath = dstPath;
                        theEntry.name = name;
                        theEntry.isDirectory = false;
                        theEntry.isFile = true;
                        success(theEntry);
                    }else{
                        fail(FileError.NOT_FOUND_ERR);
                    }
                }
            }else{
                // file onto itself
                fail(FileError.INVALID_MODIFICATION_ERR);
            }
        }else{
            if(srcPath != dstPath){
                if(blackberry.io.file.exists(dstPath) || srcPath == parent.fullPath){
                    // destination path is either a file path or moving into parent
                    fail(FileError.INVALID_MODIFICATION_ERR);
                }else{
                    if(!blackberry.io.dir.exists(dstPath)){
                        blackberry.io.dir.createNewDir(dstPath);
                        recursiveCopy(srcPath,dstPath);
                        blackberry.io.dir.deleteDirectory(srcPath, true);
                        theEntry.fullPath = dstPath;
                        theEntry.name = name;
                        theEntry.isDirectory = true;
                        theEntry.isFile = false;
                        success(theEntry);
                    }else{
                        var numOfEntries = 0;
                        numOfEntries += blackberry.io.dir.listDirectories(dstPath).length;
                        numOfEntries += blackberry.io.dir.listFiles(dstPath).length;
                        if(numOfEntries === 0){
                            blackberry.io.dir.createNewDir(dstPath);
                            recursiveCopy(srcPath,dstPath);
                            blackberry.io.dir.deleteDirectory(srcPath, true);
                            theEntry.fullPath = dstPath;
                            theEntry.name = name;
                            theEntry.isDirectory = true;
                            theEntry.isFile = false;
                            success(theEntry);
                        }else{
                            // destination directory not empty
                            fail(FileError.INVALID_MODIFICATION_ERR);
                        }
                    }
                }
            }else{
                // directory onto itself
                fail(FileError.INVALID_MODIFICATION_ERR);
            }
        }

    },

    copyTo : function(parent, newName, successCallback, errorCallback) {
        var fail = function(code) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(code));
            }
        };
        // user must specify parent Entry
        if (!parent) {
            fail(FileError.NOT_FOUND_ERR);
            return;
        }
        // source path
        var srcPath = this.fullPath,
            // entry name
            name = newName || this.name,
            success = function(entry) {
                if (entry) {
                    if (typeof successCallback === 'function') {
                        // create appropriate Entry object
                        var result = (entry.isDirectory) ? new DirectoryEntry(entry.name, entry.fullPath) : new FileEntry(entry.name, entry.fullPath);
                        try {
                            successCallback(result);
                        }
                        catch (e) {
                            console.log('Error invoking callback: ' + e);
                        }
                    }
                }
                else {
                    // no Entry object returned
                    fail(FileError.NOT_FOUND_ERR);
                }
            };

        // Entry object is borked
        var theEntry = {};
        var dstPath = parent.fullPath + '/' + name;

        // invalid path
        if(!validFileRe.exec(name)){
            fail(FileError.ENCODING_ERR);
            return;
        }

        if(this.isFile){
            if(srcPath != dstPath){
                if(blackberry.io.file.exists(dstPath)){
                    if(blackberry.io.dir.exists(dstPath)){
                        blackberry.io.file.copy(srcPath,dstPath);

                        theEntry.fullPath = dstPath;
                        theEntry.name = name;
                        theEntry.isDirectory = false;
                        theEntry.isFile = true;
                        success(theEntry);
                    }else{
                        // destination directory doesn't exist
                        fail(FileError.NOT_FOUND_ERR);
                    }

                }else{
                    blackberry.io.file.copy(srcPath,dstPath);

                    theEntry.fullPath = dstPath;
                    theEntry.name = name;
                    theEntry.isDirectory = false;
                    theEntry.isFile = true;
                    success(theEntry);
                }
            }else{
                // file onto itself
                fail(FileError.INVALID_MODIFICATION_ERR);
            }
        }else{
            if(srcPath != dstPath){
                // allow back up to the root but not child dirs
                if((parent.name != "root" && dstPath.indexOf(srcPath)>=0) || blackberry.io.file.exists(dstPath)){
                    // copying directory into child or is file path
                    fail(FileError.INVALID_MODIFICATION_ERR);
                }else{
                    recursiveCopy(srcPath, dstPath);

                    theEntry.fullPath = dstPath;
                    theEntry.name = name;
                    theEntry.isDirectory = true;
                    theEntry.isFile = false;
                    success(theEntry);
                }
            }else{
                // directory onto itself
                fail(FileError.INVALID_MODIFICATION_ERR);
            }
        }

    },

    remove : function(successCallback, errorCallback) {
        var path = this.fullPath,
            // directory contents
            contents = [];

        var fail = function(error) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(error));
            }
        };

        // file
        if (blackberry.io.file.exists(path)) {
            try {
                blackberry.io.file.deleteFile(path);
                if (typeof successCallback === "function") {
                    successCallback();
                }
            } catch (e) {
                // permissions don't allow
                fail(FileError.INVALID_MODIFICATION_ERR);
            }
        }
        // directory
        else if (blackberry.io.dir.exists(path)) {
            // it is an error to attempt to remove the file system root
            console.log('entry directory');
            // TODO: gotta figure out how to get root dirs on playbook -
            // getRootDirs doesn't work
            if (false) {
                fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
            } else {
                // check to see if directory is empty
                contents = blackberry.io.dir.listFiles(path);
                if (contents.length !== 0) {
                    fail(FileError.INVALID_MODIFICATION_ERR);
                } else {
                    try {
                        // delete
                        blackberry.io.dir.deleteDirectory(path, false);
                        if (typeof successCallback === "function") {
                            successCallback();
                        }
                    } catch (eone) {
                        // permissions don't allow
                        fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
                    }
                }
            }
        }
        // not found
        else {
            fail(FileError.NOT_FOUND_ERR);
        }
    },
    getParent : function(successCallback, errorCallback) {
        var that = this;

        try {
            // On BlackBerry, the TEMPORARY file system is actually a temporary
            // directory that is created on a per-application basis. This is
            // to help ensure that applications do not share the same temporary
            // space. So we check to see if this is the TEMPORARY file system
            // (directory). If it is, we must return this Entry, rather than
            // the Entry for its parent.
            requestFileSystem(LocalFileSystem.TEMPORARY, 0,
                    function(fileSystem) {
                        if (fileSystem.root.fullPath === that.fullPath) {
                            if (typeof successCallback === 'function') {
                                successCallback(fileSystem.root);
                            }
                        } else {
                            resolveLocalFileSystemURI(blackberry.io.dir
                                    .getParentDirectory(that.fullPath),
                                    successCallback, errorCallback);
                        }
                    }, errorCallback);
        } catch (e) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(FileError.NOT_FOUND_ERR));
            }
        }
    }
};


});

// file: lib/blackberry/plugin/air/File.js
define("cordova/plugin/air/File", function(require, exports, module) {

/**
 * Constructor.
 * name {DOMString} name of the file, without path information
 * fullPath {DOMString} the full path of the file, including the name
 * type {DOMString} mime type
 * lastModifiedDate {Date} last modified date
 * size {Number} size of the file in bytes
 */

var File = function(name, fullPath, type, lastModifiedDate, size){
    this.name = name || '';
    this.fullPath = fullPath || null;
    this.type = type || null;
    this.lastModifiedDate = lastModifiedDate || null;
    this.size = size || 0;
};

module.exports = File;

});

// file: lib/blackberry/plugin/air/FileEntry.js
define("cordova/plugin/air/FileEntry", function(require, exports, module) {

var FileEntry = require('cordova/plugin/FileEntry'),
    Entry = require('cordova/plugin/air/Entry'),
    FileWriter = require('cordova/plugin/air/FileWriter'),
    File = require('cordova/plugin/air/File'),
    FileError = require('cordova/plugin/FileError');

module.exports = {
    /**
     * Creates a new FileWriter associated with the file that this FileEntry represents.
     *
     * @param {Function} successCallback is called with the new FileWriter
     * @param {Function} errorCallback is called with a FileError
     */
    createWriter : function(successCallback, errorCallback) {
        this.file(function(filePointer) {
            var writer = new FileWriter(filePointer);

            if (writer.fileName === null || writer.fileName === "") {
                if (typeof errorCallback === "function") {
                    errorCallback(new FileError(FileError.INVALID_STATE_ERR));
                }
            } else {
                if (typeof successCallback === "function") {
                    successCallback(writer);
                }
            }
        }, errorCallback);
    },

    /**
     * Returns a File that represents the current state of the file that this FileEntry represents.
     *
     * @param {Function} successCallback is called with the new File object
     * @param {Function} errorCallback is called with a FileError
     */
    file : function(successCallback, errorCallback) {
        var win = typeof successCallback !== 'function' ? null : function(f) {
            var file = new File(f.name, f.fullPath, f.type, f.lastModifiedDate, f.size);
            successCallback(file);
        };
        var fail = typeof errorCallback !== 'function' ? null : function(code) {
            errorCallback(new FileError(code));
        };

        if(blackberry.io.file.exists(this.fullPath)){
            var theFileProperties = blackberry.io.file.getFileProperties(this.fullPath);
            var theFile = {};

            theFile.fullPath = this.fullPath;
            theFile.type = theFileProperties.fileExtension;
            theFile.lastModifiedDate = theFileProperties.dateModified;
            theFile.size = theFileProperties.size;
            win(theFile);
        }else{
            fail(FileError.NOT_FOUND_ERR);
        }
    }
};


});

// file: lib/blackberry/plugin/air/FileReader.js
define("cordova/plugin/air/FileReader", function(require, exports, module) {

var FileError = require('cordova/plugin/FileError'),
    ProgressEvent = require('cordova/plugin/ProgressEvent');

/**
 * This class reads the mobile device file system.
 *
 * For Android:
 *      The root directory is the root of the file system.
 *      To read from the SD card, the file name is "sdcard/my_file.txt"
 * @constructor
 */
var FileReader = function() {
    this.fileName = "";

    this.readyState = 0; // FileReader.EMPTY

    // File data
    this.result = null;

    // Error
    this.error = null;

    // Event handlers
    this.onloadstart = null;    // When the read starts.
    this.onprogress = null;     // While reading (and decoding) file or fileBlob data, and reporting partial file data (progress.loaded/progress.total)
    this.onload = null;         // When the read has successfully completed.
    this.onerror = null;        // When the read has failed (see errors).
    this.onloadend = null;      // When the request has completed (either in success or failure).
    this.onabort = null;        // When the read has been aborted. For instance, by invoking the abort() method.
};

// States
FileReader.EMPTY = 0;
FileReader.LOADING = 1;
FileReader.DONE = 2;

/**
 * Abort reading file.
 */
FileReader.prototype.abort = function() {
    this.result = null;

    if (this.readyState == FileReader.DONE || this.readyState == FileReader.EMPTY) {
      return;
    }

    this.readyState = FileReader.DONE;

    // If abort callback
    if (typeof this.onabort === 'function') {
        this.onabort(new ProgressEvent('abort', {target:this}));
    }
    // If load end callback
    if (typeof this.onloadend === 'function') {
        this.onloadend(new ProgressEvent('loadend', {target:this}));
    }
};

/**
 * Read text file.
 *
 * @param file          {File} File object containing file properties
 * @param encoding      [Optional] (see http://www.iana.org/assignments/character-sets)
 */
FileReader.prototype.readAsText = function(file, encoding) {
    // Figure out pathing
    this.fileName = '';
    if (typeof file.fullPath === 'undefined') {
        this.fileName = file;
    } else {
        this.fileName = file.fullPath;
    }

    // Already loading something
    if (this.readyState == FileReader.LOADING) {
        throw new FileError(FileError.INVALID_STATE_ERR);
    }

    // LOADING state
    this.readyState = FileReader.LOADING;

    // If loadstart callback
    if (typeof this.onloadstart === "function") {
        this.onloadstart(new ProgressEvent("loadstart", {target:this}));
    }

    // Default encoding is UTF-8
    var enc = encoding ? encoding : "UTF-8";

    var me = this;
    // Read file
    if(blackberry.io.file.exists(this.fileName)){
        var theText = '';
        var getFileContents = function(path,blob){
            if(blob){

                theText = blackberry.utils.blobToString(blob, enc);
                me.result = theText;

                if (typeof me.onload === "function") {
                    me.onload(new ProgressEvent("load", {target:me}));
                }

                me.readyState = FileReader.DONE;

                if (typeof me.onloadend === "function") {
                    me.onloadend(new ProgressEvent("loadend", {target:me}));
                }
            }
        };
        // setting asynch to off
        blackberry.io.file.readFile(this.fileName, getFileContents, false);

    }else{
        // If DONE (cancelled), then don't do anything
        if (me.readyState === FileReader.DONE) {
            return;
        }

        // DONE state
        me.readyState = FileReader.DONE;

        me.result = null;

        // Save error
        me.error = new FileError(FileError.NOT_FOUND_ERR);

        // If onerror callback
        if (typeof me.onerror === "function") {
            me.onerror(new ProgressEvent("error", {target:me}));
        }

        // If onloadend callback
        if (typeof me.onloadend === "function") {
            me.onloadend(new ProgressEvent("loadend", {target:me}));
        }
    }
};


/**
 * Read file and return data as a base64 encoded data url.
 * A data url is of the form:
 *      data:[<mediatype>][;base64],<data>
 *
 * @param file          {File} File object containing file properties
 */
FileReader.prototype.readAsDataURL = function(file) {
    this.fileName = "";
    if (typeof file.fullPath === "undefined") {
        this.fileName = file;
    } else {
        this.fileName = file.fullPath;
    }

    // Already loading something
    if (this.readyState == FileReader.LOADING) {
        throw new FileError(FileError.INVALID_STATE_ERR);
    }

    // LOADING state
    this.readyState = FileReader.LOADING;

    // If loadstart callback
    if (typeof this.onloadstart === "function") {
        this.onloadstart(new ProgressEvent("loadstart", {target:this}));
    }

    var enc = "BASE64";

    var me = this;

    // Read file
    if(blackberry.io.file.exists(this.fileName)){
        var theText = '';
        var getFileContents = function(path,blob){
            if(blob){
                theText = blackberry.utils.blobToString(blob, enc);
                me.result = "data:text/plain;base64," +theText;

                if (typeof me.onload === "function") {
                    me.onload(new ProgressEvent("load", {target:me}));
                }

                me.readyState = FileReader.DONE;

                if (typeof me.onloadend === "function") {
                    me.onloadend(new ProgressEvent("loadend", {target:me}));
                }
            }
        };
        // setting asynch to off
        blackberry.io.file.readFile(this.fileName, getFileContents, false);

    }else{
        // If DONE (cancelled), then don't do anything
        if (me.readyState === FileReader.DONE) {
            return;
        }

        // DONE state
        me.readyState = FileReader.DONE;

        me.result = null;

        // Save error
        me.error = new FileError(FileError.NOT_FOUND_ERR);

        // If onerror callback
        if (typeof me.onerror === "function") {
            me.onerror(new ProgressEvent("error", {target:me}));
        }

        // If onloadend callback
        if (typeof me.onloadend === "function") {
            me.onloadend(new ProgressEvent("loadend", {target:me}));
        }
    }
};

/**
 * Read file and return data as a binary data.
 *
 * @param file          {File} File object containing file properties
 */
FileReader.prototype.readAsBinaryString = function(file) {
    // TODO - Can't return binary data to browser.
    console.log('method "readAsBinaryString" is not supported at this time.');
};

/**
 * Read file and return data as a binary data.
 *
 * @param file          {File} File object containing file properties
 */
FileReader.prototype.readAsArrayBuffer = function(file) {
    // TODO - Can't return binary data to browser.
    console.log('This method is not supported at this time.');
};

module.exports = FileReader;

});

// file: lib/blackberry/plugin/air/FileTransfer.js
define("cordova/plugin/air/FileTransfer", function(require, exports, module) {

var cordova = require('cordova'),
FileTransferError = require('cordova/plugin/FileTransferError'),
FileUploadResult = require('cordova/plugin/FileUploadResult');

var validURLProtocol = new RegExp('^(https?|ftp):\/\/');

function getParentPath(filePath) {
    var pos = filePath.lastIndexOf('/');
    return filePath.substring(0, pos + 1);
}

function getFileName(filePath) {
    var pos = filePath.lastIndexOf('/');
    return filePath.substring(pos + 1);
}

module.exports = {
    upload: function (args, win, fail) {
        var filePath = args[0],
            server = args[1],
            fileKey = args[2],
            fileName = args[3],
            mimeType = args[4],
            params = args[5],
            trustAllHosts = args[6],
            chunkedMode = args[7],
            headers = args[8];

        if(!validURLProtocol.exec(server)){
            return { "status" : cordova.callbackStatus.ERROR, "message" : new FileTransferError(FileTransferError.INVALID_URL_ERR) };
        }

        window.resolveLocalFileSystemURI(filePath, fileWin, fail);

        function fileWin(entryObject){
            blackberry.io.file.readFile(filePath, readWin, false);
        }

        function readWin(filePath, blobFile){
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
                    result.bytesSent = xhr.response.length;
                    result.responseCode = xhr.status;
                    result.response = xhr.response;
                    win(result);
                } else if (xhr.status == 404) {
                    fail(new FileTransferError(FileTransferError.INVALID_URL_ERR, null, null, xhr.status));
                } else if (xhr.status == 403) {
                    fail(new FileTransferError(FileTransferError.INVALID_URL_ERR, null, null, xhr.status));
                } else {
                    fail(new FileTransferError(FileTransferError.CONNECTION_ERR, null, null, xhr.status));
                }
            };
            xhr.ontimeout = function(evt) {
                fail(new FileTransferError(FileTransferError.CONNECTION_ERR, null, null, xhr.status));
            };

            if(headers){
                for(var i in headers){
                    xhr.setRequestHeader(i, headers[i]);
                }
            }
            xhr.send(fd);
        }

        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    },

    download: function(args, win, fail){
        var url = args[0],
            filePath = args[1];

        if(!validURLProtocol.exec(url)){
            return { "status" : cordova.callbackStatus.ERROR, "message" : new FileTransferError(FileTransferError.INVALID_URL_ERR) };
        }

        var xhr = new XMLHttpRequest();

        function writeFile(fileEntry) {
            fileEntry.createWriter(function(writer) {
                writer.onwriteend = function(evt) {
                    if (!evt.target.error) {
                        win(new window.FileEntry(fileEntry.name, fileEntry.toURL()));
                    } else {
                        fail(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR));
                    }
                };

                writer.onerror = function(evt) {
                    fail(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR));
                };

                var blob = blackberry.utils.stringToBlob(xhr.response);
                writer.write(blob);

            },
            function(error) {
                fail(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR));
            });
        }

        xhr.onreadystatechange = function () {
            if (xhr.readyState == xhr.DONE) {
                if (xhr.status == 200 && xhr.response) {
                    window.resolveLocalFileSystemURI(getParentPath(filePath), function(dir) {
                        dir.getFile(getFileName(filePath), {create: true}, writeFile, function(error) {
                            fail(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR));
                        });
                    }, function(error) {
                        fail(new FileTransferError(FileTransferError.FILE_NOT_FOUND_ERR));
                    });
                } else if (xhr.status == 404) {
                    fail(new FileTransferError(FileTransferError.INVALID_URL_ERR, null, null, xhr.status));
                } else {
                    fail(new FileTransferError(FileTransferError.CONNECTION_ERR, null, null, xhr.status));
                }
            }
        };

        xhr.open("GET", url, true);
        xhr.responseType = "arraybuffer";
        xhr.send();

        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    }
};

});

// file: lib/blackberry/plugin/air/FileWriter.js
define("cordova/plugin/air/FileWriter", function(require, exports, module) {

var FileError = require('cordova/plugin/FileError'),
    ProgressEvent = require('cordova/plugin/ProgressEvent');

/**
 * @constructor
 * @param file {File} File object containing file properties
 * @param append if true write to the end of the file, otherwise overwrite the file
 */
var FileWriter = function(file) {
    this.fileName = "";
    this.length = 0;
    if (file) {
        this.fileName = file.fullPath || file;
        this.length = file.size || 0;
    }
    // default is to write at the beginning of the file
    this.position = 0;

    this.readyState = 0; // EMPTY

    this.result = null;

    // Error
    this.error = null;

    // Event handlers
    this.onwritestart = null;   // When writing starts
    this.onprogress = null;     // While writing the file, and reporting partial file data
    this.onwrite = null;        // When the write has successfully completed.
    this.onwriteend = null;     // When the request has completed (either in success or failure).
    this.onabort = null;        // When the write has been aborted. For instance, by invoking the abort() method.
    this.onerror = null;        // When the write has failed (see errors).
};

// States
FileWriter.INIT = 0;
FileWriter.WRITING = 1;
FileWriter.DONE = 2;

/**
 * Abort writing file.
 */
FileWriter.prototype.abort = function() {
    // check for invalid state
    if (this.readyState === FileWriter.DONE || this.readyState === FileWriter.INIT) {
        throw new FileError(FileError.INVALID_STATE_ERR);
    }

    // set error
    this.error = new FileError(FileError.ABORT_ERR);

    this.readyState = FileWriter.DONE;

    // If abort callback
    if (typeof this.onabort === "function") {
        this.onabort(new ProgressEvent("abort", {"target":this}));
    }

    // If write end callback
    if (typeof this.onwriteend === "function") {
        this.onwriteend(new ProgressEvent("writeend", {"target":this}));
    }
};

/**
 * Writes data to the file
 *
 * @param text to be written
 */
FileWriter.prototype.write = function(text) {
    // Throw an exception if we are already writing a file
    if (this.readyState === FileWriter.WRITING) {
        throw new FileError(FileError.INVALID_STATE_ERR);
    }

    // WRITING state
    this.readyState = FileWriter.WRITING;

    var me = this;

    // If onwritestart callback
    if (typeof me.onwritestart === "function") {
        me.onwritestart(new ProgressEvent("writestart", {"target":me}));
    }

    var textBlob = blackberry.utils.stringToBlob(text);

    if(blackberry.io.file.exists(this.fileName)){

        var oldText = '';
        var newText = text;

        var getFileContents = function(path,blob){

            if(blob){
                oldText = blackberry.utils.blobToString(blob);
                if(oldText.length>0){
                    newText = oldText.substr(0,me.position) + text;
                }
            }

            var tempFile = me.fileName+'temp';
            if(blackberry.io.file.exists(tempFile)){
                blackberry.io.file.deleteFile(tempFile);
            }

            var newTextBlob = blackberry.utils.stringToBlob(newText);

            // crete a temp file, delete file we are 'overwriting', then rename temp file
            blackberry.io.file.saveFile(tempFile, newTextBlob);
            blackberry.io.file.deleteFile(me.fileName);
            blackberry.io.file.rename(tempFile, me.fileName.split('/').pop());

            me.position = newText.length;
            me.length = me.position;

            if (typeof me.onwrite === "function") {
                me.onwrite(new ProgressEvent("write", {"target":me}));
            }
        };

        // setting asynch to off
        blackberry.io.file.readFile(this.fileName, getFileContents, false);

    }else{

        // file is new so just save it
        blackberry.io.file.saveFile(this.fileName, textBlob);
        me.position = text.length;
        me.length = me.position;
    }

    me.readyState = FileWriter.DONE;

    if (typeof me.onwriteend === "function") {
                me.onwriteend(new ProgressEvent("writeend", {"target":me}));
    }
};

/**
 * Moves the file pointer to the location specified.
 *
 * If the offset is a negative number the position of the file
 * pointer is rewound.  If the offset is greater than the file
 * size the position is set to the end of the file.
 *
 * @param offset is the location to move the file pointer to.
 */
FileWriter.prototype.seek = function(offset) {
    // Throw an exception if we are already writing a file
    if (this.readyState === FileWriter.WRITING) {
        throw new FileError(FileError.INVALID_STATE_ERR);
    }

    if (!offset && offset !== 0) {
        return;
    }

    // See back from end of file.
    if (offset < 0) {
        this.position = Math.max(offset + this.length, 0);
    }
    // Offset is bigger than file size so set position
    // to the end of the file.
    else if (offset > this.length) {
        this.position = this.length;
    }
    // Offset is between 0 and file size so set the position
    // to start writing.
    else {
        this.position = offset;
    }
};

/**
 * Truncates the file to the size specified.
 *
 * @param size to chop the file at.
 */
FileWriter.prototype.truncate = function(size) {
    // Throw an exception if we are already writing a file
    if (this.readyState === FileWriter.WRITING) {
        throw new FileError(FileError.INVALID_STATE_ERR);
    }

    // WRITING state
    this.readyState = FileWriter.WRITING;

    var me = this;

    // If onwritestart callback
    if (typeof me.onwritestart === "function") {
        me.onwritestart(new ProgressEvent("writestart", {"target":this}));
    }

    if(blackberry.io.file.exists(this.fileName)){

        var oldText = '';
        var newText = '';

        var getFileContents = function(path,blob){

            if(blob){
                oldText = blackberry.utils.blobToString(blob);
                if(oldText.length>0){
                    newText = oldText.slice(0,size);
                }else{
                    // TODO: throw error
                }
            }

            var tempFile = me.fileName+'temp';
            if(blackberry.io.file.exists(tempFile)){
                blackberry.io.file.deleteFile(tempFile);
            }

            var newTextBlob = blackberry.utils.stringToBlob(newText);

            // crete a temp file, delete file we are 'overwriting', then rename temp file
            blackberry.io.file.saveFile(tempFile, newTextBlob);
            blackberry.io.file.deleteFile(me.fileName);
            blackberry.io.file.rename(tempFile, me.fileName.split('/').pop());

            me.position = newText.length;
            me.length = me.position;

            if (typeof me.onwrite === "function") {
                 me.onwrite(new ProgressEvent("write", {"target":me}));
            }
        };

        // setting asynch to off - worry about making this all callbacks later
        blackberry.io.file.readFile(this.fileName, getFileContents, false);

    }else{

        // TODO: file doesn't exist - throw error

    }

    me.readyState = FileWriter.DONE;

    if (typeof me.onwriteend === "function") {
                me.onwriteend(new ProgressEvent("writeend", {"target":me}));
    }
};

module.exports = FileWriter;

});

// file: lib/blackberry/plugin/air/battery.js
define("cordova/plugin/air/battery", function(require, exports, module) {

var cordova = require('cordova');

module.exports = {
    start: function (args, win, fail) {
        // Register one listener to each of the level and state change
        // events using WebWorks API.
        blackberry.system.event.deviceBatteryStateChange(function(state) {
            var me = navigator.battery;
            // state is either CHARGING or UNPLUGGED
            if (state === 2 || state === 3) {
                var info = {
                    "level" : me._level,
                    "isPlugged" : state === 2
                };

                if (me._isPlugged !== info.isPlugged && typeof win === 'function') {
                    win(info);
                }
            }
        });
        blackberry.system.event.deviceBatteryLevelChange(function(level) {
            var me = navigator.battery;
            if (level != me._level && typeof win === 'function') {
                win({'level' : level, 'isPlugged' : me._isPlugged});
            }
        });

        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    },
    stop: function (args, win, fail) {
        // Unregister battery listeners.
        blackberry.system.event.deviceBatteryStateChange(null);
        blackberry.system.event.deviceBatteryLevelChange(null);
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    }
};

});

// file: lib/blackberry/plugin/air/camera.js
define("cordova/plugin/air/camera", function(require, exports, module) {

var cordova = require('cordova');

module.exports = {
    takePicture: function (args, win, fail) {
        var onCaptured = blackberry.events.registerEventHandler("onCaptured", win),
            onCameraClosed = blackberry.events.registerEventHandler("onCameraClosed", function () {}),
            onError = blackberry.events.registerEventHandler("onError", fail),
            request = new blackberry.transport.RemoteFunctionCall('blackberry/media/camera/takePicture');

        request.addParam("onCaptured", onCaptured);
        request.addParam("onCameraClosed", onCameraClosed);
        request.addParam("onError", onError);

        //HACK: this is a sync call due to:
        //https://github.com/blackberry/WebWorks-TabletOS/issues/51
        request.makeSyncCall();
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    }
};

});

// file: lib/blackberry/plugin/air/capture.js
define("cordova/plugin/air/capture", function(require, exports, module) {

var cordova = require('cordova');

function capture(action, win, fail) {
    var onCaptured = blackberry.events.registerEventHandler("onCaptured", function (path) {
            var file = blackberry.io.file.getFileProperties(path);
            win([{
                fullPath: path,
                lastModifiedDate: file.dateModified,
                name: path.replace(file.directory + "/", ""),
                size: file.size,
                type: file.fileExtension
            }]);
        }),
        onCameraClosed = blackberry.events.registerEventHandler("onCameraClosed", function () {}),
        onError = blackberry.events.registerEventHandler("onError", fail),
        request = new blackberry.transport.RemoteFunctionCall('blackberry/media/camera/' + action);

    request.addParam("onCaptured", onCaptured);
    request.addParam("onCameraClosed", onCameraClosed);
    request.addParam("onError", onError);

    //HACK: this is a sync call due to:
    //https://github.com/blackberry/WebWorks-TabletOS/issues/51
    request.makeSyncCall();
}

module.exports = {
    getSupportedAudioModes: function (args, win, fail) {
        return {"status": cordova.callbackStatus.OK, "message": []};
    },
    getSupportedImageModes: function (args, win, fail) {
        return {"status": cordova.callbackStatus.OK, "message": []};
    },
    getSupportedVideoModes: function (args, win, fail) {
        return {"status": cordova.callbackStatus.OK, "message": []};
    },
    captureImage: function (args, win, fail) {
        if (args[0].limit > 0) {
            capture("takePicture", win, fail);
        }
        else {
            win([]);
        }

        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    },
    captureVideo: function (args, win, fail) {
        if (args[0].limit > 0) {
            capture("takeVideo", win, fail);
        }
        else {
            win([]);
        }

        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    },
    captureAudio: function (args, win, fail) {
        var onCaptureAudioWin = function(filePath){
        // for some reason the filePath is coming back as a string between two double quotes
        filePath = filePath.slice(1, filePath.length-1);
            var file = blackberry.io.file.getFileProperties(filePath);

            win([{
                fullPath: filePath,
                lastModifiedDate: file.dateModified,
                name: filePath.replace(file.directory + "/", ""),
                size: file.size,
                type: file.fileExtension
            }]);
        };

        var onCaptureAudioFail = function(){
            fail([]);
        };

        if (args[0].limit > 0 && args[0].duration){
            // a sloppy way of creating a uuid since there's no built in date function to get milliseconds since epoch
            // might be better to instead check files within directory and then figure out the next file name should be
            // ie, img000 -> img001 though that would take awhile and would add a whole bunch of checks
            var id = new Date();
            id = (id.getDay()).toString() + (id.getHours()).toString() + (id.getSeconds()).toString() + (id.getMilliseconds()).toString() + (id.getYear()).toString();

            var fileName = blackberry.io.dir.appDirs.shared.music.path+'/audio'+id+'.wav';
            blackberry.media.microphone.record(fileName, onCaptureAudioWin, onCaptureAudioFail);
            // multiple duration by a 1000 since it comes in as seconds
            setTimeout(blackberry.media.microphone.stop,args[0].duration*1000);
        }
        else {
            win([]);
        }
        return {"status": cordova.callbackStatus.NO_RESULT, "message": "WebWorks Is On It"};
    }
};

});

// file: lib/blackberry/plugin/air/device.js
define("cordova/plugin/air/device", function(require, exports, module) {

var channel = require('cordova/channel'),
    cordova = require('cordova');

// Tell cordova channel to wait on the CordovaInfoReady event
channel.waitForInitialization('onCordovaInfoReady');

module.exports = {
    getDeviceInfo : function(args, win, fail){
        //Register an event handler for the networkChange event
        var callback = blackberry.events.registerEventHandler("deviceInfo", function (info) {
                win({
                    platform: "BlackBerry",
                    version: info.version,
                    model: "PlayBook",
                    name: "PlayBook", // deprecated: please use device.model
                    uuid: info.uuid,
                    cordova: CORDOVA_JS_BUILD_LABEL
                });
            }),
            request = new blackberry.transport.RemoteFunctionCall("org/apache/cordova/getDeviceInfo");

        request.addParam("id", callback);
        request.makeSyncCall();

        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "" };
    }
};

});

// file: lib/blackberry/plugin/air/file/bbsymbols.js
define("cordova/plugin/air/file/bbsymbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.clobbers('cordova/plugin/air/DirectoryReader', 'DirectoryReader');
modulemapper.clobbers('cordova/plugin/air/File', 'File');
modulemapper.clobbers('cordova/plugin/air/FileReader', 'FileReader');
modulemapper.clobbers('cordova/plugin/air/FileWriter', 'FileWriter');
modulemapper.clobbers('cordova/plugin/air/requestFileSystem', 'requestFileSystem');
modulemapper.clobbers('cordova/plugin/air/resolveLocalFileSystemURI', 'resolveLocalFileSystemURI');
modulemapper.merges('cordova/plugin/air/DirectoryEntry', 'DirectoryEntry');
modulemapper.merges('cordova/plugin/air/Entry', 'Entry');
modulemapper.merges('cordova/plugin/air/FileEntry', 'FileEntry');


});

// file: lib/blackberry/plugin/air/manager.js
define("cordova/plugin/air/manager", function(require, exports, module) {

var cordova = require('cordova'),
    plugins = {
        'Device' : require('cordova/plugin/air/device'),
        'Battery' : require('cordova/plugin/air/battery'),
        'Camera' : require('cordova/plugin/air/camera'),
        'Logger' : require('cordova/plugin/webworks/logger'),
        'Media' : require('cordova/plugin/webworks/media'),
        'Capture' : require('cordova/plugin/air/capture'),
        'Accelerometer' : require('cordova/plugin/webworks/accelerometer'),
        'NetworkStatus' : require('cordova/plugin/air/network'),
        'Notification' : require('cordova/plugin/webworks/notification'),
        'FileTransfer' : require('cordova/plugin/air/FileTransfer')
    };

module.exports = {
    addPlugin: function (key, module) {
        plugins[key] = require(module);
    },
    exec: function (win, fail, clazz, action, args) {
        var result = {"status" : cordova.callbackStatus.CLASS_NOT_FOUND_EXCEPTION, "message" : "Class " + clazz + " cannot be found"};

        if (plugins[clazz]) {
            if (plugins[clazz][action]) {
                result = plugins[clazz][action](args, win, fail);
            }
            else {
                result = { "status" : cordova.callbackStatus.INVALID_ACTION, "message" : "Action not found: " + action };
            }
        }

        return result;
    },
    resume: function () {},
    pause: function () {},
    destroy: function () {}
};

});

// file: lib/blackberry/plugin/air/network.js
define("cordova/plugin/air/network", function(require, exports, module) {

var cordova = require('cordova'),
    connection = require('cordova/plugin/Connection');

module.exports = {
    getConnectionInfo: function (args, win, fail) {
        var connectionType = connection.NONE,
            eventType = "offline",
            callbackID,
            request;

        /**
         * For PlayBooks, we currently only have WiFi connections, so
         * return WiFi if there is any access at all.
         * TODO: update if/when PlayBook gets other connection types...
         */
        if (blackberry.system.hasDataCoverage()) {
            connectionType = connection.WIFI;
            eventType = "online";
        }

        //Register an event handler for the networkChange event
        callbackID = blackberry.events.registerEventHandler("networkChange", function (status) {
            win(status.type);
        });

        //pass our callback id down to our network extension
        request = new blackberry.transport.RemoteFunctionCall("org/apache/cordova/getConnectionInfo");
        request.addParam("networkStatusChangedID", callbackID);
        request.makeSyncCall();

        return { "status": cordova.callbackStatus.OK, "message": connectionType};
    }
};

});

// file: lib/blackberry/plugin/air/platform.js
define("cordova/plugin/air/platform", function(require, exports, module) {

module.exports = {
    id: "playbook",
    initialize:function() {}
};

});

// file: lib/blackberry/plugin/air/requestFileSystem.js
define("cordova/plugin/air/requestFileSystem", function(require, exports, module) {

var DirectoryEntry = require('cordova/plugin/DirectoryEntry'),
FileError = require('cordova/plugin/FileError'),
FileSystem = require('cordova/plugin/FileSystem'),
LocalFileSystem = require('cordova/plugin/LocalFileSystem');

/**
 * Request a file system in which to store application data.
 * @param type  local file system type
 * @param size  indicates how much storage space, in bytes, the application expects to need
 * @param successCallback  invoked with a FileSystem object
 * @param errorCallback  invoked if error occurs retrieving file system
 */
var requestFileSystem = function(type, size, successCallback, errorCallback) {
    var fail = function(code) {
        if (typeof errorCallback === 'function') {
            errorCallback(new FileError(code));
        }
    };

    if (type < 0 || type > 3) {
        fail(FileError.SYNTAX_ERR);
    } else {
        // if successful, return a FileSystem object
        var success = function(file_system) {
            if (file_system) {
                if (typeof successCallback === 'function') {
                    successCallback(file_system);
                }
            }
            else {
                // no FileSystem object returned
                fail(FileError.NOT_FOUND_ERR);
            }
        };

        // guessing the max file size is 2GB - 1 bytes?
        // https://bdsc.webapps.blackberry.com/native/documentation/com.qnx.doc.neutrino.user_guide/topic/limits_filesystems.html

        if(size>=2147483648){
            fail(FileError.QUOTA_EXCEEDED_ERR);
            return;
        }


        var theFileSystem;
        try{
            // is there a way to get space for the app that doesn't point to the appDirs folder?
            if(type==LocalFileSystem.TEMPORARY){
                theFileSystem = new FileSystem('temporary', new DirectoryEntry('root', blackberry.io.dir.appDirs.app.storage.path));
            }else if(type==LocalFileSystem.PERSISTENT){
                theFileSystem = new FileSystem('persistent', new DirectoryEntry('root', blackberry.io.dir.appDirs.app.storage.path));
            }
            success(theFileSystem);
        }catch(e){
            fail(FileError.SYNTAX_ERR);
        }
    }
};
module.exports = requestFileSystem;

});

// file: lib/blackberry/plugin/air/resolveLocalFileSystemURI.js
define("cordova/plugin/air/resolveLocalFileSystemURI", function(require, exports, module) {

var DirectoryEntry = require('cordova/plugin/DirectoryEntry'),
    FileEntry = require('cordova/plugin/FileEntry'),
    FileError = require('cordova/plugin/FileError');

/**
 * Look up file system Entry referred to by local URI.
 * @param {DOMString} uri  URI referring to a local file or directory
 * @param successCallback  invoked with Entry object corresponding to URI
 * @param errorCallback    invoked if error occurs retrieving file system entry
 */
module.exports = function(uri, successCallback, errorCallback) {
    // error callback
    var fail = function(error) {
        if (typeof errorCallback === 'function') {
            errorCallback(new FileError(error));
        }
    };
    // if successful, return either a file or directory entry
    var success = function(entry) {
        var result;

        if (entry) {
            if (typeof successCallback === 'function') {
                // create appropriate Entry object
                result = (entry.isDirectory) ? new DirectoryEntry(entry.name, entry.fullPath) : new FileEntry(entry.name, entry.fullPath);
                try {
                    successCallback(result);
                }
                catch (e) {
                    console.log('Error invoking callback: ' + e);
                }
            }
        }
        else {
            // no Entry object returned
            fail(FileError.NOT_FOUND_ERR);
            return;
        }
    };

    if(!uri || uri === ""){
        fail(FileError.NOT_FOUND_ERR);
        return;
    }

    // decode uri if % char found
    if(uri.indexOf('%')>=0){
        uri = decodeURI(uri);
    }

    // pop the parameters if any
    if(uri.indexOf('?')>=0){
        uri = uri.split('?')[0];
    }

    // check for leading /
    if(uri.indexOf('/')===0){
        fail(FileError.ENCODING_ERR);
        return;
    }

    // Entry object is borked - unable to instantiate a new Entry object so just create one
    var theEntry = {};
    if(blackberry.io.dir.exists(uri)){
        theEntry.isDirectory = true;
        theEntry.name = uri.split('/').pop();
        theEntry.fullPath = uri;

        success(theEntry);
    }else if(blackberry.io.file.exists(uri)){
        theEntry.isDirectory = false;
        theEntry.name = uri.split('/').pop();
        theEntry.fullPath = uri;
        success(theEntry);
        return;
    }else{
        fail(FileError.NOT_FOUND_ERR);
        return;
    }

};

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

// file: lib/blackberry/plugin/java/Contact.js
define("cordova/plugin/java/Contact", function(require, exports, module) {

var ContactError = require('cordova/plugin/ContactError'),
    ContactUtils = require('cordova/plugin/java/ContactUtils'),
    utils = require('cordova/utils'),
    ContactAddress = require('cordova/plugin/ContactAddress'),
    exec = require('cordova/exec');

// ------------------
// Utility functions
// ------------------

/**
 * Retrieves a BlackBerry contact from the device by unique id.
 *
 * @param uid
 *            Unique id of the contact on the device
 * @return {blackberry.pim.Contact} BlackBerry contact or null if contact with
 *         specified id is not found
 */
var findByUniqueId = function(uid) {
    if (!uid) {
        return null;
    }
    var bbContacts = blackberry.pim.Contact.find(new blackberry.find.FilterExpression("uid", "==", uid));
    return bbContacts[0] || null;
};

/**
 * Creates a BlackBerry contact object from the W3C Contact object and persists
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

    var bbContact = null;
    var update = false;

    // if the underlying BlackBerry contact already exists, retrieve it for
    // update
    if (contact.id) {
        // we must attempt to retrieve the BlackBerry contact from the device
        // because this may be an update operation
        bbContact = findByUniqueId(contact.id);
    }

    // contact not found on device, create a new one
    if (!bbContact) {
        bbContact = new blackberry.pim.Contact();
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
    // BlackBerry contact object before saving.
    //
    // This means that a user must explicitly set a Contact attribute to a
    // non-null value in order to update it in the contact database.
    //
    // name
    if (contact.name !== null) {
        if (contact.name.givenName) {
            bbContact.firstName = contact.name.givenName;
        }
        if (contact.name.familyName) {
            bbContact.lastName = contact.name.familyName;
        }
        if (contact.name.honorificPrefix) {
            bbContact.title = contact.name.honorificPrefix;
        }
    }

    // display name
    if (contact.displayName !== null) {
        bbContact.user1 = contact.displayName;
    }

    // note
    if (contact.note !== null) {
        bbContact.note = contact.note;
    }

    // birthday
    //
    // user may pass in Date object or a string representation of a date
    // if it is a string, we don't know the date format, so try to create a
    // new Date with what we're given
    //
    // NOTE: BlackBerry's Date.parse() does not work well, so use new Date()
    //
    if (contact.birthday !== null) {
        if (utils.isDate(contact.birthday)) {
            bbContact.birthday = contact.birthday;
        } else {
            var bday = contact.birthday.toString();
            bbContact.birthday = (bday.length > 0) ? new Date(bday) : "";
        }
    }

    // BlackBerry supports three email addresses
    if (contact.emails && utils.isArray(contact.emails)) {

        // if this is an update, re-initialize email addresses
        if (update) {
            bbContact.email1 = "";
            bbContact.email2 = "";
            bbContact.email3 = "";
        }

        // copy the first three email addresses found
        var email = null;
        for ( var i = 0; i < contact.emails.length; i += 1) {
            email = contact.emails[i];
            if (!email || !email.value) {
                continue;
            }
            if (bbContact.email1 === "") {
                bbContact.email1 = email.value;
            } else if (bbContact.email2 === "") {
                bbContact.email2 = email.value;
            } else if (bbContact.email3 === "") {
                bbContact.email3 = email.value;
            }
        }
    }

    // BlackBerry supports a finite number of phone numbers
    // copy into appropriate fields based on type
    if (contact.phoneNumbers && utils.isArray(contact.phoneNumbers)) {

        // if this is an update, re-initialize phone numbers
        if (update) {
            bbContact.homePhone = "";
            bbContact.homePhone2 = "";
            bbContact.workPhone = "";
            bbContact.workPhone2 = "";
            bbContact.mobilePhone = "";
            bbContact.faxPhone = "";
            bbContact.pagerPhone = "";
            bbContact.otherPhone = "";
        }

        var type = null;
        var number = null;
        for ( var j = 0; j < contact.phoneNumbers.length; j += 1) {
            if (!contact.phoneNumbers[j] || !contact.phoneNumbers[j].value) {
                continue;
            }
            type = contact.phoneNumbers[j].type;
            number = contact.phoneNumbers[j].value;
            if (type === 'home') {
                if (bbContact.homePhone === "") {
                    bbContact.homePhone = number;
                } else if (bbContact.homePhone2 === "") {
                    bbContact.homePhone2 = number;
                }
            } else if (type === 'work') {
                if (bbContact.workPhone === "") {
                    bbContact.workPhone = number;
                } else if (bbContact.workPhone2 === "") {
                    bbContact.workPhone2 = number;
                }
            } else if (type === 'mobile' && bbContact.mobilePhone === "") {
                bbContact.mobilePhone = number;
            } else if (type === 'fax' && bbContact.faxPhone === "") {
                bbContact.faxPhone = number;
            } else if (type === 'pager' && bbContact.pagerPhone === "") {
                bbContact.pagerPhone = number;
            } else if (bbContact.otherPhone === "") {
                bbContact.otherPhone = number;
            }
        }
    }

    // BlackBerry supports two addresses: home and work
    // copy the first two addresses found from Contact
    if (contact.addresses && utils.isArray(contact.addresses)) {

        // if this is an update, re-initialize addresses
        if (update) {
            bbContact.homeAddress = null;
            bbContact.workAddress = null;
        }

        var address = null;
        var bbHomeAddress = null;
        var bbWorkAddress = null;
        for ( var k = 0; k < contact.addresses.length; k += 1) {
            address = contact.addresses[k];
            if (!address || address.id === undefined || address.pref === undefined || address.type === undefined || address.formatted === undefined) {
                continue;
            }

            if (bbHomeAddress === null && (!address.type || address.type === "home")) {
                bbHomeAddress = createBlackBerryAddress(address);
                bbContact.homeAddress = bbHomeAddress;
            } else if (bbWorkAddress === null && (!address.type || address.type === "work")) {
                bbWorkAddress = createBlackBerryAddress(address);
                bbContact.workAddress = bbWorkAddress;
            }
        }
    }

    // copy first url found to BlackBerry 'webpage' field
    if (contact.urls && utils.isArray(contact.urls)) {

        // if this is an update, re-initialize web page
        if (update) {
            bbContact.webpage = "";
        }

        var url = null;
        for ( var m = 0; m < contact.urls.length; m += 1) {
            url = contact.urls[m];
            if (!url || !url.value) {
                continue;
            }
            if (bbContact.webpage === "") {
                bbContact.webpage = url.value;
                break;
            }
        }
    }

    // copy fields from first organization to the
    // BlackBerry 'company' and 'jobTitle' fields
    if (contact.organizations && utils.isArray(contact.organizations)) {

        // if this is an update, re-initialize org attributes
        if (update) {
            bbContact.company = "";
        }

        var org = null;
        for ( var n = 0; n < contact.organizations.length; n += 1) {
            org = contact.organizations[n];
            if (!org) {
                continue;
            }
            if (bbContact.company === "") {
                bbContact.company = org.name || "";
                bbContact.jobTitle = org.title || "";
                break;
            }
        }
    }

    // categories
    if (contact.categories && utils.isArray(contact.categories)) {
        bbContact.categories = [];
        var category = null;
        for ( var o = 0; o < contact.categories.length; o += 1) {
            category = contact.categories[o];
            if (typeof category == "string") {
                bbContact.categories.push(category);
            }
        }
    }

    // save to device
    bbContact.save();

    // invoke native side to save photo
    // fail gracefully if photo URL is no good, but log the error
    if (contact.photos && utils.isArray(contact.photos)) {
        var photo = null;
        for ( var p = 0; p < contact.photos.length; p += 1) {
            photo = contact.photos[p];
            if (!photo || !photo.value) {
                continue;
            }
            exec(
            // success
            function() {
            },
            // fail
            function(e) {
                console.log('Contact.setPicture failed:' + e);
            }, "Contacts", "setPicture", [ bbContact.uid, photo.type,
                    photo.value ]);
            break;
        }
    }

    // Use the fully populated BlackBerry contact object to create a
    // corresponding W3C contact object.
    return ContactUtils.createContact(bbContact, [ "*" ]);
};

/**
 * Creates a BlackBerry Address object from a W3C ContactAddress.
 *
 * @return {blackberry.pim.Address} a BlackBerry address object
 */
var createBlackBerryAddress = function(address) {
    var bbAddress = new blackberry.pim.Address();

    if (!address) {
        return bbAddress;
    }

    bbAddress.address1 = address.streetAddress || "";
    bbAddress.city = address.locality || "";
    bbAddress.stateProvince = address.region || "";
    bbAddress.zipPostal = address.postalCode || "";
    bbAddress.country = address.country || "";

    return bbAddress;
};

module.exports = {
    /**
     * Persists contact to device storage.
     */
    save : function(success, fail) {
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
            if (typeof success === 'function') {
                success(fullContact);
            }
        } catch (e) {
            console.log('Error saving contact: ' + e);
            if (typeof fail === 'function') {
                fail(new ContactError(ContactError.UNKNOWN_ERROR));
            }
        }
    },

    /**
     * Removes contact from device storage.
     *
     * @param success
     *            success callback
     * @param fail
     *            error callback
     */
    remove : function(success, fail) {
        try {
            // retrieve contact from device by id
            var bbContact = null;
            if (this.id) {
                bbContact = findByUniqueId(this.id);
            }

            // if contact was found, remove it
            if (bbContact) {
                console.log('removing contact: ' + bbContact.uid);
                bbContact.remove();
                if (typeof success === 'function') {
                    success(this);
                }
            }
            // attempting to remove a contact that hasn't been saved
            else if (typeof fail === 'function') {
                fail(new ContactError(ContactError.UNKNOWN_ERROR));
            }
        } catch (e) {
            console.log('Error removing contact ' + this.id + ": " + e);
            if (typeof fail === 'function') {
                fail(new ContactError(ContactError.UNKNOWN_ERROR));
            }
        }
    }
};

});

// file: lib/blackberry/plugin/java/ContactUtils.js
define("cordova/plugin/java/ContactUtils", function(require, exports, module) {

var ContactAddress = require('cordova/plugin/ContactAddress'),
    ContactName = require('cordova/plugin/ContactName'),
    ContactField = require('cordova/plugin/ContactField'),
    ContactOrganization = require('cordova/plugin/ContactOrganization'),
    utils = require('cordova/utils'),
    Contact = require('cordova/plugin/Contact');

/**
 * Mappings for each Contact field that may be used in a find operation. Maps
 * W3C Contact fields to one or more fields in a BlackBerry contact object.
 *
 * Example: user searches with a filter on the Contact 'name' field:
 *
 * <code>Contacts.find(['name'], onSuccess, onFail, {filter:'Bob'});</code>
 *
 * The 'name' field does not exist in a BlackBerry contact. Instead, a filter
 * expression will be built to search the BlackBerry contacts using the
 * BlackBerry 'title', 'firstName' and 'lastName' fields.
 */
var fieldMappings = {
    "id" : "uid",
    "displayName" : "user1",
    "name" : [ "title", "firstName", "lastName" ],
    "name.formatted" : [ "title", "firstName", "lastName" ],
    "name.givenName" : "firstName",
    "name.familyName" : "lastName",
    "name.honorificPrefix" : "title",
    "phoneNumbers" : [ "faxPhone", "homePhone", "homePhone2", "mobilePhone",
            "pagerPhone", "otherPhone", "workPhone", "workPhone2" ],
    "phoneNumbers.value" : [ "faxPhone", "homePhone", "homePhone2",
            "mobilePhone", "pagerPhone", "otherPhone", "workPhone",
            "workPhone2" ],
    "emails" : [ "email1", "email2", "email3" ],
    "addresses" : [ "homeAddress.address1", "homeAddress.address2",
            "homeAddress.city", "homeAddress.stateProvince",
            "homeAddress.zipPostal", "homeAddress.country",
            "workAddress.address1", "workAddress.address2", "workAddress.city",
            "workAddress.stateProvince", "workAddress.zipPostal",
            "workAddress.country" ],
    "addresses.formatted" : [ "homeAddress.address1", "homeAddress.address2",
            "homeAddress.city", "homeAddress.stateProvince",
            "homeAddress.zipPostal", "homeAddress.country",
            "workAddress.address1", "workAddress.address2", "workAddress.city",
            "workAddress.stateProvince", "workAddress.zipPostal",
            "workAddress.country" ],
    "addresses.streetAddress" : [ "homeAddress.address1",
            "homeAddress.address2", "workAddress.address1",
            "workAddress.address2" ],
    "addresses.locality" : [ "homeAddress.city", "workAddress.city" ],
    "addresses.region" : [ "homeAddress.stateProvince",
            "workAddress.stateProvince" ],
    "addresses.country" : [ "homeAddress.country", "workAddress.country" ],
    "organizations" : [ "company", "jobTitle" ],
    "organizations.name" : "company",
    "organizations.title" : "jobTitle",
    "birthday" : "birthday",
    "note" : "note",
    "categories" : "categories",
    "urls" : "webpage",
    "urls.value" : "webpage"
};

/*
 * Build an array of all of the valid W3C Contact fields. This is used to
 * substitute all the fields when ["*"] is specified.
 */
var allFields = [];
for ( var key in fieldMappings) {
    if (fieldMappings.hasOwnProperty(key)) {
        allFields.push(key);
    }
}

/**
 * Create a W3C ContactAddress object from a BlackBerry Address object.
 *
 * @param {String}
 *            type the type of address (e.g. work, home)
 * @param {blackberry.pim.Address}
 *            bbAddress a BlackBerry Address object
 * @return {ContactAddress} a contact address object or null if the specified
 *         address is null
 */
var createContactAddress = function(type, bbAddress) {

    if (!bbAddress) {
        return null;
    }

    var address1 = bbAddress.address1 || "";
    var address2 = bbAddress.address2 || "";
    var streetAddress = address1 + ", " + address2;
    var locality = bbAddress.city || "";
    var region = bbAddress.stateProvince || "";
    var postalCode = bbAddress.zipPostal || "";
    var country = bbAddress.country || "";
    var formatted = streetAddress + ", " + locality + ", " + region + ", " + postalCode + ", " + country;

    return new ContactAddress(null, type, formatted, streetAddress, locality,
            region, postalCode, country);
};

module.exports = {
    /**
     * Builds a BlackBerry filter expression for contact search using the
     * contact fields and search filter provided.
     *
     * @param {String[]}
     *            fields Array of Contact fields to search
     * @param {String}
     *            filter Filter, or search string
     * @return filter expression or null if fields is empty or filter is null or
     *         empty
     */
    buildFilterExpression : function(fields, filter) {

        // ensure filter exists
        if (!filter || filter === "") {
            return null;
        }

        if (fields.length == 1 && fields[0] === "*") {
            // Cordova enhancement to allow fields value of ["*"] to indicate
            // all supported fields.
            fields = allFields;
        }

        // BlackBerry API uses specific operators to build filter expressions
        // for
        // querying Contact lists. The operators are
        // ["!=","==","<",">","<=",">="].
        // Use of regex is also an option, and the only one we can use to
        // simulate
        // an SQL '%LIKE%' clause.
        //
        // Note: The BlackBerry regex implementation doesn't seem to support
        // conventional regex switches that would enable a case insensitive
        // search.
        // It does not honor the (?i) switch (which causes Contact.find() to
        // fail).
        // We need case INsensitivity to match the W3C Contacts API spec.
        // So the guys at RIM proposed this method:
        //
        // original filter = "norm"
        // case insensitive filter = "[nN][oO][rR][mM]"
        //
        var ciFilter = "";
        for ( var i = 0; i < filter.length; i++) {
            ciFilter = ciFilter + "[" + filter[i].toLowerCase() + filter[i].toUpperCase() + "]";
        }

        // match anything that contains our filter string
        filter = ".*" + ciFilter + ".*";

        // build a filter expression using all Contact fields provided
        var filterExpression = null;
        if (fields && utils.isArray(fields)) {
            var fe = null;
            for (var f = 0; f < fields.length; f++) {
                if (!fields[f]) {
                    continue;
                }

                // retrieve the BlackBerry contact fields that map to the one
                // specified
                var bbFields = fieldMappings[fields[f]];

                // BlackBerry doesn't support the field specified
                if (!bbFields) {
                    continue;
                }

                if (!utils.isArray(bbFields)) {
                    bbFields = [bbFields];
                }

                // construct the filter expression using the BlackBerry fields
                for (var j = 0; j < bbFields.length; j++) {
                    fe = new blackberry.find.FilterExpression(bbFields[j],
                            "REGEX", filter);
                    if (filterExpression === null) {
                        filterExpression = fe;
                    } else {
                        // combine the filters
                        filterExpression = new blackberry.find.FilterExpression(
                                filterExpression, "OR", fe);
                    }
                }
            }
        }

        return filterExpression;
    },

    /**
     * Creates a Contact object from a BlackBerry Contact object, copying only
     * the fields specified.
     *
     * This is intended as a privately used function but it is made globally
     * available so that a Contact.save can convert a BlackBerry contact object
     * into its W3C equivalent.
     *
     * @param {blackberry.pim.Contact}
     *            bbContact BlackBerry Contact object
     * @param {String[]}
     *            fields array of contact fields that should be copied
     * @return {Contact} a contact object containing the specified fields or
     *         null if the specified contact is null
     */
    createContact : function(bbContact, fields) {

        if (!bbContact) {
            return null;
        }

        // construct a new contact object
        // always copy the contact id and displayName fields
        var contact = new Contact(bbContact.uid, bbContact.user1);

        // nothing to do
        if (!fields || !(utils.isArray(fields)) || fields.length === 0) {
            return contact;
        } else if (fields.length == 1 && fields[0] === "*") {
            // Cordova enhancement to allow fields value of ["*"] to indicate
            // all supported fields.
            fields = allFields;
        }

        // add the fields specified
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];

            if (!field) {
                continue;
            }

            // name
            if (field.indexOf('name') === 0) {
                var formattedName = bbContact.title + ' ' + bbContact.firstName + ' ' + bbContact.lastName;
                contact.name = new ContactName(formattedName,
                        bbContact.lastName, bbContact.firstName, null,
                        bbContact.title, null);
            }
            // phone numbers
            else if (field.indexOf('phoneNumbers') === 0) {
                var phoneNumbers = [];
                if (bbContact.homePhone) {
                    phoneNumbers.push(new ContactField('home',
                            bbContact.homePhone));
                }
                if (bbContact.homePhone2) {
                    phoneNumbers.push(new ContactField('home',
                            bbContact.homePhone2));
                }
                if (bbContact.workPhone) {
                    phoneNumbers.push(new ContactField('work',
                            bbContact.workPhone));
                }
                if (bbContact.workPhone2) {
                    phoneNumbers.push(new ContactField('work',
                            bbContact.workPhone2));
                }
                if (bbContact.mobilePhone) {
                    phoneNumbers.push(new ContactField('mobile',
                            bbContact.mobilePhone));
                }
                if (bbContact.faxPhone) {
                    phoneNumbers.push(new ContactField('fax',
                            bbContact.faxPhone));
                }
                if (bbContact.pagerPhone) {
                    phoneNumbers.push(new ContactField('pager',
                            bbContact.pagerPhone));
                }
                if (bbContact.otherPhone) {
                    phoneNumbers.push(new ContactField('other',
                            bbContact.otherPhone));
                }
                contact.phoneNumbers = phoneNumbers.length > 0 ? phoneNumbers
                        : null;
            }
            // emails
            else if (field.indexOf('emails') === 0) {
                var emails = [];
                if (bbContact.email1) {
                    emails.push(new ContactField(null, bbContact.email1, null));
                }
                if (bbContact.email2) {
                    emails.push(new ContactField(null, bbContact.email2, null));
                }
                if (bbContact.email3) {
                    emails.push(new ContactField(null, bbContact.email3, null));
                }
                contact.emails = emails.length > 0 ? emails : null;
            }
            // addresses
            else if (field.indexOf('addresses') === 0) {
                var addresses = [];
                if (bbContact.homeAddress) {
                    addresses.push(createContactAddress("home",
                            bbContact.homeAddress));
                }
                if (bbContact.workAddress) {
                    addresses.push(createContactAddress("work",
                            bbContact.workAddress));
                }
                contact.addresses = addresses.length > 0 ? addresses : null;
            }
            // birthday
            else if (field.indexOf('birthday') === 0) {
                if (bbContact.birthday) {
                    contact.birthday = bbContact.birthday;
                }
            }
            // note
            else if (field.indexOf('note') === 0) {
                if (bbContact.note) {
                    contact.note = bbContact.note;
                }
            }
            // organizations
            else if (field.indexOf('organizations') === 0) {
                var organizations = [];
                if (bbContact.company || bbContact.jobTitle) {
                    organizations.push(new ContactOrganization(null, null,
                            bbContact.company, null, bbContact.jobTitle));
                }
                contact.organizations = organizations.length > 0 ? organizations
                        : null;
            }
            // categories
            else if (field.indexOf('categories') === 0) {
                if (bbContact.categories && bbContact.categories.length > 0) {
                    contact.categories = bbContact.categories;
                } else {
                    contact.categories = null;
                }
            }
            // urls
            else if (field.indexOf('urls') === 0) {
                var urls = [];
                if (bbContact.webpage) {
                    urls.push(new ContactField(null, bbContact.webpage));
                }
                contact.urls = urls.length > 0 ? urls : null;
            }
            // photos
            else if (field.indexOf('photos') === 0) {
                var photos = [];
                // The BlackBerry Contact object will have a picture attribute
                // with Base64 encoded image
                if (bbContact.picture) {
                    photos.push(new ContactField('base64', bbContact.picture));
                }
                contact.photos = photos.length > 0 ? photos : null;
            }
        }

        return contact;
    }
};

});

// file: lib/blackberry/plugin/java/DirectoryEntry.js
define("cordova/plugin/java/DirectoryEntry", function(require, exports, module) {

var DirectoryEntry = require('cordova/plugin/DirectoryEntry'),
    FileEntry = require('cordova/plugin/FileEntry'),
    FileError = require('cordova/plugin/FileError'),
    exec = require('cordova/exec');

module.exports = {
    /**
     * Creates or looks up a directory; override for BlackBerry.
     *
     * @param path
     *            {DOMString} either a relative or absolute path from this
     *            directory in which to look up or create a directory
     * @param options
     *            {Flags} options to create or exclusively create the directory
     * @param successCallback
     *            {Function} called with the new DirectoryEntry
     * @param errorCallback
     *            {Function} called with a FileError
     */
    getDirectory : function(path, options, successCallback, errorCallback) {
        // create directory if it doesn't exist
        var create = (options && options.create === true) ? true : false,
        // if true, causes failure if create is true and path already exists
        exclusive = (options && options.exclusive === true) ? true : false,
        // directory exists
        exists,
        // create a new DirectoryEntry object and invoke success callback
        createEntry = function() {
            var path_parts = path.split('/'),
                name = path_parts[path_parts.length - 1],
                dirEntry = new DirectoryEntry(name, path);

            // invoke success callback
            if (typeof successCallback === 'function') {
                successCallback(dirEntry);
            }
        };

        var fail = function(error) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(error));
            }
        };

        // determine if path is relative or absolute
        if (!path) {
            fail(FileError.ENCODING_ERR);
            return;
        } else if (path.indexOf(this.fullPath) !== 0) {
            // path does not begin with the fullPath of this directory
            // therefore, it is relative
            path = this.fullPath + '/' + path;
        }

        // determine if directory exists
        try {
            // will return true if path exists AND is a directory
            exists = blackberry.io.dir.exists(path);
        } catch (e) {
            // invalid path
            fail(FileError.ENCODING_ERR);
            return;
        }

        // path is a directory
        if (exists) {
            if (create && exclusive) {
                // can't guarantee exclusivity
                fail(FileError.PATH_EXISTS_ERR);
            } else {
                // create entry for existing directory
                createEntry();
            }
        }
        // will return true if path exists AND is a file
        else if (blackberry.io.file.exists(path)) {
            // the path is a file
            fail(FileError.TYPE_MISMATCH_ERR);
        }
        // path does not exist, create it
        else if (create) {
            try {
                // directory path must have trailing slash
                var dirPath = path;
                if (dirPath.substr(-1) !== '/') {
                    dirPath += '/';
                }
                blackberry.io.dir.createNewDir(dirPath);
                createEntry();
            } catch (eone) {
                // unable to create directory
                fail(FileError.NOT_FOUND_ERR);
            }
        }
        // path does not exist, don't create
        else {
            // directory doesn't exist
            fail(FileError.NOT_FOUND_ERR);
        }
    },
    /**
     * Create or look up a file.
     *
     * @param path {DOMString}
     *            either a relative or absolute path from this directory in
     *            which to look up or create a file
     * @param options {Flags}
     *            options to create or exclusively create the file
     * @param successCallback {Function}
     *            called with the new FileEntry object
     * @param errorCallback {Function}
     *            called with a FileError object if error occurs
     */
    getFile:function(path, options, successCallback, errorCallback) {
        // create file if it doesn't exist
        var create = (options && options.create === true) ? true : false,
            // if true, causes failure if create is true and path already exists
            exclusive = (options && options.exclusive === true) ? true : false,
            // file exists
            exists,
            // create a new FileEntry object and invoke success callback
            createEntry = function() {
                var path_parts = path.split('/'),
                    name = path_parts[path_parts.length - 1],
                    fileEntry = new FileEntry(name, path);

                // invoke success callback
                if (typeof successCallback === 'function') {
                    successCallback(fileEntry);
                }
            };

        var fail = function(error) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(error));
            }
        };

        // determine if path is relative or absolute
        if (!path) {
            fail(FileError.ENCODING_ERR);
            return;
        }
        else if (path.indexOf(this.fullPath) !== 0) {
            // path does not begin with the fullPath of this directory
            // therefore, it is relative
            path = this.fullPath + '/' + path;
        }

        // determine if file exists
        try {
            // will return true if path exists AND is a file
            exists = blackberry.io.file.exists(path);
        }
        catch (e) {
            // invalid path
            fail(FileError.ENCODING_ERR);
            return;
        }

        // path is a file
        if (exists) {
            if (create && exclusive) {
                // can't guarantee exclusivity
                fail(FileError.PATH_EXISTS_ERR);
            }
            else {
                // create entry for existing file
                createEntry();
            }
        }
        // will return true if path exists AND is a directory
        else if (blackberry.io.dir.exists(path)) {
            // the path is a directory
            fail(FileError.TYPE_MISMATCH_ERR);
        }
        // path does not exist, create it
        else if (create) {
            // create empty file
            exec(
                function(result) {
                    // file created
                    createEntry();
                },
                fail, "File", "write", [ path, "", 0 ]);
        }
        // path does not exist, don't create
        else {
            // file doesn't exist
            fail(FileError.NOT_FOUND_ERR);
        }
    },

    /**
     * Delete a directory and all of it's contents.
     *
     * @param successCallback {Function} called with no parameters
     * @param errorCallback {Function} called with a FileError
     */
    removeRecursively : function(successCallback, errorCallback) {
        // we're removing THIS directory
        var path = this.fullPath;

        var fail = function(error) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(error));
            }
        };

        // attempt to delete directory
        if (blackberry.io.dir.exists(path)) {
            // it is an error to attempt to remove the file system root
            if (exec(null, null, "File", "isFileSystemRoot", [ path ]) === true) {
                fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
            }
            else {
                try {
                    // delete the directory, setting recursive flag to true
                    blackberry.io.dir.deleteDirectory(path, true);
                    if (typeof successCallback === "function") {
                        successCallback();
                    }
                } catch (e) {
                    // permissions don't allow deletion
                    console.log(e);
                    fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
                }
            }
        }
        // it's a file, not a directory
        else if (blackberry.io.file.exists(path)) {
            fail(FileError.TYPE_MISMATCH_ERR);
        }
        // not found
        else {
            fail(FileError.NOT_FOUND_ERR);
        }
    }
};

});

// file: lib/blackberry/plugin/java/Entry.js
define("cordova/plugin/java/Entry", function(require, exports, module) {

var FileError = require('cordova/plugin/FileError'),
    LocalFileSystem = require('cordova/plugin/LocalFileSystem'),
    resolveLocalFileSystemURI = require('cordova/plugin/resolveLocalFileSystemURI'),
    requestFileSystem = require('cordova/plugin/requestFileSystem'),
    exec = require('cordova/exec');

module.exports = {
    remove : function(successCallback, errorCallback) {
        var path = this.fullPath,
            // directory contents
            contents = [];

        var fail = function(error) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(error));
            }
        };

        // file
        if (blackberry.io.file.exists(path)) {
            try {
                blackberry.io.file.deleteFile(path);
                if (typeof successCallback === "function") {
                    successCallback();
                }
            } catch (e) {
                // permissions don't allow
                fail(FileError.INVALID_MODIFICATION_ERR);
            }
        }
        // directory
        else if (blackberry.io.dir.exists(path)) {
            // it is an error to attempt to remove the file system root
            if (exec(null, null, "File", "isFileSystemRoot", [ path ]) === true) {
                fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
            } else {
                // check to see if directory is empty
                contents = blackberry.io.dir.listFiles(path);
                if (contents.length !== 0) {
                    fail(FileError.INVALID_MODIFICATION_ERR);
                } else {
                    try {
                        // delete
                        blackberry.io.dir.deleteDirectory(path, false);
                        if (typeof successCallback === "function") {
                            successCallback();
                        }
                    } catch (eone) {
                        // permissions don't allow
                        fail(FileError.NO_MODIFICATION_ALLOWED_ERR);
                    }
                }
            }
        }
        // not found
        else {
            fail(FileError.NOT_FOUND_ERR);
        }
    },
    getParent : function(successCallback, errorCallback) {
        var that = this;

        try {
            // On BlackBerry, the TEMPORARY file system is actually a temporary
            // directory that is created on a per-application basis. This is
            // to help ensure that applications do not share the same temporary
            // space. So we check to see if this is the TEMPORARY file system
            // (directory). If it is, we must return this Entry, rather than
            // the Entry for its parent.
            requestFileSystem(LocalFileSystem.TEMPORARY, 0,
                    function(fileSystem) {
                        if (fileSystem.root.fullPath === that.fullPath) {
                            if (typeof successCallback === 'function') {
                                successCallback(fileSystem.root);
                            }
                        } else {
                            resolveLocalFileSystemURI(blackberry.io.dir
                                    .getParentDirectory(that.fullPath),
                                    successCallback, errorCallback);
                        }
                    }, errorCallback);
        } catch (e) {
            if (typeof errorCallback === 'function') {
                errorCallback(new FileError(FileError.NOT_FOUND_ERR));
            }
        }
    }
};

});

// file: lib/blackberry/plugin/java/MediaError.js
define("cordova/plugin/java/MediaError", function(require, exports, module) {


// The MediaError object exists on BB OS 6+ which prevents the Cordova version
// from being defined. This object is used to merge in differences between the BB
// MediaError object and the Cordova version.
module.exports = {
        MEDIA_ERR_NONE_ACTIVE : 0,
        MEDIA_ERR_NONE_SUPPORTED : 4
};

});

// file: lib/blackberry/plugin/java/app.js
define("cordova/plugin/java/app", function(require, exports, module) {

var exec = require('cordova/exec'),
    platform = require('cordova/platform'),
    manager = require('cordova/plugin/' + platform.runtime() + '/manager');

module.exports = {
  /**
   * Clear the resource cache.
   */
  clearCache:function() {
      if (typeof blackberry.widgetcache === "undefined" || blackberry.widgetcache === null) {
          console.log("blackberry.widgetcache permission not found. Cache clear request denied.");
          return;
      }
      blackberry.widgetcache.clearAll();
  },

  /**
   * Clear web history in this web view.
   * Instead of BACK button loading the previous web page, it will exit the app.
   */
  clearHistory:function() {
    exec(null, null, "App", "clearHistory", []);
  },

  /**
   * Go to previous page displayed.
   * This is the same as pressing the backbutton on Android device.
   */
  backHistory:function() {
    // window.history.back() behaves oddly on BlackBerry, so use
    // native implementation.
    exec(null, null, "App", "backHistory", []);
  },

  /**
   * Exit and terminate the application.
   */
  exitApp:function() {
      // Call onunload if it is defined since BlackBerry does not invoke
      // on application exit.
      if (typeof window.onunload === "function") {
          window.onunload();
      }

      // allow Cordova JavaScript Extension opportunity to cleanup
      manager.destroy();

      // exit the app
      blackberry.app.exit();
  }
};

});

// file: lib/blackberry/plugin/java/app/bbsymbols.js
define("cordova/plugin/java/app/bbsymbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.clobbers('cordova/plugin/java/app', 'navigator.app');

});

// file: lib/blackberry/plugin/java/contacts.js
define("cordova/plugin/java/contacts", function(require, exports, module) {

var ContactError = require('cordova/plugin/ContactError'),
    utils = require('cordova/utils'),
    ContactUtils = require('cordova/plugin/java/ContactUtils');

module.exports = {
    /**
     * Returns an array of Contacts matching the search criteria.
     *
     * @return array of Contacts matching search criteria
     */
    find : function(fields, success, fail, options) {
        // Success callback is required. Throw exception if not specified.
        if (typeof success !== 'function') {
            throw new TypeError(
                    "You must specify a success callback for the find command.");
        }

        // Search qualifier is required and cannot be empty.
        if (!fields || !(utils.isArray(fields)) || fields.length === 0) {
            if (typeof fail == 'function') {
                fail(new ContactError(ContactError.INVALID_ARGUMENT_ERROR));
            }
            return;
        }

        // default is to return a single contact match
        var numContacts = 1;

        // search options
        var filter = null;
        if (options) {
            // return multiple objects?
            if (options.multiple === true) {
                // -1 on BlackBerry will return all contact matches.
                numContacts = -1;
            }
            filter = options.filter;
        }

        // build the filter expression to use in find operation
        var filterExpression = ContactUtils.buildFilterExpression(fields, filter);

        // find matching contacts
        // Note: the filter expression can be null here, in which case, the find
        // won't filter
        var bbContacts = blackberry.pim.Contact.find(filterExpression, null, numContacts);

        // convert to Contact from blackberry.pim.Contact
        var contacts = [];
        for (var i = 0; i < bbContacts.length; i++) {
            if (bbContacts[i]) {
                // W3C Contacts API specification states that only the fields
                // in the search filter should be returned, so we create
                // a new Contact object, copying only the fields specified
                contacts.push(ContactUtils.createContact(bbContacts[i], fields));
            }
        }

        // return results
        success(contacts);
    }

};

});

// file: lib/blackberry/plugin/java/contacts/bbsymbols.js
define("cordova/plugin/java/contacts/bbsymbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.merges('cordova/plugin/java/contacts', 'navigator.contacts');
modulemapper.merges('cordova/plugin/java/Contact', 'Contact');

});

// file: lib/blackberry/plugin/java/file/bbsymbols.js
define("cordova/plugin/java/file/bbsymbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.clobbers('cordova/plugin/File', 'File');
modulemapper.merges('cordova/plugin/java/DirectoryEntry', 'DirectoryEntry');
modulemapper.merges('cordova/plugin/java/Entry', 'Entry');


});

// file: lib/blackberry/plugin/java/manager.js
define("cordova/plugin/java/manager", function(require, exports, module) {

var cordova = require('cordova');

function _exec(win, fail, clazz, action, args) {
    var callbackId = clazz + cordova.callbackId++,
        origResult,
        evalResult,
        execResult;

    try {
        if (win || fail) {
            cordova.callbacks[callbackId] = {success: win, fail: fail};
        }

        // Note: Device returns string, but for some reason emulator returns object - so convert to string.
        origResult = "" + org.apache.cordova.JavaPluginManager.exec(clazz, action, callbackId, JSON.stringify(args), true);

        // If a result was returned
        if (origResult.length > 0) {
            evalResult = JSON.parse(origResult);

            // If status is OK, then return evalResult value back to caller
            if (evalResult.status === cordova.callbackStatus.OK) {

                // If there is a success callback, then call it now with returned evalResult value
                if (win) {
                    // Clear callback if not expecting any more results
                    if (!evalResult.keepCallback) {
                        delete cordova.callbacks[callbackId];
                    }
                }
            } else if (evalResult.status === cordova.callbackStatus.NO_RESULT) {

                // Clear callback if not expecting any more results
                if (!evalResult.keepCallback) {
                    delete cordova.callbacks[callbackId];
                }
            } else {
                // If there is a fail callback, then call it now with returned evalResult value
                if (fail) {

                    // Clear callback if not expecting any more results
                    if (!evalResult.keepCallback) {
                        delete cordova.callbacks[callbackId];
                    }
                }
            }
            execResult = evalResult;
        } else {
            // Asynchronous calls return an empty string. Return a NO_RESULT
            // status for those executions.
            execResult = {"status" : cordova.callbackStatus.NO_RESULT,
                    "message" : ""};
        }
    } catch (e) {
        console.log("BlackBerryPluginManager Error: " + e);
        execResult = {"status" : cordova.callbackStatus.ERROR,
                      "message" : e.message};
    }

    return execResult;
}

module.exports = {
    exec: function (win, fail, clazz, action, args) {
        return _exec(win, fail, clazz, action, args);
    },
    resume: org.apache.cordova.JavaPluginManager.resume,
    pause: org.apache.cordova.JavaPluginManager.pause,
    destroy: org.apache.cordova.JavaPluginManager.destroy
};

});

// file: lib/blackberry/plugin/java/media/bbsymbols.js
define("cordova/plugin/java/media/bbsymbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.defaults('cordova/plugin/Media', 'Media');
modulemapper.defaults('cordova/plugin/MediaError', 'MediaError');
// Exists natively on BB OS 6+, merge in Cordova specifics
modulemapper.merges('cordova/plugin/java/MediaError', 'MediaError');

});

// file: lib/blackberry/plugin/java/notification.js
define("cordova/plugin/java/notification", function(require, exports, module) {

var exec = require('cordova/exec');

/**
 * Provides BlackBerry enhanced notification API.
 */
module.exports = {
    activityStart : function(title, message) {
        // If title and message not specified then mimic Android behavior of
        // using default strings.
        if (typeof title === "undefined" && typeof message == "undefined") {
            title = "Busy";
            message = 'Please wait...';
        }

        exec(null, null, 'Notification', 'activityStart', [ title, message ]);
    },

    /**
     * Close an activity dialog
     */
    activityStop : function() {
        exec(null, null, 'Notification', 'activityStop', []);
    },

    /**
     * Display a progress dialog with progress bar that goes from 0 to 100.
     *
     * @param {String}
     *            title Title of the progress dialog.
     * @param {String}
     *            message Message to display in the dialog.
     */
    progressStart : function(title, message) {
        exec(null, null, 'Notification', 'progressStart', [ title, message ]);
    },

    /**
     * Close the progress dialog.
     */
    progressStop : function() {
        exec(null, null, 'Notification', 'progressStop', []);
    },

    /**
     * Set the progress dialog value.
     *
     * @param {Number}
     *            value 0-100
     */
    progressValue : function(value) {
        exec(null, null, 'Notification', 'progressValue', [ value ]);
    }
};

});

// file: lib/blackberry/plugin/java/notification/bbsymbols.js
define("cordova/plugin/java/notification/bbsymbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.merges('cordova/plugin/java/notification', 'navigator.notification');

});

// file: lib/blackberry/plugin/java/platform.js
define("cordova/plugin/java/platform", function(require, exports, module) {

module.exports = {
    id: "blackberry",
    initialize:function() {
        var cordova = require('cordova'),
            exec = require('cordova/exec'),
            channel = require('cordova/channel'),
            platform = require('cordova/platform'),
            manager = require('cordova/plugin/' + platform.runtime() + '/manager'),
            app = require('cordova/plugin/java/app');

        // BB OS 5 does not define window.console.
        if (typeof window.console === 'undefined') {
            window.console = {};
        }

        // Override console.log with native logging ability.
        // BB OS 7 devices define console.log for use with web inspector
        // debugging. If console.log is already defined, invoke it in addition
        // to native logging.
        var origLog = window.console.log;
        window.console.log = function(msg) {
            if (typeof origLog === 'function') {
                origLog.call(window.console, msg);
            }
            org.apache.cordova.Logger.log(''+msg);
        };

        // Mapping of button events to BlackBerry key identifier.
        var buttonMapping = {
            'backbutton'         : blackberry.system.event.KEY_BACK,
            'conveniencebutton1' : blackberry.system.event.KEY_CONVENIENCE_1,
            'conveniencebutton2' : blackberry.system.event.KEY_CONVENIENCE_2,
            'endcallbutton'      : blackberry.system.event.KEY_ENDCALL,
            'menubutton'         : blackberry.system.event.KEY_MENU,
            'startcallbutton'    : blackberry.system.event.KEY_STARTCALL,
            'volumedownbutton'   : blackberry.system.event.KEY_VOLUMEDOWN,
            'volumeupbutton'     : blackberry.system.event.KEY_VOLUMEUP
        };

        // Generates a function which fires the specified event.
        var fireEvent = function(event) {
            return function() {
                cordova.fireDocumentEvent(event, null);
            };
        };

        var eventHandler = function(event) {
            return function() {
                // If we just attached the first handler, let native know we
                // need to override the hardware button.
                if (this.numHandlers) {
                    blackberry.system.event.onHardwareKey(
                            buttonMapping[event], fireEvent(event));
                }
                // If we just detached the last handler, let native know we
                // no longer override the hardware button.
                else {
                    blackberry.system.event.onHardwareKey(
                            buttonMapping[event], null);
                }
            };
        };

        // Inject listeners for buttons on the document.
        for (var button in buttonMapping) {
            if (buttonMapping.hasOwnProperty(button)) {
                var buttonChannel = cordova.addDocumentEventHandler(button);
                buttonChannel.onHasSubscribersChange = eventHandler(button);
            }
        }

        // Fires off necessary code to pause/resume app
        var resume = function() {
            cordova.fireDocumentEvent('resume');
            manager.resume();
        };
        var pause = function() {
            cordova.fireDocumentEvent('pause');
            manager.pause();
        };

        /************************************************
         * Patch up the generic pause/resume listeners. *
         ************************************************/

        // Unsubscribe handler - turns off native backlight change
        // listener
        var onHasSubscribersChange = function() {
            // If we just attached the first handler and there are
            // no pause handlers, start the backlight system
            // listener on the native side.
            if (this.numHandlers && (channel.onResume.numHandlers + channel.onPause.numHandlers === 1)) {
                exec(backlightWin, backlightFail, "App", "detectBacklight", []);
            } else if (channel.onResume.numHandlers === 0 && channel.onPause.numHandlers === 0) {
                exec(null, null, 'App', 'ignoreBacklight', []);
            }
        };

        // Native backlight detection win/fail callbacks
        var backlightWin = function(isOn) {
            if (isOn === true) {
                resume();
            } else {
                pause();
            }
        };
        var backlightFail = function(e) {
            console.log("Error detecting backlight on/off.");
        };

        // Override stock resume and pause listeners so we can trigger
        // some native methods during attach/remove
        channel.onResume = cordova.addDocumentEventHandler('resume');
        channel.onResume.onHasSubscribersChange = onHasSubscribersChange;
        channel.onPause = cordova.addDocumentEventHandler('pause');
        channel.onPause.onHasSubscribersChange = onHasSubscribersChange;

        // Fire resume event when application brought to foreground.
        blackberry.app.event.onForeground(resume);

        // Fire pause event when application sent to background.
        blackberry.app.event.onBackground(pause);

        // Trap BlackBerry WebWorks exit. Allow plugins to clean up before exiting.
        blackberry.app.event.onExit(app.exitApp);
    }
};

});

// file: lib/blackberry/plugin/qnx/compass/bbsymbols.js
define("cordova/plugin/qnx/compass/bbsymbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.merges('cordova/plugin/qnx/compass', 'navigator.compass');

});

// file: lib/blackberry/plugin/qnx/inappbrowser/bbsymbols.js
define("cordova/plugin/qnx/inappbrowser/bbsymbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.clobbers('cordova/plugin/InAppBrowser', 'open');

});

// file: lib/blackberry/plugin/webworks/accelerometer.js
define("cordova/plugin/webworks/accelerometer", function(require, exports, module) {

var cordova = require('cordova'),
    callback;

module.exports = {
    start: function (args, win, fail) {
        window.removeEventListener("devicemotion", callback);
        callback = function (motion) {
            win({
                x: motion.accelerationIncludingGravity.x,
                y: motion.accelerationIncludingGravity.y,
                z: motion.accelerationIncludingGravity.z,
                timestamp: motion.timestamp
            });
        };
        window.addEventListener("devicemotion", callback);
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    },
    stop: function (args, win, fail) {
        window.removeEventListener("devicemotion", callback);
        return { "status" : cordova.callbackStatus.OK, "message" : "removed" };
    }
};

});

// file: lib/blackberry/plugin/webworks/logger.js
define("cordova/plugin/webworks/logger", function(require, exports, module) {

var cordova = require('cordova');

module.exports = {
    log: function (args, win, fail) {
        console.log(args);
        return {"status" : cordova.callbackStatus.OK,
                "message" : 'Message logged to console: ' + args};
    }
};

});

// file: lib/blackberry/plugin/webworks/media.js
define("cordova/plugin/webworks/media", function(require, exports, module) {

var cordova = require('cordova'),
    audioObjects = {};

module.exports = {
    create: function (args, win, fail) {
        if (!args.length) {
            return {"status" : 9, "message" : "Media Object id was not sent in arguments"};
        }

        var id = args[0],
            src = args[1];

        if (typeof src == "undefined"){
            audioObjects[id] = new Audio();
        } else {
            audioObjects[id] = new Audio(src);
        }

        return {"status" : 1, "message" : "Audio object created" };
    },
    startPlayingAudio: function (args, win, fail) {
        if (!args.length) {
            return {"status" : 9, "message" : "Media Object id was not sent in arguments"};
        }

        var id = args[0],
            audio = audioObjects[id],
            result;

        if (args.length === 1 || typeof args[1] == "undefined" ) {
            return {"status" : 9, "message" : "Media source argument not found"};
        }

        if (audio) {
            audio.pause();
            audioObjects[id] = undefined;
        }

        audio = audioObjects[id] = new Audio(args[1]);
        audio.play();
        return {"status" : 1, "message" : "Audio play started" };
    },
    stopPlayingAudio: function (args, win, fail) {
        if (!args.length) {
            return {"status" : 9, "message" : "Media Object id was not sent in arguments"};
        }

        var id = args[0],
            audio = audioObjects[id],
            result;

        if (!audio) {
            return {"status" : 2, "message" : "Audio Object has not been initialized"};
        }

        audio.pause();
        audioObjects[id] = undefined;

        return {"status" : 1, "message" : "Audio play stopped" };
    },
    seekToAudio: function (args, win, fail) {
        if (!args.length) {
            return {"status" : 9, "message" : "Media Object id was not sent in arguments"};
        }

        var id = args[0],
            audio = audioObjects[id],
            result;

        if (!audio) {
            result = {"status" : 2, "message" : "Audio Object has not been initialized"};
        } else if (args.length === 1) {
            result = {"status" : 9, "message" : "Media seek time argument not found"};
        } else {
            try {
                audio.currentTime = args[1];
            } catch (e) {
                console.log('Error seeking audio: ' + e);
                return {"status" : 3, "message" : "Error seeking audio: " + e};
            }

            result = {"status" : 1, "message" : "Seek to audio succeeded" };
        }
        return result;
    },
    pausePlayingAudio: function (args, win, fail) {
        if (!args.length) {
            return {"status" : 9, "message" : "Media Object id was not sent in arguments"};
        }

        var id = args[0],
            audio = audioObjects[id],
            result;

        if (!audio) {
            return {"status" : 2, "message" : "Audio Object has not been initialized"};
        }

        audio.pause();

        return {"status" : 1, "message" : "Audio paused" };
    },
    getCurrentPositionAudio: function (args, win, fail) {
        if (!args.length) {
            return {"status" : 9, "message" : "Media Object id was not sent in arguments"};
        }

        var id = args[0],
            audio = audioObjects[id],
            result;

        if (!audio) {
            return {"status" : 2, "message" : "Audio Object has not been initialized"};
        }

        return {"status" : 1, "message" : audio.currentTime };
    },
    getDuration: function (args, win, fail) {
        if (!args.length) {
            return {"status" : 9, "message" : "Media Object id was not sent in arguments"};
        }

        var id = args[0],
            audio = audioObjects[id],
            result;

        if (!audio) {
            return {"status" : 2, "message" : "Audio Object has not been initialized"};
        }

        return {"status" : 1, "message" : audio.duration };
    },
    startRecordingAudio: function (args, win, fail) {
        if (!args.length) {
            return {"status" : 9, "message" : "Media Object id was not sent in arguments"};
        }

        if (args.length <= 1) {
            return {"status" : 9, "message" : "Media start recording, insufficient arguments"};
        }

        blackberry.media.microphone.record(args[1], win, fail);
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    },
    stopRecordingAudio: function (args, win, fail) {
    },
    release: function (args, win, fail) {
        if (!args.length) {
            return {"status" : 9, "message" : "Media Object id was not sent in arguments"};
        }

        var id = args[0],
            audio = audioObjects[id],
            result;

        if (audio) {
            if(audio.src !== ""){
                audio.src = undefined;
            }
            audioObjects[id] = undefined;
            //delete audio;
        }

        result = {"status" : 1, "message" : "Media resources released"};

        return result;
    }
};

});

// file: lib/blackberry/plugin/webworks/notification.js
define("cordova/plugin/webworks/notification", function(require, exports, module) {

var cordova = require('cordova');

module.exports = {
    alert: function (args, win, fail) {
        if (args.length !== 3) {
            return {"status" : 9, "message" : "Notification action - alert arguments not found"};
        }

        //Unpack and map the args
        var msg = args[0],
            title = args[1],
            btnLabel = args[2];

        blackberry.ui.dialog.customAskAsync.apply(this, [ msg, [ btnLabel ], win, { "title" : title } ]);
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    },
    confirm: function (args, win, fail) {
        if (args.length !== 3) {
            return {"status" : 9, "message" : "Notification action - confirm arguments not found"};
        }

        //Unpack and map the args
        var msg = args[0],
            title = args[1],
            btnLabel = args[2],
            btnLabels = btnLabel.split(",");

        blackberry.ui.dialog.customAskAsync.apply(this, [msg, btnLabels, win, {"title" : title} ]);
        return { "status" : cordova.callbackStatus.NO_RESULT, "message" : "WebWorks Is On It" };
    }
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

// file: lib/scripts/bootstrap-blackberry.js

document.addEventListener("DOMContentLoaded", function () {
    if (require('cordova/platform').runtime() === 'air') {
        require('cordova/channel').onNativeReady.fire();
    }
});

})();