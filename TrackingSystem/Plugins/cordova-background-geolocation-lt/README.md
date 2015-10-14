[Premium Version (iOS)](http://shop.transistorsoft.com/pages/cordova-background-geolocation-premium)
==========================

This repo hosts the **iOS** platform available in the **[Premium Version](http://shop.transistorsoft.com/pages/cordova-background-geolocation-premium)**.  **Android** functionality is available only in the **[Premium Version](http://shop.transistorsoft.com/pages/cordova-background-geolocation-premium)**.

Background Geolocation
==============================

Cross-platform background geolocation module for Cordova with battery-saving **"circular stationary-region monitoring"** and **"stop detection"**.

![Home](https://www.dropbox.com/s/4cggjacj68cnvpj/screenshot-iphone5-geofences-framed.png?dl=1)
![Settings](https://www.dropbox.com/s/mmbwgtmipdqcfff/screenshot-iphone5-settings-framed.png?dl=1)

Follows the [Cordova Plugin spec](http://cordova.apache.org/docs/en/3.0.0/plugin_ref_spec.md), so that it works with [Plugman](https://github.com/apache/cordova-plugman).

This plugin leverages Cordova/PhoneGap's [require/define functionality used for plugins](http://simonmacdonald.blogspot.ca/2012/08/so-you-wanna-write-phonegap-200-android.html).

## Installing the plugin ##

```
cordova plugin add https://github.com/transistorsoft/cordova-background-geolocation-lt.git
```

## Using the plugin ##
The plugin creates the object `window.BackgroundGeolocation`

## [Advanced Sample Application](https://github.com/christocracy/cordova-background-geolocation-SampleApp)

A fully-featured [SampleApp](https://github.com/christocracy/cordova-background-geolocation-SampleApp) is available in its own public repo.  After first cloning that repo, follow the installation instructions in the **README** there.  This SampleApp includes a settings-screen allowing you to quickly experiment with all the different settings available for each platform.

If you're using XCode, boot the SampleApp in the iOS Simulator and enable ```Debug->Location->Freeway Drive```.

![](https://dl.dropboxusercontent.com/u/2319755/cordova-background-geolocaiton/simulate-location.png)

## Simple Testing Server

A simple Node-based [web-application](https://github.com/transistorsoft/background-geolocation-console) with SQLite database is available for field-testing and performance analysis.  If you're familiar with Node, you can have this server up-and-running in about **one minute**.

![](https://dl.dropboxusercontent.com/u/2319755/cordova-background-geolocaiton/background-geolocation-console-map.png)

![](https://dl.dropboxusercontent.com/u/2319755/cordova-background-geolocaiton/background-geolocation-console-grid.png)

## [Common Options](https://github.com/transistorsoft/react-native-background-geolocation#config)

| Option | Type | Opt/Required | Default | Note |
|---|---|---|---|---|
| `desiredAccuracy` | `Integer` | Required | 0 | Specify the desired-accuracy of the geolocation system with 1 of 4 values, `0`, `10`, `100`, `1000` where `0` means **HIGHEST POWER, HIGHEST ACCURACY** and `1000` means **LOWEST POWER, LOWEST ACCURACY** |
| `distanceFilter` | `Integer` | Required | `30`| The minimum distance (measured in meters) a device must move horizontally before an update event is generated. @see Apple docs. However, #distanceFilter is elastically auto-calculated by the plugin: When speed increases, #distanceFilter increases; when speed decreases, so does distanceFilter (disabled with `disableElasticity: true`) |
| `activityRecognitionInterval` | `Integer` | Required | `10000` | The desired time between activity detections. Larger values will result in fewer activity detections while improving battery life. A value of 0 will result in activity detections at the fastest possible rate. |
| `stopDetectionDelay` | `Integer` | Optional | 0 | Allows the stop-detection system to be delayed from activating.  When the stop-detection system is engaged, the GPS is off and only the accelerometer is monitored.  Stop-detection will only engage if this timer expires.  The timer is cancelled if any movement is detected before expiration | 
| `stopTimeout` | `Integer` | Required | `5 minutes` | The number of miutes to wait before turning off the GPS after the ActivityRecognition System (ARS) detects the device is `STILL` (**Android:** defaults to 0, no timeout, **iOS:** defaults to 5min).  If you don't set a value, the plugin is eager to turn off the GPS ASAP.  An example use-case for this configuration is to delay GPS OFF while in a car waiting at a traffic light. |
| `stopOnTerminate` | `Boolean` | Optional | `true` | Enable this in order to force a stop() when the application terminated (e.g. on iOS, double-tap home button, swipe away the app). On Android, stopOnTerminate: false will cause the plugin to operate as a headless background-service (in this case, you should configure an #url in order for the background-service to send the location to your server) |
| `stopAfterElapsedMinutes` | `Integer`  |  Optional | `0`  | The plugin can optionally auto-stop monitoring location when some number of minutes elapse after being the #start method was called. |
| `debug` | `Boolean` | Optional | `false` | When enabled, the plugin will emit sounds for life-cycle events of background-geolocation!  **NOTE iOS**:  In addition, you must manually enable the *Audio and Airplay* background mode in *Background Capabilities* to hear these debugging sounds. |
| `url` | `String` | Optional | - | Your server url where you wish to HTTP POST recorded locations to |
| `params` | `Object` | Optional | `{}` | Optional HTTP params sent along in HTTP request to above `#url` |
| `headers` | `Object` | Optional | `{}` | Optional HTTP headers sent along in HTTP request to above `#url` |
| `autoSync` | `Boolean` | Optional | `true` | If you've enabeld HTTP feature by configuring an `#url`, the plugin will attempt to HTTP POST each location to your server **as it is recorded**.  If you set `autoSync: false`, it's up to you to **manually** execute the `#sync` method to initate the HTTP POST (**NOTE** The plugin will continue to persist **every** recorded location in the SQLite database until you execute `#sync`). |
| `batchSync` | `Boolean` | Optional | `false` | Default is `false`.  If you've enabled HTTP feature by configuring an `#url`, `batchSync: true` will POST all the locations currently stored in native SQLite datbase to your server in a single HTTP POST request.  With `batchSync: false`, an HTTP POST request will be initiated for **each** location in database. |
| `maxDaysToPersist` | `Integer` | Optional | `1` |  Maximum number of days to store a geolocation in plugin's SQLite database when your server fails to respond with `HTTP 200 OK`.  The plugin will continue attempting to sync with your server until `maxDaysToPersist` when it will give up and remove the location from the database. |

## [iOS Options](#ios-config)

| Option | Type | Opt/Required | Default | Note |
|---|---|---|---|---|
| `stationaryRadius` | `Integer`  |  Required | `20`  | When stopped, the minimum distance the device must move beyond the stationary location for aggressive background-tracking to engage. Note, since the plugin uses iOS significant-changes API, the plugin cannot detect the exact moment the device moves out of the stationary-radius. In normal conditions, it can take as much as 3 city-blocks to 1/2 km before staionary-region exit is detected. |
| `disableElasticity` | `bool`  |  Optional | `false`  | Set true to disable automatic speed-based `#distanceFilter` elasticity. eg: When device is moving at highway speeds, locations are returned at ~ 1 / km. |
| `activityType` | `String` | Required | `Other` | Presumably, this affects ios GPS algorithm.  See [Apple docs](https://developer.apple.com/library/ios/documentation/CoreLocation/Reference/CLLocationManager_Class/CLLocationManager/CLLocationManager.html#//apple_ref/occ/instp/CLLocationManager/activityType) for more information | Set the desired interval for active location updates, in milliseconds. |
| `useSignificantChangesOnly` | `Boolean` | Optional | `false` | Defaults to `false`.  Set `true` in order to disable constant background-tracking and use only the iOS [Significant Changes API](https://developer.apple.com/library/ios/documentation/CoreLocation/Reference/CLLocationManager_Class/index.html#//apple_ref/occ/instm/CLLocationManager/startMonitoringSignificantLocationChanges).  If Apple has denied your application due to background-tracking, this can be a solution.  **NOTE** The Significant Changes API will report a location only when a significant change from the last location has occurred.  Many of the configuration parameters **will be ignored**, such as `#distanceFilter`, `#stationaryRadius`, `#activityType`, etc. |

## Events

| Event Name | Returns | Notes
|---|---|---|
| `onMotionChange` | `{location}, `taskId` | Fired when the device changes stationary / moving state. |
| `onGeofence` | `{geofence}`, `taskId` | Fired when a geofence crossing event occurs |

## [Methods](#methods-1)

| Method Name | Arguments | Notes
|---|---|---|
| `configure` | `{config}` | Configures the plugin's parameters (@see following Config section for accepted config params. The locationCallback will be executed each time a new Geolocation is recorded and provided with the following parameters |
| `setConfig` | `{config}` | Re-configure the plugin with new values |
| `start` | `callbackFn`| Enable location tracking.  Supplied `callbackFn` will be executed when tracking is successfully engaged |
| `stop` | `callbackFn` | Disable location tracking.  Supplied `callbackFn` will be executed when tracking is successfully engaged |
| `getState` | `callbackFn` | Fetch the current-state of the plugin, including `enabled`, `isMoving`, as well as all other config params |
| `getCurrentPosition` | `callbackFn` | Retrieves the current position. This method instructs the native code to fetch exactly one location using maximum power & accuracy. |
| `changePace` | `isMoving` | Initiate or cancel immediate background tracking. When set to true, the plugin will begin aggressively tracking the devices Geolocation, bypassing stationary monitoring. If you were making a "Jogging" application, this would be your [Start Workout] button to immediately begin GPS tracking. Send false to disable aggressive GPS monitoring and return to stationary-monitoring mode. |
| `getLocations` | `callbackFn` | Fetch all the locations currently stored in native plugin's SQLite database. Your callbackFn`` will receive an `Array` of locations in the 1st parameter |
| `sync` | - | If the plugin is configured for HTTP with an `#url` and `#autoSync: false`, this method will initiate POSTing the locations currently stored in the native SQLite database to your configured `#url`|
| `getOdometer` | `callbackFn` | The plugin constantly tracks distance travelled. The supplied callback will be executed and provided with a `distance` as the 1st parameter.|
| `resetOdometer` | `callbackFn` | Reset the **odometer** to `0`.  The plugin never automatically resets the odometer -- this is **up to you** |
| `playSound` | `soundId` | Here's a fun one.  The plugin can play a number of OS system sounds for each platform.  For [IOS](http://iphonedevwiki.net/index.php/AudioServices) and [Android](http://developer.android.com/reference/android/media/ToneGenerator.html).  I offer this API as-is, it's up to you to figure out how this works. |
| `addGeofence` | `{config}` | Adds a geofence to be monitored by the native plugin. Monitoring of a geofence is halted after a crossing occurs.|
| `removeGeofence` | `identifier` | Removes a geofence identified by the provided `identifier` |
| `getGeofences` | `callbackFn` | Fetch the list of monitored geofences. Your callbackFn will be provided with an Array of geofences. If there are no geofences being monitored, you'll receive an empty `Array []`.|
  
## Help

[See the Wiki](https://github.com/transistorsoft/cordova-background-geolocation-lt/wiki)

## Example

```

////
// As with all Cordova plugins, you must configure within an #deviceready callback.
//
function onDeviceReady() {
    // Get a reference to the plugin.
    var bgGeo = window.BackgroundGeolocation;
    
    /**
    * This callback will be executed every time a geolocation is recorded in the background.
    */
    var callbackFn = function(location, taskId) {
        var coords = location.coords;
        var lat    = coords.latitude;
        var lng    = coords.longitude;
        
        console.log('[js] BackgroundGeoLocation callback:  ' + JSON.stringify(location));

        /**
        * This would be your own callback for Ajax-requests after POSTing background geolocation to your server.
        * eg:  
        *     $.post({url: url, success: yourAjaxCallback});
        */
        var yourAjaxCallback = function(response) {
            ////
            // IMPORTANT:  You must execute the #finish, providing the taskId provided to callbackFn above in order to inform the native plugin that you're finished,
            //  and the background-task may be completed.  You must do this regardless if your HTTP request is successful or not.
            // IF YOU DON'T, ios will CRASH YOUR APP for spending too much time in the background.
            //
            //
            bgGeo.finish(taskId);
        };

        yourAjaxCallback.call(this);
    };

    var failureFn = function(error) {
        console.log('BackgroundGeoLocation error');
    }

    // BackgroundGeoLocation is highly configurable.
    bgGeo.configure(callbackFn, failureFn, {
        // Geolocation config
        desiredAccuracy: 0,
        stationaryRadius: 50,
        distanceFilter: 50,
        disableElasticity: false, // <-- [iOS] Default is 'false'.  Set true to disable speed-based distanceFilter elasticity
        locationUpdateInterval: 5000,
        minimumActivityRecognitionConfidence: 80,   // 0-100%.  Minimum activity-confidence for a state-change 
        fastestLocationUpdateInterval: 5000,
        activityRecognitionInterval: 10000,
        stopDetectionDelay: 1,  // Wait x minutes to engage stop-detection system
        stopTimeout: 2,  // Wait x miutes to turn off location system after stop-detection
        activityType: 'AutomotiveNavigation',

        // Application config
        debug: true, // <-- enable this hear sounds for background-geolocation life-cycle.
        forceReloadOnLocationChange: false,  // <-- [Android] If the user closes the app **while location-tracking is started** , reboot app when a new location is recorded (WARNING: possibly distruptive to user) 
        forceReloadOnMotionChange: false,    // <-- [Android] If the user closes the app **while location-tracking is started** , reboot app when device changes stationary-state (stationary->moving or vice-versa) --WARNING: possibly distruptive to user) 
        forceReloadOnGeofence: false,        // <-- [Android] If the user closes the app **while location-tracking is started** , reboot app when a geofence crossing occurs --WARNING: possibly distruptive to user) 
        stopOnTerminate: false,              // <-- [Android] Allow the background-service to run headless when user closes the app.
        startOnBoot: true,                   // <-- [Android] Auto start background-service in headless mode when device is powered-up.
        
        // HTTP / SQLite config
        url: 'http://posttestserver.com/post.php?dir=cordova-background-geolocation',
        method: 'POST',
        batchSync: true,       // <-- [Default: false] Set true to sync locations to server in a single HTTP request.
        autoSync: true,         // <-- [Default: true] Set true to sync each location to server as it arrives.
        maxDaysToPersist: 1,    // <-- Maximum days to persist a location in plugin's SQLite database when HTTP fails
        headers: {
            "X-FOO": "bar"
        },
        params: {
            "auth_token": "maybe_your_server_authenticates_via_token_YES?"
        }
    });

    // Turn ON the background-geolocation system.  The user will be tracked whenever they suspend the app.
    bgGeo.start();

    // If you wish to turn OFF background-tracking, call the #stop method.
    // bgGeo.stop()
}


```

## Help!  It doesn't work!

Yes it does.  [See the Wiki](https://github.com/transistorsoft/cordova-background-geolocation-lt/wiki)

- on iOS, background tracking won't be engaged until you travel about **2-3 city blocks**, so go for a walk or car-ride (or use the Simulator with ```Debug->Location->City Drive```)
- Android is much quicker detecting movements; typically several meters of walking will do it.
- When in doubt, **nuke everything**:  First delete the app from your device (or simulator)

```
$ cordova plugin remove com.transistorsoft.cordova.background-geolocation
$ cordova plugin add git@github.com:transistorsoft/cordova-background-geolocation.git

$ cordova platform remove ios
$ cordova platform add ios
$ cordova build ios

```

## Behaviour

The plugin has features allowing you to control the behaviour of background-tracking, striking a balance between accuracy and battery-usage.  In stationary-mode, the plugin attempts to descrease its power usage and accuracy by setting up a circular stationary-region of configurable #stationaryRadius.  

iOS has a nice system  [Significant Changes API](https://developer.apple.com/library/ios/documentation/CoreLocation/Reference/CLLocationManager_Class/CLLocationManager/CLLocationManager.html#//apple_ref/occ/instm/CLLocationManager/startMonitoringSignificantLocationChanges), which allows the os to suspend your app until a cell-tower change is detected (typically 2-3 city-block change) 

Android automatically detects when the device is moving so has no need for a stationary-geofence.

The plugin will execute your configured ```callback``` provided to the ```#configure(callback, config)``` method.  Both iOS & Android use a SQLite database to persist **every** recorded geolocation so you don't have to worry about persistence when no network is detected.  The plugin provides a Javascript API to fetch and destroy the records in the database.  In addition, the plugin has an optional HTTP layer allowing allowing you to automatically HTTP POST recorded geolocations to your server.

The function ```changePace(isMoving, success, failure)``` is provided to force the plugin to enter "moving" or "stationary" state.

## iOS

The plugin uses iOS Significant Changes API, and starts triggering your configured ```callback``` only when a cell-tower switch is detected (i.e. the device exits stationary radius). 

When the plugin detects the device has moved beyond its configured #stationaryRadius, it engages the native platform's geolocation system for aggressive monitoring according to the configured `#desiredAccuracy`, `#distanceFilter`.  The plugin attempts to intelligently scale `#distanceFilter` based upon the current reported speed.  Each time `#distanceFilter` is determined to have changed by 5m/s, it recalculates it by squaring the speed rounded-to-nearest-five and adding #distanceFilter (I arbitrarily came up with that formula.  Better ideas?).

  `(round(speed, 5))^2 + distanceFilter`

### Android

Using the ActivityRecognition API, when the plugin sees a `DetectedActivity` of `STILL`, location-updates will be halted -- when it sees ```IN_VEHICLE, ON_BICYCLE, ON_FOOT, RUNNING, WALKING```, location-updates will be initiated.

## Methods

####`configure(locationCallback, failureCallback, config)`

Configures the plugin's parameters (@see following [Config](#config) section for accepted `config` params.  The `locationCallback` will be executed each time a new Geolocation is recorded and provided with the following parameters:

######@param {Object} location The Location data
######@param {Integer} taskId The taskId used to send to bgGeo.finish(taskId) in order to signal completion of your callbackFn

```
bgGeo.configure(function(location, taskId) {
    try {
        var coords      = location.coords,
            timestamp   = location.timestamp
            latitude    = coords.latitude,
            longitude   = coords.longitude,
            speed       = coords.speed;

        console.log("A location has arrived:", timestamp, latitude, longitude, speed);
    } catch(e) {
        console.error("An error occurred in my application code", e);
    }
    // The plugin runs your callback in a background-thread:  
    // you MUST signal to the native plugin when your callback is finished so it can halt the thread.
    // IF YOU DON'T, iOS WILL KILL YOUR APP
    bgGeo.finish(taskId);
}, failureFn, {
    distanceFilter: 50,
    desiredAccuracy: 0,
    stationaryRadius: 25
});
```

####`setConfig(successFn, failureFn, config)`
Reconfigure plugin's configuration (@see followign ##Config## section for accepted ```config``` params.  **NOTE** The plugin will continue to send recorded Geolocation to the ```locationCallback``` you provided to ```configure``` method -- use this method only to change configuration params (eg: ```distanceFilter```, ```stationaryRadius```, etc).

```
bgGeo.setConfig(function(){}, function(){}, {
    desiredAccuracy: 10,
    distanceFilter: 100
});
```

####`start(successFn, failureFn)`

Enable background geolocation tracking.

```
bgGeo.start()
```

####`stop(successFn, failureFn)`

Disable background geolocation tracking.

```
bgGeo.stop();
```

####`getState(successFn)`

Fetch the current-state of the plugin, including all configuration parameters.

```
bgGeo.getState(function(state) {
  console.log(JSON.stringify(state));
});

{
  "stopOnTerminate": true,
  "disableMotionActivityUpdates": false,
  "params": {
    "device": {
      "manufacturer": "Apple",
       "available": true,
       "platform": "iOS",
       "cordova": "3.9.1",
       "uuid": "61CA53C7-BC4B-44D3-991B-E9021AE7F8EE",
       "model": "iPhone8,1",
       "version": "9.0.2"
    }
  },
  "url": "http://192.168.11.120:8080/locations",
  "desiredAccuracy": 0,
  "stopDetectionDelay": 0,
  "activityRecognitionInterval": 10000,
  "distanceFilter": 50,
  "activityType": 2,
  "useSignificantChangesOnly": false,
  "autoSync": false,
  "isMoving": false,
  "maxDaysToPersist": 1,
  "stopTimeout": 2,
  "enabled": false,
  "debug": true,
  "batchSync": false,
  "headers": {},
  "disableElasticity": false,
  "stationaryRadius": 20
}
```

####`getCurrentPosition(successFn, failureFn)`
Retrieves the current position.  This method instructs the native code to fetch exactly one location using maximum power & accuracy.  **NOTE:** The plugin **MUST** be enabled via `#start` to use this method (otherwise the plugin will call your `failureFn` with a status-code `401` (UNAUTHORIZED).  The native code will persist the fetched location to its SQLite database just as any other location in addition to POSTing to your configured `#url` (if you've enabled the HTTP features).  In addition to your supplied `callbackFn`, the plugin will also execute the `callback` provided to `#configure`.  Your provided `successFn` will be executed with the same signature as that provided to `#configure`:

######@param {Object} location The Location data
######@param {Integer} taskId The taskId used to send to bgGeo.finish(taskId) in order to signal completion of your callbackFn

```
bgGeo.getCurrentPosition(function(location, taskId) {
    // This location is already persisted to plugin’s SQLite db.  
    // If you’ve configured #autoSync: true, the HTTP POST has already started.

    console.log(“- Current position received: “, location);
    bgGeo.finish(taskId);
});

```

####`changePace(enabled, successFn, failureFn)`
Initiate or cancel immediate background tracking.  When set to ```true```, the plugin will begin aggressively tracking the devices Geolocation, bypassing stationary monitoring.  If you were making a "Jogging" application, this would be your [Start Workout] button to immediately begin GPS tracking.  Send ```false``` to disable aggressive GPS monitoring and return to stationary-monitoring mode.

```
bgGeo.changePace(true);  // <-- Aggressive GPS monitoring immediately engaged.
bgGeo.changePace(false); // <-- Disable aggressive GPS monitoring.  Engages stationary-mode.
```

####`onMotionChange(callbackFn, failureFn)`
Your ```callbackFn``` will be executed each time the device has changed-state between **MOVING** or **STATIONARY**.  The ```callbackFn``` will be provided with a ```Location``` object as the 1st param, with the usual params (```latitude, longitude, accuracy, speed, bearing, altitude```), in addition to a ```taskId``` used to signal that your callback is finished.

######@param {Boolean} isMoving `false` if entered **STATIONARY** mode; `true` if entered **MOVING** mode.
######@param {Object} location The location at the state-change.
######@param {Integer} taskId The taskId used to send to bgGeo.finish(taskId) in order to signal completion of your callbackFn

```
bgGeo.onMotionChange(function(isMoving, location, taskId) {
    if (isMoving) {
        console.log('Device has just started MOVING', location);
    } else {
        console.log('Device has just STOPPED', location);
    }
    bgGeo.finish(taskId);
})

```

####`onStationary(callbackFn, failureFn)` 

**DEPRECATED** &mdash; Use [onMotionChange](https://github.com/transistorsoft/cordova-background-geolocation/tree/trigger-activities#onmotionchangecallbackfn-failurefn) instead.

Your ```callbackFn``` will be executed each time the device has entered stationary-monitoring mode.  The ```callbackFn``` will be provided with a ```Location``` object as the 1st param, with the usual params (```latitude, longitude, accuracy, speed, bearing, altitude```), in addition to a ```taskId``` used to signal that your callback is finished.

######@param {Object} location The Location data
######@param {Integer} taskId The taskId used to send to bgGeo.finish(taskId) in order to signal completion of your callbackFn

```
bgGeo.onStationary(function(location, taskId) {
    try {
        console.log('- Device is stopped: ', location.latitude, location.longitude);
    } catch(e) {
        console.error('An error occurred in my application code', e);
    }
    // The plugin runs your callback in a background-thread:  
    // you MUST signal to the native plugin when your callback is finished so it can halt the thread.
    // IF YOU DON'T, iOS WILL KILL YOUR APP
    bgGeo.finish(taskId);
});
```

####`addGeofence(config, callbackFn, failureFn)`
Adds a geofence to be monitored by the native plugin.  Monitoring of a geofence is halted after a crossing occurs.  The `config` object accepts the following params.

######@config {String} identifier The name of your geofence, eg: "Home", "Office"
######@config {Float} radius The radius (meters) of the geofence.  In practice, you should make this >= 100 meters.
######@config {Float} latitude Latitude of the center-point of the circular geofence.
######@config {Float} longitude Longitude of the center-point of the circular geofence.
######@config {Boolean} notifyOnExit Whether to listen to EXIT events
######@config {Boolean} notifyOnEntry Whether to listen to ENTER events

```
bgGeo.addGeofence({
    identifier: "Home",
    radius: 150,
    latitude: 45.51921926,
    longitude: -73.61678581,
    notifyOnEntry: true,
    notifyOnExit: false
}, function() {
    console.log("Successfully added geofence");
}, function(error) {
    console.warn("Failed to add geofence", error);
});
```

####`removeGeofence(identifier, callbackFn, failureFn)`
Removes a geofence having the given `{String} identifier`.

######@config {String} identifier The name of your geofence, eg: "Home", "Office"
######@config {Function} callbackFn successfully removed geofence.
######@config {Function} failureFn failed to remove geofence

```
bgGeo.removeGeofence("Home", function() {
    console.log("Successfully removed geofence");
}, function(error) {
    console.warn("Failed to remove geofence", error);
});
```

####`getGeofences(callbackFn, failureFn)`

Fetch the list of monitored geofences.  Your `callbackFn` will be provided with an `Array` of geofences.  If there are no geofences being monitored, you'll receive an empty Array `[]`.

```
bgGeo.getGeofences(function(geofences) {
    for (var n=0,len=geofences.length;n<len;n++) {
        console.log("Geofence: ", geofence.identifier, geofence.radius, geofence.latitude, geofence.longitude);
    }
}, function(error) {
    console.warn("Failed to fetch geofences from server");
});
```

####`onGeofence(callbackFn)`
Adds a geofence event-listener.  Your supplied callback will be called when any monitored geofence crossing occurs.  The `callbackFn` will be provided the following parameters:

######@param {Object} params.  This object contains 3 keys: `@param {String} identifier`, `@param {String} action [ENTER|EXIT]`, `@param {Object} location`.
######@param {Integer} taskId The background taskId which you must send back to the native plugin via `bgGeo.finish(taskId)` in order to signal that your callback is complete.

```
bgGeo.onGeofence(function(params, taskId) {
    try {
        var location = params.location;
        var identifier = params.identifier;
        var action = params.action;
        
        console.log('A geofence has been crossed: ', identifier);
        console.log('ENTER or EXIT?: ', action);
        console.log('Location: ', JSON.stringify(location));
    } catch(e) {
        console.error('An error occurred in my application code', e);
    }
    // The plugin runs your callback in a background-thread:  
    // you MUST signal to the native plugin when your callback is finished so it can halt the thread.
    // IF YOU DON'T, iOS WILL KILL YOUR APP
    bgGeo.finish(taskId);
});
```

####`getLocations(callbackFn, failureFn)`
Fetch all the locations currently stored in native plugin's SQLite database.  Your ```callbackFn`` will receive an ```Array``` of locations in the 1st parameter.  Eg:

The `callbackFn` will be executed with following params:

######@param {Array} locations.  The list of locations stored in SQLite database.
######@param {Integer} taskId The background taskId which you must send back to the native plugin via `bgGeo.finish(taskId)` in order to signal the end of your background thread.


```
    bgGeo.getLocations(function(locations, taskId) {
        try {
            console.log("locations: ", locations);
        } catch(e) {
            console.error("An error occurred in my application code");
        }
        bgGeo.finish(taskId);
    });
```

####`sync(callbackFn, failureFn)`

If the plugin is configured for HTTP with an ```#url``` and ```#autoSync: false```, this method will initiate POSTing the locations currently stored in the native SQLite database to your configured ```#url```.  All records in the database will be DELETED.  If you configured ```batchSync: true```, all the locations will be sent to your server in a single HTTP POST request, otherwise the plugin will create execute an HTTP post for **each** location in the database (REST-style).  Your ```callbackFn``` will be executed and provided with an Array of all the locations from the SQLite database.  If you configured the plugin for HTTP (by configuring an `#url`, your `callbackFn` will be executed after the HTTP request(s) have completed.  If the plugin failed to sync to your server (possibly because of no network connection), the ```failureFn``` will be called with an ```errorMessage```.  If you are **not** using the HTTP features, ```sync``` is the only way to clear the native SQLite datbase.  Eg:

Your callback will be provided with the following params

######@param {Array} locations.  The list of locations stored in SQLite database.
######@param {Integer} taskId The background taskId which you must send back to the native plugin via `bgGeo.finish(taskId)` in order to signal the end of your background thread.

```
    bgGeo.sync(function(locations, taskId) {
        try {
        	// Here are all the locations from the database.  The database is now EMPTY.
        	console.log('synced locations: ', locations);
        } catch(e) {
            console.error('An error occurred in my application code', e);
        }

        // Be sure to call finish(taskId) in order to signal the end of the background-thread.
        bgGeo.finish(taskId);
    }, function(errorMessage) {
        console.warn('Sync FAILURE: ', errorMessage);
    });

```

####`getOdometer(callbackFn, failureFn)`

The plugin constantly tracks distance travelled.  To fetch the current **odometer** reading:

```
    bgGeo.getOdometer(function(distance) {
        console.log("Distance travelled: ", distance);
    });
```

####`resetOdometer(callbackFn, failureFn)`

Reset the **odometer** to zero.  The plugin never automatically resets the odometer so it's up to you to reset it as desired.

####`playSound(soundId)`

Here's a fun one.  The plugin can play a number of OS system sounds for each platform.  For [IOS](http://iphonedevwiki.net/index.php/AudioServices) and [Android](http://developer.android.com/reference/android/media/ToneGenerator.html).  I offer this API as-is, it's up to you to figure out how this works.

```
    // A soundId iOS recognizes
    bgGeo.playSound(1303);
    
    // An Android soundId
    bgGeo.playSound(90);
```


## Config

Use the following config-parameters with the #configure method:

####`@param {Boolean} debug`

When enabled, the plugin will emit sounds for life-cycle events of background-geolocation!  **NOTE iOS**:  In addition, you must manually enable the *Audio and Airplay* background mode in *Background Capabilities* to hear these debugging sounds.

| Event | iOS | Android |
|-------|-----|---------|
| Exit stationary-region | Calendar event sound | n/a |
| Location recorded | SMS-sent sound | "blip" |
| Aggressive geolocation engaged | SIRI listening sound | "doodly-doo" |
| Acquiring stationary location | "tick, tick, tick" | n/a |
| Stationary state | "bloom" | long "beeeeeeep" |
| Geofence crossing | trumpets/fanfare | boop-boop-boop |

**NOTE:**  In order for debug sounds to operate *when the app is in background*, you must enable the `Audio and Airplay` **Background Mode**.

![](https://camo.githubusercontent.com/ad01117185eb13a237efcfa1eaf7e39346a967ed/68747470733a2f2f646c2e64726f70626f7875736572636f6e74656e742e636f6d2f752f323331393735352f636f72646f76612d6261636b67726f756e642d67656f6c6f636169746f6e2f656e61626c652d6261636b67726f756e642d617564696f2e706e67)

####`@param {Integer} desiredAccuracy [0, 10, 100, 1000] in meters`

Specify the desired-accuracy of the geolocation system with 1 of 4 values, ```0, 10, 100, 1000``` where ```0``` means HIGHEST POWER, HIGHEST ACCURACY and ```1000``` means LOWEST POWER, LOWEST ACCURACY

- [Android](https://developer.android.com/reference/com/google/android/gms/location/LocationRequest.html#PRIORITY_BALANCED_POWER_ACCURACY)
- [iOS](https://developer.apple.com/library/ios/documentation/CoreLocation/Reference/CLLocationManager_Class/index.html#//apple_ref/occ/instp/CLLocationManager/desiredAccuracy) 

####`@param {Integer} stationaryRadius (meters)`

When stopped, the minimum distance the device must move beyond the stationary location for aggressive background-tracking to engage.  Note, since the plugin uses iOS significant-changes API, the plugin cannot detect the exact moment the device moves out of the stationary-radius.  In normal conditions, it can take as much as 3 city-blocks to 1/2 km before staionary-region exit is detected.

####`@param {Integer} distanceFilter`

The minimum distance (measured in meters) a device must move horizontally before an update event is generated.  @see [Apple docs](https://developer.apple.com/library/ios/documentation/CoreLocation/Reference/CLLocationManager_Class/CLLocationManager/CLLocationManager.html#//apple_ref/occ/instp/CLLocationManager/distanceFilter).  However, #distanceFilter is elastically auto-calculated by the plugin:  When speed increases, #distanceFilter increases;  when speed decreases, so does distanceFilter.

distanceFilter is calculated as the square of speed-rounded-to-nearest-5 and adding configured #distanceFilter.

  `(round(speed, 5))^2 + distanceFilter`

For example, at biking speed of 7.7 m/s with a configured distanceFilter of 30m:

  `=> round(7.7, 5)^2 + 30`
  `=> (10)^2 + 30`
  `=> 100 + 30`
  `=> 130`

A gps location will be recorded each time the device moves 130m.

At highway speed of 30 m/s with distanceFilter: 30,

  `=> round(30, 5)^2 + 30`
  `=> (30)^2 + 30`
  `=> 900 + 30`
  `=> 930`

A gps location will be recorded every 930m

Note the following real example of background-geolocation on highway 101 towards San Francisco as the driver slows down as he runs into slower traffic (geolocations become compressed as distanceFilter decreases)

![distanceFilter at highway speed](https://dl.dropboxusercontent.com/u/2319755/cordova-background-geolocaiton/distance-filter-highway.png)

Compare now background-geolocation in the scope of a city.  In this image, the left-hand track is from a cab-ride, while the right-hand track is walking speed.

![distanceFilter at city scale](https://dl.dropboxusercontent.com/u/2319755/cordova-background-geolocaiton/distance-filter-city.png)

####`@param {Boolean} stopOnTerminate`
Enable this in order to force a stop() when the application terminated (e.g. on iOS, double-tap home button, swipe away the app).  On Android, ```stopOnTerminate: false``` will cause the plugin to operate as a headless background-service (in this case, you should configure an #url in order for the background-service to send the location to your server)

####`@param {Boolean} stopAfterElapsedMinutes`

The plugin can optionally auto-stop monitoring location when some number of minutes elapse after being the #start method was called.

### In-Plugin SQLite Storage

The plugin will cache **every** recorded geolocation to its internal SQLite database -- when you sync the locations and your server responds with HTTP ```200, 201 or 204```, the plugin will **DELETE** the stored location from cache.  The plugin has a cache-pruning feature with ```@config {Integer} maxDaysToPersist``` -- If the plugin hasn't successfully synced these these records in the database before  ```maxDaysToPersist``` expires, the plugin will give up and those geolocation records will be pruned from the database.

If you **don't** configure the optional HTTP feature, the only way to delete the SQLite database is by executing the ```#sync``` method.

```
    bgGeo.sync(function(locations) {
    	// The SQLite database is now EMPTY.  
        console.log('locations: ', locations);
    });
```

### HTTP Features

####`@param {String} url`

Your server url where you wish to HTTP POST location data to.

####`@param {String} method [POST]`

The HTTP method to use when creating an HTTP request to your configured `#url`.  Defaults to `POST`.  Valid values are `POST`, `PUT` and `OPTIONS`.

####`@param {String} batchSync [false]`

Default is ```false```.  If you've enabled HTTP feature by configuring an ```#url```, ```batchSync: true``` will POST all the locations currently stored in native SQLite datbase to your server in a single HTTP POST request.  With ```batchSync: false```, an HTTP POST request will be initiated for **each** location in database.

####`@param {String} autoSync [true]`

Default is ```true```.  If you've enabeld HTTP feature by configuring an ```#url```, the plugin will attempt to HTTP POST each location to your server **as it is recorded**.  If you set ```autoSync: false```, it's up to you to **manually** execute the ```#sync``` method to initate the HTTP POST (**NOTE** The plugin will continue to persist **every** recorded location in the SQLite database until you execute ```#sync```).

####`@param {Object} params`

Optional HTTP params sent along in HTTP request to above ```#url```.

####`@param {Object} headers`

Optional HTTP params sent along in HTTP request to above ```#url```.

####`@param {Integer} maxDaysToPersist`

Maximum number of days to store a geolocation in plugin's SQLite database when your server fails to respond with ```HTTP 200 OK```.  The plugin will continue attempting to sync with your server until ```maxDaysToPersist``` when it will give up and remove the location from the database.

Both iOS and Android can send the Geolocation to your server simply by configuring an ```#url``` in addition to optional ```#headers``` and ```#params```.  This is the preferred way to send the Geolocation to your server, rather than doing it yourself with Ajax in your javascript.  

#### Sample HTTP Request arriving at your server

```
bgGeo.configure(callbackFn, failureFn, {
    .
    .
    .
    url: 'http://posttestserver.com/post.php?dir=cordova-background-geolocation',
    autoSync: true,
    batchSync: false,
    maxDaysToPersist: 1,
    headers: {
        "X-FOO": "bar"
    },
    params: {
        "auth_token": "maybe_your_server_authenticates_via_token_YES?"
    }
});

...

Headers (Some may be inserted by server)

REQUEST_URI = /post.php?dir=cordova-background-geolocation
QUERY_STRING = dir=cordova-background-geolocation
REQUEST_METHOD = POST
GATEWAY_INTERFACE = CGI/1.1
REMOTE_PORT = 38380
REMOTE_ADDR = 198.84.250.106
HTTP_USER_AGENT = Apache-HttpClient/UNAVAILABLE (java 1.4)
HTTP_CONNECTION = close
HTTP_HOST = posttestserver.com
CONTENT_LENGTH = 243
CONTENT_TYPE = application/json
HTTP_ACCEPT = application/json
UNIQUE_ID = VS-YI9Bx6hIAABctKDoAAAAB
REQUEST_TIME_FLOAT = 1429198883.9584
REQUEST_TIME = 1429198883

No Post Params.

== Begin post body ==
{
  "location":{
    "timestamp":"2015-05-05T04:31:54Z",  // <-- ISO-8601, UTC
    "coords":{
      "latitude":45.519282,
      "longitude":-73.6169562,
      "accuracy":12.850000381469727,
      "speed":0,
      "heading":0,
      "altitude":0
    },
    "activity":{  // <-- Android-only currently
      "type":"still",
      "confidence":48
    },
    "battery": {  // <-- Battery charge-state
      "level": 0.87,
      "is_charging": false
    }
  },
  "android_id":"39dbac67e2c9d80"
}
== End post body ==
```

### Android Config

####`@param {Integer millis} locationUpdateInterval`

Set the desired interval for active location updates, in milliseconds.

The location client will actively try to obtain location updates for your application at this interval, so it has a direct influence on the amount of power used by your application. Choose your interval wisely.

This interval is inexact. You may not receive updates at all (if no location sources are available), or you may receive them slower than requested. You may also receive them faster than requested (if other applications are requesting location at a faster interval). 

Applications with only the coarse location permission may have their interval silently throttled.

####`@param {Integer millis} fastestLocationUpdateInterval`

Explicitly set the fastest interval for location updates, in milliseconds.

This controls the fastest rate at which your application will receive location updates, which might be faster than ```#locationUpdateInterval``` in some situations (for example, if other applications are triggering location updates).

This allows your application to passively acquire locations at a rate faster than it actively acquires locations, saving power.

Unlike ```#locationUpdateInterval```, this parameter is exact. Your application will never receive updates faster than this value.

If you don't call this method, a fastest interval will be set to **30000 (30s)**. 

An interval of 0 is allowed, but not recommended, since location updates may be extremely fast on future implementations.

If ```#fastestLocationUpdateInterval``` is set slower than ```#locationUpdateInterval```, then your effective fastest interval is ```#locationUpdateInterval```.

========
An interval of 0 is allowed, but not recommended, since location updates may be extremely fast on future implementations.

####`@param {Integer millis} activityRecognitionInterval`

the desired time between activity detections. Larger values will result in fewer activity detections while improving battery life. A value of 0 will result in activity detections at the fastest possible rate.

####`@param {Integer millis} minimumActivityRecognitionConfidence` 

Each activity-recognition-result returned by the API is tagged with a "confidence" level expressed as a %.  You can set your desired confidence to trigger a state-change.  Defaults to `80`.

####`@param {String} triggerActivities`

These are the comma-delimited list of [activity-names](https://developers.google.com/android/reference/com/google/android/gms/location/DetectedActivity) returned by the `ActivityRecognition` API which will trigger a state-change from **stationary** to **moving**.  By default, this list is set to all five **moving-states**:  `"in_vehicle, on_bicycle, on_foot, running, walking"`.  If you wish, you could configure the plugin to only engage **moving-mode** for vehicles by providing only `"in_vehicle"`.

####`@param {Integer minutes} stopTimeout`

The number of miutes to wait before turning off the GPS after the ActivityRecognition System (ARS) detects the device is ```STILL``` (defaults to 0, no timeout).  If you don't set a value, the plugin is eager to turn off the GPS ASAP.  An example use-case for this configuration is to delay GPS OFF while in a car waiting at a traffic light.

**iOS Stop-detection timing**
![](https://dl.dropboxusercontent.com/u/2319755/cordova-background-geolocaiton/ios-stop-detection-timing.png)

####`@param {Integer minutes} stopDetectionDelay [0]` 

Allows the stop-detection system to be delayed from activating.  When the stop-detection system is engaged, the GPS is off and only the accelerometer is monitored.  Stop-detection will only engage if this timer expires.  The timer is cancelled if any movement is detected before expiration.  If a value of `0` is specified, the stop-detection system will engage as soon as the device is detected to be stationary.

####`@param {Boolean} forceReloadOnMotionChange`

If the user closes the application while the background-tracking has been started,  location-tracking will continue on if ```stopOnTerminate: false```.  You may choose to force the foreground application to reload (since this is where your Javascript runs).  `forceReloadOnMotionChange: true` will reload the app only when a state-change occurs from **stationary -> moving** or vice-versa. (**WARNING** possibly disruptive to user).

####`@param {Boolean} forceReloadOnLocationChange`

If the user closes the application while the background-tracking has been started,  location-tracking will continue on if ```stopOnTerminate: false```.  You may choose to force the foreground application to reload (since this is where your Javascript runs).  `forceReloadOnLocationChange: true` will reload the app when a new location is recorded.

####`@param {Boolean} forceReloadOnGeofence`

If the user closes the application while the background-tracking has been started,  location-tracking will continue on if ```stopOnTerminate: false```.  You may choose to force the foreground application to reload (since this is where your Javascript runs).  `forceReloadOnGeolocation: true` will reload the app only when a geofence crossing event has occurred.

####`@param {Boolean} startOnBoot`

Set to ```true``` to start the background-service whenever the device boots.  Unless you configure the plugin to ```forceReload``` (ie: boot your app), you should configure the plugin's HTTP features so it can POST to your server in "headless" mode.



### iOS Config

####`@param {Boolean} disableElasticity [false]`

Defaults to ```false```.  Set ```true``` to disable automatic speed-based ```#distanceFilter``` elasticity.  eg:  When device is moving at highway speeds, locations are returned at ~ 1 / km.

####`@param {String} activityType [AutomotiveNavigation, OtherNavigation, Fitness, Other]`

Presumably, this affects ios GPS algorithm.  See [Apple docs](https://developer.apple.com/library/ios/documentation/CoreLocation/Reference/CLLocationManager_Class/CLLocationManager/CLLocationManager.html#//apple_ref/occ/instp/CLLocationManager/activityType) for more information

### WP8 Config

####`{Integer [0, 10, 100, 1000]} desiredAccuracy`

##### Windows Phone
The underlying GeoLocator you can choose to use 'DesiredAccuracy' or 'DesiredAccuracyInMeters'. Since this plugins default configuration accepts meters, the default desiredAccuracy is mapped to the Windows Phone DesiredAccuracyInMeters leaving the DesiredAccuracy enum empty. For more info see the [MS docs](http://msdn.microsoft.com/en-us/library/windows/apps/windows.devices.geolocation.geolocator.desiredaccuracyinmeters) for more information.

# Geofence Features

![Geofence Features](https://dl.dropboxusercontent.com/u/2319755/cordova-background-geolocaiton/screenshot-iphone5-geofences-framed-README.png)

The plugin includes native **geofencing** features.  You may add, remove and query the list of monitored geofences from the native plugin.  The native plugin will persist monitored geofences and re-initiate them when the app boots or the device is restarted.

A monitored geofence **will remain active** until you explicity remove it via `bgGeo.removeGeofence(identifier)`.

#### Geofence Model

#####`@param {String} identifier`

A unique `String` to identify your Geofence, eg: "Home", "Office".

#####`@param {Integer} radius`

The radius of the circular geofence.  A radius of >100 meters works best.

#####`@param {Boolean} notifyOnEntry`

Transitioning **into** the geofence will generate an event.

#####`@param {Boolean} notifyOnExit`

Transitioning **out of** the geofence will generate an event.

#### Listening to Geofence Events

Listen to geofence transition events using the method `#onGeofence`.  You may set up any number of `#onGeofence` event-listeners throughout your code -- they will all be executed.

```
    bgGeo.addGeofence({
        identifier: "Home",
        radius: 200,
        latitude: 47.2342323,
        longitude: -57.342342,
        notifyOnEntry: true
    });
    
    bgGeo.onGeofence(function(geofence, taskId) {
        try {
            console.log("- A Geofence transition occurred");
            console.log("  identifier: ", geofence.identifier);
            console.log("  action: ", geofence.action);
        } catch(e) {
            console.error("An error occurred in my code!", e);
        }
        // Be sure to call #finish!!
        bgGeo.finish(taskId);
    });
```

#### Removing Geofences

The native plugin will continue to monitor geofences and fire transition-events until you explicity tell the plugin to remove a geofence via `#removeGeofence(identifier)`.

```
    bgGeo.removeGeofence("Home");

```

#### Querying Geofences

The native plugin persists monitored geofences between application boots and device restarts.  When your app boots, you can fetch the currently monitored geofences from the native plugin and, for example, re-draw markers on your map.

```
    bgGeo.getGeofences(function(geofences) {
        for (var n=0,len=geofences.length;n<len;n++) {
            var geofence = geofences[n];
            var marker = new google.maps.Circle({
                radius: parseInt(geofence.radius, 10),
                center: new google.maps.LatLng(geofence.latitude, geofence.longitude),
                map: myMapInstance
            });
        }
    });
```

## Licence ##
```
cordova-background-geolocation
Copyright (c) 2015, Transistor Software (9224-2932 Quebec Inc)
All rights reserved.
sales@transistorsoft.com
http://transistorsoft.com
```

1. Preamble:  This Agreement governs the relationship between YOU OR THE ORGANIZATION ON WHOSE BEHALF YOU ARE ENTERING INTO THIS AGREEMENT (hereinafter: Licensee) and Transistor Software, a LICENSOR AFFILIATION whose principal place of business is Montreal, Quebec, Canada (Hereinafter: Licensor). This Agreement sets the terms, rights, restrictions and obligations on using [{software}] (hereinafter: The Software) created and owned by Licensor, as detailed herein

2. License Grant: Licensor hereby grants Licensee a Personal, Non-assignable &amp; non-transferable, Commercial, Royalty free, Including the rights to create but not distribute derivative works, Non-exclusive license, all with accordance with the terms set forth and other legal restrictions set forth in 3rd party software used while running Software.

	2.1 Limited: Licensee may use Software for the purpose of:
		- Running Software on Licensee's Website[s] and Server[s];
		- Allowing 3rd Parties to run Software on Licensee's Website[s] and Server[s];
		- Publishing Software&rsquo;s output to Licensee and 3rd Parties;
		- Distribute verbatim copies of Software's output (including compiled binaries);
		- Modify Software to suit Licensee&rsquo;s needs and specifications.

	2.2 Binary Restricted: Licensee may sublicense Software as a part of a larger work containing more than Software, distributed solely in Object or Binary form under a personal, non-sublicensable, limited license. Such redistribution shall be limited to unlimited codebases.</li><li>

	2.3 Non Assignable &amp; Non-Transferable: Licensee may not assign or transfer his rights and duties under this license.

	2.4 Commercial, Royalty Free: Licensee may use Software for any purpose, including paid-services, without any royalties

	2.5 Including the Right to Create Derivative Works: </strong>Licensee may create derivative works based on Software, including amending Software&rsquo;s source code, modifying it, integrating it into a larger work or removing portions of Software, as long as no distribution of the derivative works is made.

3. Term & Termination:  The Term of this license shall be until terminated. Licensor may terminate this Agreement, including Licensee's license in the case where Licensee : 

	3.1 became insolvent or otherwise entered into any liquidation process; or

	3.2 exported The Software to any jurisdiction where licensor may not enforce his rights under this agreements in; or

	3.3 Licensee was in breach of any of this license's terms and conditions and such breach was not cured, immediately upon notification; or

	3.4 Licensee in breach of any of the terms of clause 2 to this license; or

	3.5 Licensee otherwise entered into any arrangement which caused Licensor to be unable to enforce his rights under this License.

4. Payment: In consideration of the License granted under clause 2, Licensee shall pay Licensor a FEE, via Credit-Card, PayPal or any other mean which Licensor may deem adequate. Failure to perform payment shall construe as material breach of this Agreement.

5. Upgrades, Updates and Fixes: Licensor may provide Licensee, from time to time, with Upgrades,  Updates or Fixes, as detailed herein and according to his sole discretion. Licensee hereby warrants to keep The Software up-to-date and install all relevant updates and fixes, and may, at his sole discretion, purchase upgrades, according to the rates set by Licensor. Licensor shall provide any update or Fix free of charge; however, nothing in this Agreement shall require Licensor to provide Updates or Fixes.

	5.1 Upgrades: for the purpose of this license, an Upgrade  shall be a material amendment in The Software, which contains new features   and or major performance improvements and shall be marked as a new version number. For example, should Licensee purchase The Software under   version 1.X.X, an upgrade shall commence under number 2.0.0.

	5.2 Updates: for the purpose of this license, an update shall be a minor amendment   in The Software, which may contain new features or minor improvements and   shall be marked as a new sub-version number. For example, should   Licensee purchase The Software under version 1.1.X, an upgrade shall   commence under number 1.2.0.

	5.3 Fix: for the purpose of this license, a fix shall be a minor amendment in   The Software, intended to remove bugs or alter minor features which impair   the The Software's functionality. A fix shall be marked as a new   sub-sub-version number. For example, should Licensee purchase Software   under version 1.1.1, an upgrade shall commence under number 1.1.2.

6. Support: Software is provided under an AS-IS basis and without any support, updates or maintenance. Nothing in this Agreement shall require Licensor to provide Licensee with support or fixes to any bug, failure, mis-performance or other defect in The Software.

	6.1 Bug Notification: Licensee may provide Licensor of details regarding any bug, defect or   failure in The Software promptly and with no delay from such event;  Licensee  shall comply with Licensor's request for information regarding  bugs,  defects or failures and furnish him with information,  screenshots and  try to reproduce such bugs, defects or failures.

	6.2 Feature Request: Licensee may request additional features in Software, provided, however, that (i) Licensee shall waive any claim or right in such feature should feature be developed by Licensor; (ii) Licensee shall be prohibited from developing the feature, or disclose such feature   request, or feature, to any 3rd party directly competing with Licensor or any 3rd party which may be, following the development of such feature, in direct competition with Licensor; (iii) Licensee warrants that feature does not infringe any 3rd party patent, trademark, trade-secret or any other intellectual property right; and (iv) Licensee developed, envisioned or created the feature solely by himself.

7. Liability: To the extent permitted under Law, The Software is provided under an   AS-IS basis. Licensor shall never, and without any limit, be liable for   any damage, cost, expense or any other payment incurred by Licensee as a   result of Software&rsquo;s actions, failure, bugs and/or any other  interaction  between The Software &nbsp;and Licensee&rsquo;s end-equipment, computers,  other  software or any 3rd party, end-equipment, computer or  services. Moreover, Licensor shall never be liable for any defect in  source code  written by Licensee when relying on The Software or using The Software&rsquo;s source  code.

8. Warranty: 

	8.1 Intellectual Property:  Licensor   hereby warrants that The Software does not violate or infringe any 3rd   party claims in regards to intellectual property, patents and/or   trademarks and that to the best of its knowledge no legal action has   been taken against it for any infringement or violation of any 3rd party   intellectual property rights.

	8.2 No-Warranty: The Software is provided without any warranty; Licensor hereby disclaims   any warranty that The Software shall be error free, without defects or code   which may cause damage to Licensee&rsquo;s computers or to Licensee, and  that  Software shall be functional. Licensee shall be solely liable to  any  damage, defect or loss incurred as a result of operating software  and  undertake the risks contained in running The Software on License&rsquo;s  Server[s]  and Website[s].

	8.3 Prior Inspection:  Licensee hereby states that he inspected The Software thoroughly and found   it satisfactory and adequate to his needs, that it does not interfere   with his regular operation and that it does meet the standards and  scope  of his computer systems and architecture. Licensee found that  The Software  interacts with his development, website and server environment  and that  it does not infringe any of End User License Agreement of any  software  Licensee may use in performing his services. Licensee hereby  waives any  claims regarding The Software's incompatibility, performance,  results and  features, and warrants that he inspected the The Software.</p>

9. No Refunds:  Licensee warrants that he inspected The Software according to clause 7(c)   and that it is adequate to his needs. Accordingly, as The Software is   intangible goods, Licensee shall not be, ever, entitled to any refund,   rebate, compensation or restitution for any reason whatsoever, even if   The Software contains material flaws.

10. Indemnification:  Licensee hereby warrants to hold Licensor harmless and indemnify Licensor for any lawsuit brought against it in regards to Licensee&rsquo;s use   of The Software in means that violate, breach or otherwise circumvent this   license, Licensor's intellectual property rights or Licensor's title  in  The Software. Licensor shall promptly notify Licensee in case of such  legal  action and request Licensee's consent prior to any settlement in relation to such lawsuit or claim.

11. Governing Law, Jurisdiction:  Licensee hereby agrees not to initiate class-action lawsuits against Licensor in relation to this license and to compensate Licensor for any legal fees, cost or attorney fees should any claim brought by Licensee against Licensor be denied, in part or in full.

