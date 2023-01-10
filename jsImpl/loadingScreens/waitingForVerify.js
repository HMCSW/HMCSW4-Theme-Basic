var interval;
interval = setInterval(function(){ check( addressId) }, 2000);


function check(address_id){
    $.ajax({
        type: 'GET',
        url: apiURL + '/user/settings/userInfo/address/' + address_id + '/identityCheck/state',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        },
    }).done(function (answer) {
        if(answer.success === false){
            window.opener.sendNotify(getMessage("general.action.message.failed"),'danger');
        }
        window.opener.focus();
        window.close();
    }).fail(function (err)  {
        window.opener.sendNotify(getMessage("general.action.message.failed"),'danger');
        window.opener.focus();
        window.close();

    });
}