app.factory('httpRequester',function(objectToQueryString){
    return {
        get: function (url){
            return $.ajax({
                method: "GET",
                url: url,
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            })
        },
        getAuthorized: function (url,identity){
            return $.ajax({
                method: "GET",
                url: url,
                headers: {'Content-Type': 'application/x-www-form-urlencoded', "Authorization" : "Bearer " + identity}
            })
        },        
        post: function (url,data){
            return $.ajax({
                method: "POST",
                url: url,
                data: objectToQueryString.parse(data),
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            })
        },
        postAuthorized: function (url,data){
            return $.ajax({
                method: "POST",
                url: url,
                data: objectToQueryString.parse(data),
                headers: {'Content-Type': 'application/x-www-form-urlencoded', "Authorization" : "Bearer " + data.identity},     
            })
        },
        custom: function (type,url,data){
            return $.ajax({
                method: type,
                url: url,
                data: objectToQueryString.parse(data),
                headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            })
        },
        customAuthorized: function (type,url,data){
            return $.ajax({
                method: type,
                url: url,
                data: objectToQueryString.parse(data),
                headers: {'Content-Type': 'application/x-www-form-urlencoded', "Authorization" : "Bearer " + data.identity}
            })
        },
        customAuthorizedUrlData: function (type,url,data){
        return $.ajax({
            method: type,
            url: url + '?' + objectToQueryString.parse(data),
            headers: {'Content-Type': 'application/x-www-form-urlencoded', "Authorization" : "Bearer " + data.identity}
        })
    } 
    }
});