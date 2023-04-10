function requireIdentityCheck(){
    startIdentityCheck(0,
        function (answer, interval) {
            if(newWindow.closed === true){
                clearInterval(interval);
                window.location.reload();
            }
        }, function (err) {
            $('.modal').modal('hide');
            sendNotify(getMessage("general.action.message.failed"),'danger');
        }
    );
}

function startIdentityCheck(address_id = 0, onSuccess, onError){
    url;
    if(address_id !== 0){
        url = apiURL + '/user/settings/userInfo/address/'+address_id+'/identityCheck';
    } else {
        url = apiURL + '/user/settings/userInfo/address/identityCheck';
    }

    $.ajax({
        type: 'POST',
        url: url,
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        },
    }).done(function (answer) {
        if(answer.success === true){
            popupCenter(answer.response.url, 'IdentityCheck', 500, 750);
            interval = setInterval(function(){
                if(newWindow.closed === true){
                    onSuccess(answer, interval);
                }
            }, 500);
        } else {
            getAlreadyStartedCheck(address_id, onSuccess, onError);
        }
    }).fail(function (err)  {
        getAlreadyStartedCheck(address_id, onSuccess, onError);
    });
}

function getAlreadyStartedCheck(address_id = 0, onSuccess, onError){
    url;
    if(address_id !== 0){
        url = apiURL + '/user/settings/userInfo/address/'+address_id+'/identityCheck';
    } else {
        url = apiURL + '/user/settings/userInfo/address/identityCheck';
    }

    $.ajax({
        type: 'GET',
        url: url,
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        },
    }).done(function (answer1) {
        if(answer1.success === true) {
            popupCenter(answer1.response.url, 'IdentityCheck', 500, 750);
            interval = setInterval(function(){
                if(newWindow.closed === true){
                    onSuccess(answer1, interval);
                }
            }, 500);
        } else {
            onError(answer1);
        }
    }).fail(function (err1)  {
        onError(err1);
    });
}
