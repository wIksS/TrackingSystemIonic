app.factory('groupService', function (identity, baseUrl, httpRequester)
{
    var url = baseUrl;

    return {
        getGroup: function ()
        {
            var user = identity.getUser();

            return httpRequester.getAuthorized(url + '/api/group', user.token);
        },
        changeGroupDistance: function (newDistance)
        {
            var user = identity.getUser();
            var data = { identity: user.token };

            return httpRequester.postAuthorized(url + '/api/group/?newDistance=' + newDistance, data);
        }
    }
});