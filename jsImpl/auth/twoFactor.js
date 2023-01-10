PuhHosting.fido2.initLogin({
    actionUrl:  apiURL + '/auth/fido2/login',
    actionHeader: {
        'Authorization': 'Bearer ' + sessionCode,
        'Accept': 'application/json'
    },

    optionsUrl:  apiURL + '/auth/fido2/login/option',
    optionsHeader: {
        'Authorization': 'Bearer ' + sessionCode,
        'Accept': 'application/json'
    }
});
PuhHosting.fido2.login({});
window.addEventListener('puh-fido2-login-success', evt => {
    if(evt.detail.success === true){
        sendNotify(getMessage("general.action.message.success"), 'success');
        document.location.href = success_url;
    } else {
        sendNotify(getMessage("general.action.message.failed") + ': ' + evt.detail.response.error_message, 'danger');
    }

});
window.addEventListener('puh-fido2-login-failure', evt => {
    if(evt.detail.name === 'NotSupportedError'){
        PuhHosting.fido2.login({
            residentKey: false
        });
    } else {
        sendNotify(getMessage("general.action.message.failed") + ': ' + evt.detail.name, 'danger');
    }
});