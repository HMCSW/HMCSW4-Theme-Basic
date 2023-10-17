function updateEmail() {
    var email = $('#email').val();
    $.ajax({
        url: apiURL + '/user/settings/general/email',
        type: 'patch',
        data: {
            email: email
        },
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        },
    }).done(function (answer) {
        if (answer.success === true) {
            if (answer.response.requireSessionCode === true) {
                startTwoFactorConfirmation(answer.response.sessionCode, function () {
                    $.ajax({
                        data: {sessionCode: answer.response.sessionCode, email: email},
                        url: apiURL + '/user/settings/general/email',
                        type: 'patch',
                        beforeSend: function (xhr) {
                            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
                        },
                    }).done(function (answer) {
                        document.getElementById('updateEmail').disabled = false;
                        if (answer.success === false) {
                            sendNotify(getMessage('site.cp.settings.action.message.updateEmailFailed'), 'danger');
                        } else {
                            startEmailConfirmation(function () {
                                sendNotify(getMessage('site.cp.settings.action.message.updateEmail'), 'success');
                                location.reload();
                            }, function () {
                                sendNotify(getMessage('site.cp.settings.action.message.updateEmailFailed'), 'danger');
                            });
                        }
                    }).fail(function (err) {
                        sendNotify(getMessage('site.cp.settings.action.message.updateEmailFailed'), 'danger');
                    });
                }, function () {
                    document.getElementById('updateEmail').disabled = false;
                    sendNotify(getMessage('site.cp.settings.action.message.updateEmailFailed'), 'danger');
                });
            } else {
                sendNotify(getMessage('site.cp.settings.action.message.updateEmail'), 'success');
                location.reload();
            }
        } else {
            document.getElementById('updateEmail').disabled = false;
            sendNotify(getMessage('site.cp.settings.action.message.updateEmailFailed'), 'danger');
        }
    }).fail(function (err) {
        document.getElementById('updateEmail').disabled = false;
        sendNotify(getMessage('site.cp.settings.action.message.updateEmailFailed'), 'danger');
    });
}

document.getElementById('updateEmail').addEventListener('click', function () {
    document.getElementById('updateEmail').disabled = true;
    updateEmail();
});


function updatePassword() {
    var password = $('#newPassword').val();
    var oldPassword = $('#oldPassword').val();
    $.ajax({
        url: apiURL + '/user/settings/general/password',
        type: 'patch',
        data: {
            old_password: oldPassword,
            new_password: password
        },
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        }
    }).done(function (answer) {
        if (answer.success === true) {
            if (answer.response.requireSessionCode === true) {
                startTwoFactorConfirmation(answer.response.sessionCode, function () {
                    $.ajax({
                        url: apiURL + '/user/settings/general/password',
                        type: 'patch',
                        data: {
                            old_password: oldPassword,
                            new_password: password,
                            sessionCode: answer.response.sessionCode
                        },
                        beforeSend: function (xhr) {
                            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
                        }
                    }).done(function (answer) {
                        document.getElementById('updatePassword').disabled = false;
                        if (answer.success === false) {
                            if (answer.response.error_message = "passwordWrong") {
                                sendNotify(getMessage('site.cp.settings.action.message.updatePasswordWrong'), 'danger');
                            } else {
                                sendNotify(getMessage('site.cp.settings.action.message.updatePasswordFailed'), 'danger');
                            }
                        } else {
                            sendNotify(getMessage('site.cp.settings.action.message.updatePassword'), 'success');
                            location.reload();
                        }
                    }).fail(function (err) {
                        document.getElementById('updatePassword').disabled = false;
                        if (err.responseJSON.response.error_message = "passwordWrong") {
                            sendNotify(getMessage('site.cp.settings.action.message.updatePasswordWrong'), 'danger');
                        } else {
                            sendNotify(getMessage('site.cp.settings.action.message.updatePasswordFailed'), 'danger');
                        }
                    });
                }, function () {
                    document.getElementById('updatePassword').disabled = false;
                    sendNotify(getMessage('site.cp.settings.action.message.updatePasswordFailed'), 'danger');
                });
            } else {
                sendNotify(getMessage('site.cp.settings.action.message.updatePassword'), 'success');
                location.reload();
            }
        } else {
            document.getElementById('updatePassword').disabled = false;
            if (answer.response.error_message = "passwordWrong") {
                sendNotify(getMessage('site.cp.settings.action.message.updatePasswordWrong'), 'danger');
            } else {
                sendNotify(getMessage('site.cp.settings.action.message.updatePasswordFailed'), 'danger');
            }
        }
    }).fail(function (err) {
        document.getElementById('updatePassword').disabled = false;
        if (err.responseJSON.response.error_message = "passwordWrong") {
            sendNotify(getMessage('site.cp.settings.action.message.updatePasswordWrong'), 'danger');
        } else {
            sendNotify(getMessage('site.cp.settings.action.message.updatePasswordFailed'), 'danger');
        }
    });
}

document.getElementById('updatePassword').addEventListener('click', function () {
    document.getElementById('updatePassword').disabled = true;
    updatePassword();
});

function deleteAccount() {
    $.ajax({
        url: apiURL + '/user/settings/general/deleteAccount',
        type: 'delete',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        },
    }).done(function (answer) {
        if (answer.success === true) {
            if (answer.response.requireSessionCode === true) {
                $('.modal').modal('hide');
                startTwoFactorConfirmation(answer.response.sessionCode, function () {
                    $.ajax({
                        data: {sessionCode: answer.response.sessionCode},
                        url: apiURL + '/user/settings/general/deleteAccount',
                        type: 'delete',
                        beforeSend: function (xhr) {
                            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
                        },
                    }).done(function (answer) {
                        document.getElementById('deleteAccountSubmit').disabled = false;
                        if (answer.success === false) {
                            sendNotify(getMessage('site.cp.settings.action.message.deleteAccountFailed'), 'danger');
                        } else {
                            location.reload();
                        }
                    }).fail(function (err) {
                        sendNotify(getMessage('site.cp.settings.action.message.deleteAccountFailed'), 'danger');
                    });
                }, function () {
                    document.getElementById('deleteAccountSubmit').disabled = false;
                    sendNotify(getMessage('site.cp.settings.action.message.deleteAccountFailed'), 'danger');
                });
            } else {
                location.reload();
            }
        } else {
            document.getElementById('deleteAccountSubmit').disabled = false;
            sendNotify(getMessage('site.cp.settings.action.message.deleteAccountFailed'), 'danger');
        }
    }).fail(function (err) {
        document.getElementById('deleteAccountSubmit').disabled = false;
        sendNotify(getMessage('site.cp.settings.action.message.deleteAccountFailed'), 'danger');
    });
}

if(document.getElementById('deleteAccountSubmit') !== null) {
    document.getElementById('deleteAccountSubmit').addEventListener('click', function () {
        document.getElementById('deleteAccountSubmit').disabled = true;
        deleteAccount();
    });
}