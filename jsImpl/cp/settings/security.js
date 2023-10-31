window.addEventListener('load', async event => {
    fidoSetup();
});
function fidoSetup(){
    let fidoSetupModal = $('#fidoSetupModal');
    let fidoSetupModalBtn = fidoSetupModal.find('#fidoSetupModalBtn');
    let fidoSetupBtn = $('#fidoSetupBtn');
    let name = $('#fido-name');

    fidoSetupBtn.on('click', function () {
        fidoSetupModal.modal('show');

        if(platformAuthenticatorIsAvailable){
            fidoSetupModal.find('#radio-mode-integrated').prop('checked', true);
            fidoSetupModal.find('#radio-mode-physical').prop('checked', false);
            fidoSetupModal.find('#radio-mode-integrated').prop('disabled', false);
        } else {
            fidoSetupModal.find('#radio-mode-physical').prop('checked', true);
            fidoSetupModal.find('#radio-mode-integrated').prop('checked', false);
            fidoSetupModal.find('#radio-mode-integrated').prop('disabled', true);
        }

    });

    fidoSetupModalBtn.on('click', function () {
        setupFido2();
    });

    function setupFido2(){
        fidoSetupModalBtn.attr('disabled', true);
        let mode;
        if (fidoSetupModal.find('#radio-mode-physical').prop('checked')) {
            mode = "physical";
        } else {
            mode = "integrated";
        }

        $.ajax({
            type: 'POST',
            url: apiURL + '/auth/fido2/register/option',
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", "Bearer " + accessToken);
            },
            data: JSON.stringify({
                keyName: name.val(),
                mode: mode
            })
        }).done(async function (answer) {
            startRegistration(answer.response).then(function (assertion) {
                $.ajax({
                    type: 'POST',
                    url: apiURL + '/auth/fido2/register',
                    data: JSON.stringify(assertion),
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader("Authorization", "Bearer " + accessToken);
                    }
                }).done(async function (answer) {
                    if (answer.success) {
                        sendNotify(getMessage("general.action.message.success"), 'success');
                        location.reload();
                    } else {
                        fidoSetupModalBtn.attr('disabled', false);
                        sendNotify(getMessage("general.action.message.failed") + ": " + answer.response.error_message, "danger");
                    }
                }).fail(function (err) {
                    fidoSetupModalBtn.attr('disabled', false);
                    sendNotify(getMessage("general.action.message.failed") + ": " + err.responseJSON.response.error_message, "danger");
                });
            }).catch(function (err) {
                fidoSetupModalBtn.attr('disabled', false);
                sendNotify(getMessage("general.action.message.failed") + ": " + err.message, "danger");
            });
        }).fail(function (err) {
            fidoSetupModalBtn.attr('disabled', false);
            sendNotify(getMessage("general.action.message.failed") + ": " + err.responseJSON.response.error_message, "danger");
        });
    }

}