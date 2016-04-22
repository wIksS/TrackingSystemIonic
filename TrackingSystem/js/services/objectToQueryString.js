"use strict";

app.factory('objectToQueryString', function () {
    return{
        parse:function (obj) {
            var p = [];
            for (var key in obj) {
                if(key != 'identity') {
                    p.push(key + '=' + obj[key]);
                }
            }
            return p.join('&');
        }
    } 
});