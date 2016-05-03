// Platform: webos
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

// file: lib/webos/exec.js
define("cordova/exec", function(require, exports, module) {

/**
 * Execute a cordova command.  It is up to the native side whether this action
 * is synchronous or asynchronous.  The native side can return:
 *      Synchronous: PluginResult object as a JSON string
 *      Asynchrounous: Empty string ""
 * If async, the native side will cordova.callbackSuccess or cordova.callbackError,
 * depending upon the result of the action.
 *
 * @param {Function} success    The success callback
 * @param {Function} fail       The fail callback
 * @param {String} service      The name of the service to use
 * @param {String} action       Action to be run in cordova
 * @param {String[]} [args]     Zero or more arguments to pass to the method
 */

var plugins = {
    "Device": require('cordova/plugin/webos/device'),
    "NetworkStatus": require('cordova/plugin/webos/network'),
    "Compass": require('cordova/plugin/webos/compass'),
    "Camera": require('cordova/plugin/webos/camera'),
    "Accelerometer" : require('cordova/plugin/webos/accelerometer'),
    "Notification" : require('cordova/plugin/webos/notification'),
    "Geolocation": require('cordova/plugin/webos/geolocation')
};

module.exports = function(success, fail, service, action, args) {
    try {
        console.error("exec:call plugin:"+service+":"+action);
        plugins[service][action](success, fail, args);
    }
    catch(e) {
        console.error("missing exec: " + service + "." + action);
        console.error(args);
        console.error(e);
        console.error(e.stack);
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

// file: lib/webos/platform.js
define("cordova/platform", function(require, exports, module) {

/*global Mojo:false */

var service=require('cordova/plugin/webos/service'),
    cordova = require('cordova');

module.exports = {
    id: "webos",
    initialize: function() {
        var modulemapper = require('cordova/modulemapper');

        modulemapper.loadMatchingModules(/cordova.*\/symbols$/);

        modulemapper.merges('cordova/plugin/webos/service', 'navigator.service');
        modulemapper.merges('cordova/plugin/webos/application', 'navigator.application');
        modulemapper.merges('cordova/plugin/webos/window', 'navigator.window');
        modulemapper.merges('cordova/plugin/webos/orientation', 'navigator.orientation');
        modulemapper.merges('cordova/plugin/webos/keyboard', 'navigator.keyboard');

        modulemapper.mapModules(window);

        if (window.PalmSystem) {
            window.PalmSystem.stageReady();
        }

        // create global Mojo object if it does not exist
        Mojo = window.Mojo || {};

        // wait for deviceready before listening and firing document events
        document.addEventListener("deviceready", function () {

            // LunaSysMgr calls this when the windows is maximized or opened.
            window.Mojo.stageActivated = function() {
                console.log("stageActivated");
                cordova.fireDocumentEvent("resume");
            };
            // LunaSysMgr calls this when the windows is minimized or closed.
            window.Mojo.stageDeactivated = function() {
                console.log("stageDeactivated");
                cordova.fireDocumentEvent("pause");
            };
            // LunaSysMgr calls this when a KeepAlive app's window is hidden
            window.Mojo.hide = function() {
                console.log("hide");
            };
            // LunaSysMgr calls this when a KeepAlive app's window is shown
            window.Mojo.show = function() {
                console.log("show");
            };

            // LunaSysMgr calls this whenever an app is "launched;"
            window.Mojo.relaunch = function() {
                // need to return true to tell sysmgr the relaunch succeeded.
                // otherwise, it'll try to focus the app, which will focus the first
                // opened window of an app with multiple windows.

                var lp=JSON.parse(PalmSystem.launchParams) || {};

                if (lp['palm-command'] && lp['palm-command'] == 'open-app-menu') {
                    console.log("event:ToggleAppMenu");
                    cordova.fireDocumentEvent("menubutton");
                }

                console.log("relaunch");
                return true;
            };

            // start to listen for network connection changes
            service.Request('palm://com.palm.connectionmanager', {
                method: 'getstatus',
                parameters: { subscribe: true },
                onSuccess: function (result) {
                    console.log("subscribe:result:"+JSON.stringify(result));

                    if (!result.isInternetConnectionAvailable) {
                        if (navigator.onLine) {
                            console.log("Firing event:offline");
                            cordova.fireDocumentEvent("offline");
                        }
                    } else {
                        console.log("Firing event:online");
                        cordova.fireDocumentEvent("online");
                    }
                },
                onFailure: function(e) {
                    console.error("subscribe:error");
                }
            });

        });
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

// file: lib/webos/plugin/file/symbols.js
define("cordova/plugin/file/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper'),
    symbolshelper = require('cordova/plugin/file/symbolshelper');

symbolshelper(modulemapper.defaults);
modulemapper.clobbers('cordova/plugin/webos/requestfilesystem', 'requestFileSystem');
modulemapper.clobbers('cordova/plugin/webos/filereader', 'FileReader');

});

// file: lib/webos/plugin/notification/symbols.js
define("cordova/plugin/notification/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.defaults('cordova/plugin/notification', 'navigator.notification');
modulemapper.merges('cordova/plugin/webos/notification', 'navigator.notification');

});

// file: lib/webos/plugin/webos/accelerometer.js
define("cordova/plugin/webos/accelerometer", function(require, exports, module) {

var callback;
module.exports = {
    /*
     * Tells WebOS to put higher priority on accelerometer resolution. Also relaxes the internal garbage collection events.
     * @param {Boolean} state
     * Dependencies: Mojo.windowProperties
     * Example:
     *         navigator.accelerometer.setFastAccelerometer(true)
     */
    setFastAccelerometer: function(state) {
        navigator.windowProperties.fastAccelerometer = state;
        navigator.window.setWindowProperties();
    },

    /*
     * Starts the native acceleration listener.
     */
    start: function(win,fail,args) {
        console.error("webos plugin accelerometer start");
        window.removeEventListener("acceleration", callback);
        callback = function(event) {
            var accel = new Acceleration(event.accelX*-9.81, event.accelY*-9.81, event.accelZ*-9.81);
            win(accel);
        };
        document.addEventListener("acceleration", callback);
    },
    stop: function (win,fail,args) {
        console.error("webos plugin accelerometer stop");
        window.removeEventListener("acceleration", callback);
    }
};

});

// file: lib/webos/plugin/webos/application.js
define("cordova/plugin/webos/application", function(require, exports, module) {

module.exports = {
    isActivated: function(inWindow) {
        inWindow = inWindow || window;
        if(inWindow.PalmSystem) {
            return inWindow.PalmSystem.isActivated;
        }
        return false;
    },

    /*
     * Tell webOS to activate the current page of your app, bringing it into focus.
     * Example:
     *         navigator.application.activate();
     */
    activate: function(inWindow) {
        inWindow = inWindow || window;
        if(inWindow.PalmSystem) {
            inWindow.PalmSystem.activate();
        }
    },

    /*
     * Tell webOS to deactivate your app.
     * Example:
     *        navigator.application.deactivate();
     */
    deactivate: function(inWindow) {
        inWindow = inWindow || window;
        if(inWindow.PalmSystem) {
            inWindow.PalmSystem.deactivate();
        }
    },

    /*
     * Returns the identifier of the current running application (e.g. com.yourdomain.yourapp).
     * Example:
     *        navigator.application.getIdentifier();
     */
    getIdentifier: function() {
        return PalmSystem.identifier;
    },

    fetchAppId: function() {
        if (window.PalmSystem) {
            // PalmSystem.identifier: <appid> <processid>
            return PalmSystem.identifier.split(" ")[0];
        }
    }
};

});

// file: lib/webos/plugin/webos/camera.js
define("cordova/plugin/webos/camera", function(require, exports, module) {

var service = require('cordova/plugin/webos/service');

module.exports = {
    takePicture: function(successCallback, errorCallback, options) {
        var filename = (options || {}).filename | "";

        service.Request('palm://com.palm.applicationManager', {
            method: 'launch',
            parameters: {
            id: 'com.palm.app.camera',
            params: {
                    appId: 'com.palm.app.camera',
                    name: 'capture',
                    sublaunch: true,
                    filename: filename
                }
            },
            onSuccess: successCallback,
            onFailure: errorCallback
        });
    }
};

});

// file: lib/webos/plugin/webos/compass.js
define("cordova/plugin/webos/compass", function(require, exports, module) {

var CompassHeading = require('cordova/plugin/CompassHeading'),
    CompassError = require('cordova/plugin/CompassError');

module.exports = {
    getHeading: function (win, lose) {
        // only TouchPad and Pre3 have a Compass/Gyro
        if (window.device.name !== "TouchPad" && window.device.name !== "Prē3") {
            lose({code: CompassError.COMPASS_NOT_SUPPORTED});
        } else {
            console.error("webos plugin compass getheading");
            var onReadingChanged = function (e) {
                var heading = new CompassHeading(e.magHeading, e.trueHeading);
                document.removeEventListener("compass", onReadingChanged);
                win(heading);
            };
            document.addEventListener("compass", onReadingChanged);
        }
    }
};

});

// file: lib/webos/plugin/webos/device.js
define("cordova/plugin/webos/device", function(require, exports, module) {

var service = require('cordova/plugin/webos/service');

module.exports = {
    getDeviceInfo: function(success, fail, args) {
        console.log("webOS Plugin: Device - getDeviceInfo");

        service.Request('palm://com.palm.preferences/systemProperties', {
            method:"Get",
            parameters:{"key": "com.palm.properties.nduid" },
            onSuccess: function (result) {
                var parsedData = JSON.parse(PalmSystem.deviceInfo);

                success({
                    cordova: "2.2.0",
                    platform: "HP webOS",
                    name: parsedData.modelName,
                    version: parsedData.platformVersion,
                    uuid: result["com.palm.properties.nduid"]
                });
            }
        });
    }
};

});

// file: lib/webos/plugin/webos/file.js
define("cordova/plugin/webos/file", function(require, exports, module) {

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

// file: lib/webos/plugin/webos/filereader.js
define("cordova/plugin/webos/filereader", function(require, exports, module) {

var FileError = require('cordova/plugin/FileError'),
    ProgressEvent = require('cordova/plugin/ProgressEvent');

var FileReader = function() {
    this.fileName = "";

    this.readyState = 0; // FileReader.EMPTY

    // File data
    this.result = null;

    // Error
    this.error = null;

    // Event handlers
    this.onloadstart = null;    // When the read starts.
    this.onprogress = null;     // While reading (and decoding) file or fileBlob data, and reporting partial file data (progess.loaded/progress.total)
    this.onload = null;         // When the read has successfully completed.
    this.onerror = null;        // When the read has failed (see errors).
    this.onloadend = null;      // When the request has completed (either in success or failure).
    this.onabort = null;        // When the read has been aborted. For instance, by invoking the abort() method.
};

FileReader.prototype.readAsText = function(file, encoding) {
    console.error("webos plugin filereader readastext:" + file);
    //Mojo has no file i/o yet, so we use an xhr. very limited

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

    var xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {
        console.error("onreadystatechange:"+xhr.readyState+" "+xhr.status);
        if (xhr.readyState == 4) {
            if (xhr.status == 200 && xhr.responseText) {
                console.error("file read completed");
                // Save result
                me.result = xhr.responseText;

                // If onload callback
                if (typeof me.onload === "function") {
                    me.onload(new ProgressEvent("load", {target:me}));
                }

                // DONE state
                me.readyState = FileReader.DONE;

                // If onloadend callback
                if (typeof me.onloadend === "function") {
                    me.onloadend(new ProgressEvent("loadend", {target:me}));
                }

            } else {
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
        }
    };
    xhr.open("GET", file, true);
    xhr.send();
};

module.exports = FileReader;

});

// file: lib/webos/plugin/webos/geolocation.js
define("cordova/plugin/webos/geolocation", function(require, exports, module) {

var service = require('cordova/plugin/webos/service');

module.exports = {
    getLocation: function(successCallback, errorCallback, options) {
        console.error("webos plugin geolocation getlocation");
        var request = service.Request('palm://com.palm.location', {
            method: "getCurrentPosition",
            onSuccess: function(event) {
                var alias={};
                alias.lastPosition = {
                    coords: {
                        latitude: event.latitude,
                        longitude: event.longitude,
                        altitude: (event.altitude >= 0 ? event.altitude: null),
                        speed: (event.velocity >= 0 ? event.velocity: null),
                        heading: (event.heading >= 0 ? event.heading: null),
                        accuracy: (event.horizAccuracy >= 0 ? event.horizAccuracy: null),
                        altitudeAccuracy: (event.vertAccuracy >= 0 ? event.vertAccuracy: null)
                    },
                    timestamp: new Date().getTime()
                };

                successCallback(alias.lastPosition);
            },
            onFailure: function() {
                errorCallback();
            }
        });
    }
};

});

// file: lib/webos/plugin/webos/keyboard.js
define("cordova/plugin/webos/keyboard", function(require, exports, module) {

var _isShowing = null,
    _manual = null;

module.exports = {
    types: {
        text: 0,
        password: 1,
        search: 2,
        range: 3,
        email: 4,
        number: 5,
        phone: 6,
        url: 7,
        color: 8
    },
    isShowing: function() {
        return !!_isShowing;
    },
    show: function(type){
        if(this.isManualMode()) {
            PalmSystem.keyboardShow(type || 0);
        }
    },
    hide: function(){
        if(this.isManualMode()) {
            PalmSystem.keyboardHide();
        }
    },
    setManualMode: function(mode){
        _manual = mode;
        PalmSystem.setManualKeyboardEnabled(mode);
    },
    isManualMode: function(){
        return _manual || false;
    },
    forceShow: function(inType){
        this.setManualMode(true);
        PalmSystem.keyboardShow(inType || 0);
    },
    forceHide: function(){
        this.setManualMode(true);
        PalmSystem.keyboardHide();
    }
};

});

// file: lib/webos/plugin/webos/network.js
define("cordova/plugin/webos/network", function(require, exports, module) {

var service=require('cordova/plugin/webos/service'),
    Connection = require('cordova/plugin/Connection');

module.exports = {
    /**
     * Get connection info
     *
     * @param {Function} successCallback The function to call when the Connection data is available
     * @param {Function} errorCallback The function to call when there is an error getting the Connection data. (OPTIONAL)
     */
    getConnectionInfo: function (successCallback, errorCallback) {
        // Get info
        console.log("webos Plugin: NetworkStatus - getConnectionInfo");

        service.Request('palm://com.palm.connectionmanager', {
            method: 'getstatus',
            parameters: {},
            onSuccess: function (result) {
                console.log("result:"+JSON.stringify(result));

                var info={};
                if (!result.isInternetConnectionAvailable) { info.type=Connection.NONE; }
                if (result.wifi && result.wifi.onInternet) { info.type=Connection.WIFI; }
                if (result.wan && result.wan.state==="connected") { info.type=Connection.CELL_2G; }

                successCallback(info.type);
            },
            onFailure: errorCallback
        });
    }
};

});

// file: lib/webos/plugin/webos/notification.js
define("cordova/plugin/webos/notification", function(require, exports, module) {

module.exports = {
    /*
     * adds a dashboard to the WebOS app
     * @param {String} url
     * @param {String} html
     * Example:
     *        navigator.notification.newDashboard("dashboard.html");
     */
    newDashboard: function(url, html) {
        var win = window.open(url, "_blank", "attributes={\"window\":\"dashboard\"}");
        html && win.document.write(html);
        win.PalmSystem.stageReady();
    },

    /*
     * Displays a banner notification. If specified, will send your 'response' object as data via the 'palmsystem' DOM event.
     * If no 'icon' filename is specified, will use a small version of your application icon.
     * @param {String} message
     * @param {Object} response
     * @param {String} icon
     * @param {String} soundClass class of the sound; supported classes are: "ringtones", "alerts", "alarm", "calendar", "notification"
     * @param {String} soundFile partial or full path to the sound file
     * @param {String} soundDurationMs of sound in ms
     * Example:
     *        navigator.notification.showBanner('test message');
     */
    showBanner: function(message, response, icon, soundClass, soundFile, soundDurationMs) {
        response = response || {
            banner: true
        };
        PalmSystem.addBannerMessage(message, JSON.stringify(response), icon, soundClass, soundFile, soundDurationMs);
    },

    /**
     * Remove a banner from the banner area. The category parameter defaults to 'banner'. Will not remove
     * messages that are already displayed.
     * @param {String} category
            Value defined by the application and usually same one used in {@link showBanner}.
            It is used if you have more than one kind of banner message.
     */
    removeBannerMessage: function(category) {
        var bannerKey = category || 'banner';
        var bannerId = this.banners.get(bannerKey);
        if (bannerId) {
            try {
                PalmSystem.removeBannerMessage(bannerId);
            } catch(removeBannerException) {
                window.debug.error(removeBannerException.toString());
            }
        }
    },

    /*
     * Remove all pending banner messages from the banner area. Will not remove messages that are already displayed.
     */
    clearBannerMessage: function() {
        PalmSystem.clearBannerMessage();
    },

    /*
     * This function vibrates the device
     * @param {number} duration The duration in ms to vibrate for.
     * @param {number} intensity The intensity of the vibration
     */
    vibrate_private: function(duration, intensity) {
        //the intensity for palm is inverted; 0=high intensity, 100=low intensity
        //this is opposite from our api, so we invert
        if (isNaN(intensity) || intensity > 100 || intensity <= 0)
        intensity = 0;
        else
        intensity = 100 - intensity;

        // if the app id does not have the namespace "com.palm.", an error will be thrown here
        //this.vibhandle = new Mojo.Service.Request("palm://com.palm.vibrate", {
        this.vibhandle = navigator.service.Request("palm://com.palm.vibrate", {
            method: 'vibrate',
            parameters: {
                'period': intensity,
                'duration': duration
            }
        },
        false);
    },

    vibrate: function(param) {
        PalmSystem.playSoundNotification('vibrate');
    },
    /*
     * Plays the specified sound
     * @param {String} soundClass class of the sound; supported classes are: "ringtones", "alerts", "alarm", "calendar", "notification"
     * @param {String} soundFile partial or full path to the sound file
     * @param {String} soundDurationMs of sound in ms
     */
    beep: function(param) {
        PalmSystem.playSoundNotification('alerts');
    },

    getRootWindow: function() {
        var w = window.opener || window.rootWindow || window.top || window;
        if(!w.setTimeout) { // use this window as the root if we don't have access to the real root.
            w = window;
        }
        return w;
    },

    open: function(inOpener, inUrl, inName, inAttributes, inWindowInfo) {
        var url = inUrl;
        var a = inAttributes && JSON.stringify(inAttributes);
        a = "attributes=" + a;
        var i = inWindowInfo ? inWindowInfo + ", " : "";
        return inOpener.open(url, inName, i + a);
    },

    openWindow: function(inUrl, inName, inParams, inAttributes, inWindowInfo) {
        //var attributes = inAttributes || {};
        //attributes.window = attributes.window || "card";
        // NOTE: make the root window open all windows.
        return this.open(this.getRootWindow(), inUrl, inName || "", inAttributes, inWindowInfo);
    },

    alert: function(message,callback,title,buttonName) {
        var inAttributes = {};
        //inAttributes.window = "card"; // create card
        inAttributes.window = "popupalert"; // create popup
        //inAttributes.window="dashboard"; // create dashboard
        var html='<html><head><script>setTimeout(function(f){var el=window.document.getElementById("b1");console.error(el);el.addEventListener("click",function(f){window.close();},false);},500);</script></head><body>'+message+'<br/><button id="b1">'+buttonName+'</button></body></html>';
        var inName="PopupAlert";
        var inUrl="";
        var inParams={};
        var inHeight=120;
        var w = this.openWindow(inUrl, inName, inParams, inAttributes, "height=" + (inHeight || 200));
        w.document.write(html);
        w.PalmSystem.stageReady();
    }
};

});

// file: lib/webos/plugin/webos/orientation.js
define("cordova/plugin/webos/orientation", function(require, exports, module) {

module.exports = {
    setOrientation: function(orientation) {
        PalmSystem.setWindowOrientation(orientation);
    },

    /*
     * Returns the current window orientation
     * orientation is one of 'up', 'down', 'left', 'right', or 'free'
     */
    getCurrentOrientation: function() {
          return PalmSystem.windowOrientation;
    }
};

});

// file: lib/webos/plugin/webos/requestfilesystem.js
define("cordova/plugin/webos/requestfilesystem", function(require, exports, module) {

module.exports = function(type,size,successCallback,errorCallback) {
    console.error("requestFileSystem");

    var theFileSystem={};
    theFileSystem.name="webOS";
    theFileSystem.root={};
    theFileSystem.root.name="Root";

    theFileSystem.root.getFile=function(filename,options,successCallback,errorCallback) {
        console.error("getFile");
        if (options.create) { errorCallback(); }
        var theFile=filename;
        successCallback(theFile);
    };

    successCallback(theFileSystem);
};

});

// file: lib/webos/plugin/webos/service.js
define("cordova/plugin/webos/service", function(require, exports, module) {

function Service() { }

Service.prototype.Request = function (uri, params) {
    var req = new PalmServiceBridge();
    var url = uri + "/" + (params.method || "");
    req.url = url;

    this.req = req;
    this.url = url;
    this.params = params || {};

    this.call(params);

    return this;
};

Service.prototype.call = function(params) {
    var onsuccess = null;
    var onfailure = null;
    var oncomplete = null;

    if (typeof params.onSuccess === 'function')
        onsuccess = params.onSuccess;

    if (typeof params.onFailure === 'function')
        onerror = params.onFailure;

    if (typeof params.onComplete === 'function')
        oncomplete = params.onComplete;

    this.req.onservicecallback = callback;

    function callback(msg) {
        var response = JSON.parse(msg);

        if ((response.errorCode) && onfailure)
            onfailure(response);
        else if (onsuccess)
            onsuccess(response);

        if (oncomplete)
            oncomplete(response);
    }

    this.data = (typeof params.parameters === 'object') ? JSON.stringify(params.parameters) : '{}';

    this.req.call(this.url, this.data);
};

module.exports = new Service();

});

// file: lib/webos/plugin/webos/window.js
define("cordova/plugin/webos/window", function(require, exports, module) {

module.exports={
    launchParams: function() {
        return JSON.parse(PalmSystem.launchParams) || {};
    },
    /*
     * This is a thin wrapper for 'window.open()' which optionally sets document contents to 'html', and calls 'PalmSystem.stageReady()'
     * on your new card. Note that this new card will not come with your framework (if any) or anything for that matter.
     * @param {String} url
     * @param {String} html
     * Example:
     *        navigator.window.newCard('about:blank', '<html><body>Hello again!</body></html>');
     */
    newCard: function(url, html) {
        var win = window.open(url || "");
        if (html)
            win.document.write(html);
        win.PalmSystem.stageReady();
    },

    /*
     * Enable or disable full screen display (full screen removes the app menu bar and the rounded corners of the screen).
     * @param {Boolean} state
     * Example:
     *        navigator.window.setFullScreen(true);
     */
    setFullScreen: function(state) {
        // valid state values are: true or false
        PalmSystem.enableFullScreenMode(state);
    },

    /*
     * used to set the window properties of the WebOS app
     * @param {Object} props
     * Example:
     *         private method used by other member functions - ideally we shouldn't call this method
     */
    setWindowProperties: function(inWindow, inProps) {
        if(arguments.length==1) {
            inProps = inWindow;
            inWindow = window;
        }
        if(inWindow.PalmSystem) {
            inWindow.PalmSystem.setWindowProperties(inProps);
        }
    },

    /*
     * Enable or disable screen timeout. When enabled, the device screen will not dim. This is useful for navigation, clocks or other "dock" apps.
     * @param {Boolean} state
     * Example:
     *        navigator.window.blockScreenTimeout(true);
     */
    blockScreenTimeout: function(state) {
        navigator.windowProperties.blockScreenTimeout = state;
        this.setWindowProperties();
    },

    /*
     * Sets the lightbar to be a little dimmer for screen locked notifications.
     * @param {Boolean} state
     * Example:
     *        navigator.window.setSubtleLightbar(true);
     */
    setSubtleLightbar: function(state) {
        navigator.windowProperties.setSubtleLightbar = state;
        this.setWindowProperties();
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

// file: lib/scripts/bootstrap-webos.js

require('cordova/channel').onNativeReady.fire();

})();