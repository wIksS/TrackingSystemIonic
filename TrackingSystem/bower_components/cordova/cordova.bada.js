// Platform: bada
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

// file: lib/bada/exec.js
define("cordova/exec", function(require, exports, module) {

var plugins = {
    "Device": require('cordova/plugin/bada/device'),
    "NetworkStatus": require('cordova/plugin/bada/NetworkStatus'),
//    "Accelerometer": require('cordova/plugin/bada/Accelerometer'),
    "Notification": require('cordova/plugin/bada/Notification'),
    "Compass": require('cordova/plugin/bada/Compass'),
    "Capture": require('cordova/plugin/bada/Capture'),
    "Camera": require('cordova/plugin/bada/Camera'),
    "Contacts": require('cordova/plugin/bada/Contacts')
};

module.exports = function(success, fail, service, action, args) {
    try {
        plugins[service][action](success, fail, args);
    }
    catch(e) {
        console.log("missing exec: " + service + "." + action);
        console.log(args);
        console.log(e);
        console.log(e.stack);
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

// file: lib/bada/platform.js
define("cordova/platform", function(require, exports, module) {

module.exports = {
    id: "bada",
    initialize: function() {
        var modulemapper = require('cordova/modulemapper');

        modulemapper.loadMatchingModules(/cordova.*\/symbols$/);
        modulemapper.mapModules(window);
    }
};

});

// file: lib/bada/plugin/accelerometer/symbols.js
define("cordova/plugin/accelerometer/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.defaults('cordova/plugin/Acceleration', 'Acceleration');
modulemapper.clobbers('cordova/plugin/bada/Accelerometer', 'navigator.accelerometer');

});

// file: lib/bada/plugin/bada/Accelerometer.js
define("cordova/plugin/bada/Accelerometer", function(require, exports, module) {

var Acceleration = require('cordova/plugin/Acceleration');

module.exports = {
    getCurrentAcceleration: function(successCallback, errorCallback, options) {
        var success = function(acceleration) {
            console.log("Accelerometer:getAcceleration:success");
            var accel = new Acceleration(acceleration.xAxis, acceleration.yAxis, acceleration.zAxis);
            successCallback(accel);
        };
        var error = function(err) {
            console.log("Accelerometer:getAcceleration:error");
            if (err.code == err.TYPE_MISMATCH_ERR) {
                console.log("TYPE MISMATCH ERROR");
            }

            errorCallback(err);
        };
        deviceapis.accelerometer.getCurrentAcceleration(success, error);
    },
    watchAcceleration: function(successCallback, errorCallback, options) {
        var success = function(acceleration) {
            console.log("accelerometer:watchAcceleration:success");
            var accel = new Acceleration(acceleration.xAxis, acceleration.yAxis, acceleration.zAxis);
            successCallback(accel);
        };
        var error = function(err) {
            console.log("accelerometer:watchAcceleration:error");
            errorCallback(err);
        };
        return deviceapis.accelerometer.watchAcceleration(success, error);
    },
    clearWatch: function(watchID) {
        deviceapis.accelerometer.clearWatch(watchID);
    }
};

});

// file: lib/bada/plugin/bada/Camera.js
define("cordova/plugin/bada/Camera", function(require, exports, module) {

module.exports = {
    _mainCamera: null,
    _cams: [],
    takePicture: function(success, fail, cameraOptions) {
        var dataList = [];
        dataList[0] = "type:camera";

        var appcontrolobject = Osp.App.AppManager.findAppControl("osp.appcontrol.provider.camera", "osp.appcontrol.operation.capture");

        if(appcontrolobject) {
            appcontrolobject.start(dataList, function(cbtype, appControlId, operationId, resultList) {
                var i;
                if(cbtype === "onAppControlCompleted") {
                    if(resultList.length > 1 && resultList[1]) {
                        success(resultList[1]);
                    }
                } else {
                    var error = {message: "An error occurred while capturing image", code: 0};
                    fail(error);
                }
            });
        }
    },
    showPreview: function(nodeId) {
        var self = this;
        var onCreatePreviewNodeSuccess = function(previewObject) {
            var previewDiv = document.getElementById(nodeId);
            previewDiv.appendChild(previewObject);
            previewObject.style.visibility = "visible";
        };
        var error = function(e) {
            alert("An error occurred: " + e.message);
        };

        var success = function(cams) {
            if (cams.length > 0) {
             self._cams = cams;
                self._mainCamera = cams[0];
                self._mainCamera.createPreviewNode(onCreatePreviewNodeSuccess, error);
                return;
            }
            alert("Sorry, no cameras available.");
        };
        if(nodeId) {
            deviceapis.camera.getCameras(success, error);
        } else {
            console.log("camera::getPreview: must provide a nodeId");
        }
    },
    hidePreview: function(nodeId) {
        var preview = document.getElementById(nodeId);
        if(preview.childNodes[0]) {
            preview.removeChild(preview.childNodes[0]);
        }
    }

};


});

// file: lib/bada/plugin/bada/Capture.js
define("cordova/plugin/bada/Capture", function(require, exports, module) {

module.exports = {
    startVideoCapture: function(success, fail, options) {
        var camera = navigator.camera._mainCamera;
        camera.startVideoCapture(success, fail, options);
    },
    stopVideoCapture: function() {
        navigator.camera._mainCamera.stopVideoCapture();
    },
    captureImage2: function(success, fail, options) {
        try {
            navigator.camera._mainCamera.captureImage(success, fail, options);
        } catch(exp) {
            alert("Exception :[" + exp.code + "] " + exp.message);
        }
    },
    captureAudio: function() {
        console.log("navigator.capture.captureAudio unsupported!");
    },
    captureImage: function(success, fail, options) {
        var dataList = [];
        dataList[0] = "type:camera";

        var appcontrolobject = Osp.App.AppManager.findAppControl("osp.appcontrol.provider.camera", "osp.appcontrol.operation.capture");

        if(appcontrolobject) {
            appcontrolobject.start(dataList, function(cbtype, appControlId, operationId, resultList) {
                var i;
                var pluginResult = [];
                if(cbtype === "onAppControlCompleted") {
                    for(i = 1 ; i < resultList.length ; i += 1) {
                       if(resultList[i]) {
                           //console.log("resultList[" + i + "] = " + resultList[i]);
                           pluginResult.push( {fullPath: resultList[i]} );
                       }
                    }
                    success(pluginResult);
                } else {
                    var error = {message: "An error occurred while capturing image", code: 0};
                    fail(error);
                }
            });
        }
    },
    captureVideo: function(success, fail, options) {
        var dataList = [];
        dataList[0] = "type:camcorder";

        var appcontrolobject = Osp.App.AppManager.findAppControl("osp.appcontrol.provider.camera", "osp.appcontrol.operation.record");

        if(appcontrolobject) {
            appcontrolobject.start(dataList, function(cbtype, appControlId, operationId, resultList) {
                var i;
                var mediaFiles = [];
                if(cbtype === "onAppControlCompleted") {
                    for(i = 1 ; i < resultList.length ; i += 1) {
                       if(resultList[i]) {
                           //console.log("resultList[" + i + "] = " + resultList[i]);
                           mediaFiles.push( {fullPath: resultList[i]} );
                       }
                    }
                    success(mediaFiles);
                } else {
                    var error = {message: "An error occurred while capturing image", code: 0};
                    fail(error);
                }
            });
        }

    }
};

});

// file: lib/bada/plugin/bada/Compass.js
define("cordova/plugin/bada/Compass", function(require, exports, module) {

var CompassHeading = require('cordova/plugin/CompassHeading');

module.exports = {
        getHeading: function(compassSuccess, compassError, compassOptions) {
            if(deviceapis.orientation === undefined) {
                console.log("navigator.compass.getHeading", "Operation not supported!");
                return -1;
            }
            var success = function(orientation) {
                var heading = 360 - orientation.alpha;
                var compassHeading = new CompassHeading(heading, heading, 0);
                compassSuccess(compassHeading);
            };
            var error = function(error) {
                compassError(error);
            };
            deviceapis.orientation.getCurrentOrientation(success, error);
        }
};

});

// file: lib/bada/plugin/bada/Contacts.js
define("cordova/plugin/bada/Contacts", function(require, exports, module) {

var allowedAddressTypes = ["WORK", "HOME", "PREF"];

var allowedPhoneNumberTypes = ["WORK", "PREF", "HOME", "VOICE", "FAX", "MSG", "CELL", "PAGER","BBS", "MODEM", "CAR", "ISDN","VIDEO", "PCS"];

var allowedFilters = ["firstName", "lastName", "phoneticName", "nickname", "phoneNumber", "email", "address"];

function _pgToWac(contact) {
    var i, j;
    var wacContact = {};

    if(contact.id) {
        wacContact.id = contact.id;
    }

    // name
    if(contact.name) {
       wacContact.firstName = contact.name.givenName;
       wacContact.lastName = contact.name.familyName;
    }

    // nickname
    if(contact.nickname) {
        wacContact.nicknames = [contact.nickname];
    }

    // phoneNumbers
    if(contact.phoneNumbers && contact.phoneNumbers.length > 0) {
        wacContact.phoneNumbers = {};
        for(i = 0, j = contact.phoneNumbers.length ; i < j ; i += 1) {
            var wacPhoneNumber = {};
            wacPhoneNumber.number = contact.phoneNumbers[i].value;
            if(allowedPhoneNumberTypes.indexOf(contact.phoneNumbers[i].type) != -1) {
                wacPhoneNumber.types = [contact.phoneNumbers[i].type];
                if(contact.phoneNumbers[i].pref === true) {
                    wacPhoneNumber.types.push('PREF');
                }
                wacContact.phoneNumbers.push(wacPhoneNumber);
            }
        }
    }

    // emails
    if(contact.emails &&  contact.emails.length > 0) {
        wacContact.emails = [];
        for(i = 0, j = contact.emails.length ; i < j ; i +=1) {
            var wacEmailAddress = {};
            wacEmailAddress.email = contact.emails[i].value;
            if(allowedAddressTypes.indexOf(contact.emails[i].type) != -1) {
                wacEmailAddress.types = [contact.emails[i].type];
                if(contact.emails[i].pref === true) {
                    wacEmailAddress.types.push('PREF');
                }
                wacContact.emails.push(wacEmailAddress);
            }
        }
    }
    // addresses
    if(contact.addresses && contact.addresses.length > 0) {
        wacContact.addresses = [];
        for(i = 0, j = contact.emails.length ; i < j ; i +=1) {
            var wacAddress = {};
            wacAddress.country = contact.addresses[i].country;
            wacAddress.postalCode = contact.addresses[i].postalCode;
            wacAddress.region = contact.addresses[i].region;
            wacAddress.city = contact.addresses[i].locality;
            wacAddress.streetAddress = contact.addresses[i].streetAddress;
            if(allowedAddressTypes.indexOf(contact.addresses[i].type) != -1) {
                wacAddress.types = [contact.addresses[i].type];
                if(contact.addresses[i].pref === true) {
                    wacAddress.types.push('PREF');
                }
            }
            wacContact.addresses.push(wacAddress);
        }

    }

    // photos
    // can only store one photo URL
    if(contact.photos && contact.photos.length > 0) {
       wacContact.photoURL = contact.photos[0].value;
    }

    return wacContact;

}

function _wacToPg(contact) {
    var i, j;
    var pgContact = {};

    if(contact.id) {
        pgContact.id = contact.id;
    }

    // name
    if(contact.firstName || contact.lastName) {
        pgContact.name = {};
        pgContact.name.givenName = contact.firstName;
        pgContact.name.familyName = contact.lastName;
        pgContact.displayName = contact.firstName + ' ' + contact.lastName;
    }

    // nicknames
    if(contact.nicknames && contact.nicknames.length > 0) {
        pgContact.nickname = contact.nicknames[0];
    }

    // phoneNumbers
    if(contact.phoneNumbers && contact.phoneNumbers.length > 0) {
        pgContact.phoneNumbers = [];
        for(i = 0, j = contact.phoneNumbers.length ; i < j ; i += 1) {
            var pgPhoneNumber = {};
            pgPhoneNumber.value = contact.phoneNumbers[i].number;
            if(contact.phoneNumbers[i].types &&
               contact.phoneNumbers[i].types.length > 0) {
                pgPhoneNumber.type = contact.phoneNumbers[i].types[0];
                if(contact.phoneNumbers[i].types.indexOf('PREF') != -1) {
                    pgPhoneNumber.pref = true;
                }
            }
            pgContact.phoneNumbers.push(pgPhoneNumber);
        }
    }

    // emails
    if(contact.emails && contact.emails.length > 0) {
        pgContact.emails = [];
        for(i = 0, j = contact.emails.length ; i < j ; i += 1) {
            var pgEmailAddress = {};
            pgEmailAddress.value = contact.emails[i].email;
            if(contact.emails[i].types &&
               contact.emails[i].types.length > 0) {
                pgEmailAddress.type = contact.emails[i].types[0];
                if(contact.emails[i].types.indexOf('PREF') != -1) {
                    pgEmailAddress.pref = true;
                }
            }
            pgContact.emails.push(pgEmailAddress);
        }
    }

    // addresses
    if(contact.addresses && contact.addresses.length > 0) {
        pgContact.addresses = [];
        for(i = 0, j = contact.addresses.length ; i < j ; i += 1) {
            var pgAddress = {};
            pgAddress.country = contact.addresses[i].country;
            pgAddress.postalCode = contact.addresses[i].postalCode;
            pgAddress.region = contact.addresses[i].region;
            pgAddress.locality = contact.addresses[i].city;
            pgAddress.streetAddress = contact.addresses[i].streetAddress;
            if(contact.addresses[i].types &&
               contact.addresses[i].types.length > 0) {
                pgAddress.type = contact.addresses[i].types[0];
                if(contact.addresses[i].types.indexOf('PREF') != -1) {
                    pgAddress.pref = true;
                }
            }
            pgContact.addresses.push(pgAddress);
        }
    }

    // photos
    // can only store one photo URL
    if(contact.photoURL) {
       pgContact.photos = [{value: contact.photoURL, type: "DEFAULT"}];
    }

    return pgContact;
}

function _buildWacFilters(fields, options) {
    var i, j;
    var wacFilters = {};
    for(i = 0, j = fields.length ; i < j ; i += 1) {
        if(allowedFilters.indexOf(fields[i]) != -1) {
           wacFilters[fields[i]] = options.filter;
        }
    }
}

module.exports = {
    save: function(success, fail, params) {
        var pContact = params[0];
        var gotBooks = function(books) {
            var book = books[0];
            var i, j;
            var saveSuccess = function(wContact) {
                success(_wacToPg(wContact));
            };
            var saveError = function(e) {
                fail(e);
            };
            if(pContact.id) {
                book.updateContact(saveSuccess, saveError, _pgToWac(pContact));
            } else {
                var wContact = book.createContact(_pgToWac(pContact));
                book.addContact(saveSuccess, saveError, wContact);
            }
        };
        var gotError = function(e) {
            fail(e);
        };
        deviceapis.pim.contact.getAddressBooks(gotBooks, gotError);
    },
    remove: function(success, fail, params) {
        var id = params[0];
        var gotBooks = function(books) {
            var book = books[0];
            var removeSuccess = function() {
                success();
            };
            var removeError = function(e) {
                fail(e);
            };
            var toDelete = function(contacts) {
                if(contacts.length === 1) {
                    book.deleteContact(removeSuccess, removeError, contacts[0].id);
                }
            };
            if(id) {
                book.findContacts(toDelete, removeError, {id: id});
            }
        };
        var gotError = function(e) {
            fail(e);
        };
        deviceapis.pim.contact.getAddressBooks(gotBooks, gotError);
    },
    search: function(success, fail, params) {
        var fields = params[0];
        var options = params[1];
        var wacFilters = _buildWacFilters(fields, options);
        var gotBooks = function(books) {
            var book = books[0];
            var gotContacts = function(contacts) {
                var i, j;
                var pgContacts = [];
                for(i = 0, j = contacts.length ; i < j ; i += 1) {
                    pgContacts.push(_wacToPg(contacts[i]));
                }
                success(pgContacts);
            };
            var gotError = function(e) {
                fail(e);
            };
            book.findContacts(gotContacts, gotError, wacFilters);
        };
        var gotError = function(e) {
            fail(e);
        };
        deviceapis.pim.contact.getAddressBooks(gotBooks, gotError);
    }
};

});

// file: lib/bada/plugin/bada/NetworkStatus.js
define("cordova/plugin/bada/NetworkStatus", function(require, exports, module) {

var channel = require('cordova/channel'),
    Connection = require("cordova/plugin/Connection");

// We can't tell if a cell connection is 2, 3 or 4G.
// We just know if it's connected and the signal strength
// if it's roaming and the network name etc..so unless WiFi we default to CELL_2G
// if connected to cellular network

module.exports = {
    getConnectionInfo: function(success, fail) {
        var connectionType = Connection.NONE;
        var networkInfo = ["cellular", "wifi"]; // might be a better way to do this
        var gotConnectionInfo = function() {
            networkInfo.pop();
            if(networkInfo.length === 0) {
                channel.onCordovaConnectionReady.fire();
                success(connectionType);
            }
        };
        var error = function(e) {
            console.log("Error "+e.message);
            gotConnectionInfo();
        };
        deviceapis.devicestatus.getPropertyValue(function(value) {
            console.log("Device Cellular network status: "+value);
            if(connectionType === Connection.NONE) {
                connectionType = Connection.CELL_2G;
            }
            gotConnectionInfo();
        }, error, {aspect: "CellularNetwork", property: "signalStrength"});

        deviceapis.devicestatus.getPropertyValue(function(value) {
            console.log("Device WiFi network status: "+value);
            if(value == "connected") {
                connectionType = Connection.WIFI;
            }
            gotConnectionInfo();
        }, error, {aspect: "WiFiNetwork", property: "networkStatus"});
    }
};

});

// file: lib/bada/plugin/bada/Notification.js
define("cordova/plugin/bada/Notification", function(require, exports, module) {

module.exports = {
    alert: function(message, alertCallback, title, buttonName) {
        alert(message);
    },
    confirm: function(message, confirmCallback, title, buttonLabels) {
        alert(message);
    },
    beep: function(times, milliseconds) {
        try {
            deviceapis.deviceinteraction.stopNotify();
            if(times === 0) {
                return;
            }
            deviceapis.deviceinteraction.startNotify(function() {
                console.log("Notifying");
            },
            function(e) {
                console.log("Failed to notify: " + e);
            },
            milliseconds);
            Osp.Core.Function.delay(this.beep, 1000+milliseconds, this, times - 1, milliseconds);
        }
        catch(e) {
            console.log("Exception thrown: " + e);
        }
    },
    vibrate: function(milliseconds) {
        try {
            deviceapis.deviceinteraction.startVibrate(function() {
                console.log("Vibrating...");
            },
            function(e) {
                console.log("Failed to vibrate: " + e);
            },
            milliseconds);
        }
        catch(e) {
            console.log("Exception thrown: " + e);
        }
        },
    lightOn: function(milliseconds) {
        deviceapis.deviceinteraction.lightOn(function() {
            console.log("Lighting for "+milliseconds+" second");
        },
        function() {
            console.log("Failed to light");
        },
        milliseconds);
    }
};

});

// file: lib/bada/plugin/bada/device.js
define("cordova/plugin/bada/device", function(require, exports, module) {

var channel = require('cordova/channel'),
    utils = require('cordova/utils');

function Device() {
    this.platform = null;
    this.version = null;
    this.name = null;
    this.uuid = null;
    this.cordova = null;

    var me = this;

    channel.onCordovaReady.subscribe(function() {
       me.getDeviceInfo(function (device) {
           me.platform = device.platform;
           me.version  = device.version;
           me.name     = device.name;
           me.uuid     = device.uuid;
           me.cordova  = device.cordova;

           channel.onCordovaInfoReady.fire();
       },
       function (e) {
           me.available = false;
           utils.alert("error initializing cordova: " + e);
       });
    });
}


Device.prototype.getDeviceInfo = function(success, fail, args) {
   var info = deviceapis.devicestatus;
   var properties = ["name", "uuid", "os_name", "os_vendor", "os_version"];

   var me = this;

   var name = null,
       platform = null,
       uuid = null,
       os_name = null,
       os_version = null,
       os_vendor = null;

   var checkProperties = function() {
       properties.pop();
       if(properties.length === 0) {
           me.name = name;
           me.platform = os_vendor + " " + os_name;
           me.version = os_version;
           me.uuid = uuid;
           me.cordova = CORDOVA_JS_BUILD_LABEL;
           success(me);
       }
   };

   info.getPropertyValue(function(value) {
           //console.log("Device IMEI: "+value);
           uuid = value;
           checkProperties();
           }, fail, {aspect: "Device", property: "imei"});
   info.getPropertyValue(function(value) {
           //console.log("Device name: "+value);
           name = value;
           checkProperties();
           }, fail, {aspect: "Device", property: "version"});
   info.getPropertyValue(function(value) {
           //console.log("OperatingSystem name: "+value);
           os_name = value;
           checkProperties();
           }, fail, {aspect: "OperatingSystem", property: "name"});
   info.getPropertyValue(function(value) {
           //console.log("OperatingSystem version: "+value);
           os_version = value;
           checkProperties();
           }, fail, {aspect: "OperatingSystem", property: "version"});
   info.getPropertyValue(function(value) {
           //console.log("OperatingSystem vendor: "+value);
           os_vendor = value;
           checkProperties();
           }, fail, {aspect: "OperatingSystem", property: "vendor"});
};

module.exports = new Device();

});

// file: lib/bada/plugin/camera/symbols.js
define("cordova/plugin/camera/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.defaults('cordova/plugin/bada/Camera', 'navigator.camera');
modulemapper.defaults('cordova/plugin/CameraConstants', 'Camera');
modulemapper.defaults('cordova/plugin/CameraPopoverOptions', 'CameraPopoverOptions');

});

// file: lib/bada/plugin/capture/symbols.js
define("cordova/plugin/capture/symbols", function(require, exports, module) {

var modulemapper = require('cordova/modulemapper');

modulemapper.clobbers('cordova/plugin/CaptureError', 'CaptureError');
modulemapper.clobbers('cordova/plugin/CaptureAudioOptions', 'CaptureAudioOptions');
modulemapper.clobbers('cordova/plugin/CaptureImageOptions', 'CaptureImageOptions');
modulemapper.clobbers('cordova/plugin/CaptureVideoOptions', 'CaptureVideoOptions');
modulemapper.clobbers('cordova/plugin/MediaFile', 'MediaFile');
modulemapper.clobbers('cordova/plugin/MediaFileData', 'MediaFileData');
modulemapper.clobbers('cordova/plugin/capture', 'navigator.device.capture');

modulemapper.merges('cordova/plugin/bada/Capture', 'navigator.capture');

});

// file: lib/bada/plugin/device/symbols.js
define("cordova/plugin/device/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.clobbers('cordova/plugin/bada/device', 'device');
modulemapper.merges('cordova/plugin/bada/device', 'navigator.device');

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

// file: lib/bada/plugin/notification/symbols.js
define("cordova/plugin/notification/symbols", function(require, exports, module) {


var modulemapper = require('cordova/modulemapper');

modulemapper.clobbers('cordova/plugin/bada/Notification', 'navigator.notification');

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

// file: lib/scripts/bootstrap-bada.js

require('cordova/channel').onNativeReady.fire();

})();