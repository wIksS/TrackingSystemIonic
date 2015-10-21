Example Background GeoLocation app.
=============================================

Help to make this plugin better
==============================

Enable in app **Collect** feature, to send your position, battery level and basic device info to [background-geolocation-console](https://bgconsole.mybluemix.net/).
This data can be used to improve plugin in the future.

No ip address or device.uuid is stored on server. The device.uuid is anonymized before sent.
I will not provide any binary builds of SampleApp, so you can always check the source code, what the app is actually doing. [Source code](https://github.com/mauron85/background-geolocation-console) of the console is also available.

## Description

Example app shows some possibilities how to use this plugin in real apps.
It is using IndexedDB to store locations when offline and resent them automatically when back online.

## How to build SampleApp

Replace platform with one of supported platforms: android, ios or wp8. In this example we will build for Android.

```
$ cordova platform add android
$ cordova build android
```

There is *after_platform_add* hook in config.xml which runs script that install all required plugins.

## Development

All plugins will be installed from npm at their latest version. However if you want to install your local version on cordova-plugin-background-geolocation, you can do that:

## Credits

* [transistorsoft](https://github.com/transistorsoft) for background-geolocation-console, cordova-background-geolocation and SampleApp.

```
$ cordova plugin rm cordova-plugin-mauron85-background-geolocation
$ cordova plugin add file:///absolute_path_to_your/cordova-plugin-background-geolocation/
$ cordova build
```

Run on device

```
$ cordova run --device
```

### iOS quirks

If you're using XCode, boot the SampleApp in the iOS Simulator and enable ```Debug->Location->City Drive```.
