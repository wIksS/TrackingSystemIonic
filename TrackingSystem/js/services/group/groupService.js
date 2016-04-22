"use strict";

app.factory('groupService', function (identity, baseUrl, httpRequester)
{
    var url = baseUrl;

    return {
        getGroup: function ()
        {
            var user = identity.getUser();

            return httpRequester.getAuthorized(url + '/api/Group/GetGroup', user.token);
        },
        changeGroupDistance: function (newDistance)
        {
            var user = identity.getUser();
            var data = { identity: user.token };

            return httpRequester.postAuthorized(url + '/api/Group/?newDistance=' + newDistance, data);
        },
        getStudentsInGroup:function()
        {
            var user = identity.getUser();

            return httpRequester.getAuthorized(url + '/api/Group/GetStudentsInGroup', user.token);
        },
        removeFromGroup :function(id)
        {
            var user = identity.getUser();
            var data = { 'id': id, 'identity': user.token };

            return httpRequester.customAuthorizedUrlData('POST',url + '/api/Group/RemoveFromGroup', data);
        }
    }
});