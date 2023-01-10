function setupFido2() {
    const fido_name = document.getElementById('fido-name').value;

    let mode;

    if(document.getElementById('radio-mode-physical').checked) {
        mode = "physical";
    } else {
        mode = "integrated";
    }

    // love you rob schuck
    PuhHosting.fido2.initRegister({
        actionUrl: apiURL + '/auth/fido2/register',
        actionHeader: {
            'Authorization': 'Bearer ' + accessToken,
            'Accept': 'application/json'
        },
        optionsUrl: apiURL + '/auth/fido2/register/option',
        optionsHeader: {
            'Authorization': 'Bearer ' + accessToken,
            'Accept': 'application/json'
        }
    });
    PuhHosting.fido2.register({
        keyName: fido_name,
        mode: mode
    });
}
window.addEventListener('puh-fido2-register-success', evt => {
    console.log(evt);
    if(evt.detail.success === true){
        sendNotify(getMessage("general.action.message.success"), 'success');
        location.reload();
    } else {
        sendNotify(getMessage("general.action.message.failed") + ' : ' + error, 'danger');
    }
});
window.addEventListener('puh-fido2-register-failure', evt => {
    console.log(evt);

    sendNotify(getMessage("general.action.message.failed") + ' : ' + evt.detail.name, 'danger');
//                    if(evt.detail.name === 'NotSupportedError'){
//                      PuhHosting.fido2.register({
//                          keyName: document.getElementById('fido-name').value,
//                          residentKey: false
//                      });
//                    } else {
//                      sendNotify('" . LanguageService::getMessage("general.action.message.failed") . ": ' + evt.detail.name, 'danger');
//                    }

});