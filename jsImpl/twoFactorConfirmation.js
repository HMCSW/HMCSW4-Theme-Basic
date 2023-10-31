
var {startAuthentication, browserSupportsWebAuthn, browserSupportsWebAuthnAutofill, platformAuthenticatorIsAvailable, startRegistration} = SimpleWebAuthnBrowser
window.addEventListener('load', async event => {
    initTwoFactorConfirmation();
    initEmailConfirmation();
});

function startTwoFactorConfirmation(sessionCode, successCallback, failedCallback, autoSelectFido = true) {
    var event = new CustomEvent('TwoFactorConfirmationEvent', {detail: {sessionCode: sessionCode, successCallback: successCallback, failedCallback: failedCallback, autoSelectFido: autoSelectFido }});
    document.dispatchEvent(event);
}
async function initTwoFactorConfirmation() {
    document.addEventListener("TwoFactorConfirmationEvent", e => {
        let done = false;
        let sessionCodeSave;
        let twoFactorConfirmationModalExample = $('#twoFactorConfirmation');

        let twoFactorConfirmationModal = twoFactorConfirmationModalExample.clone();
        let codeLoader = twoFactorConfirmationModal.find('.code-loader');
        let codeFormMask = twoFactorConfirmationModal.find('.code-form-mask');
        let codeInput = codeFormMask.find('.code-input');
        let codeSubmitBtn = codeFormMask.find('.codeSubmitBtn');
        let selectOtherMethodBtn = codeFormMask.find('.selectOtherMethodBtn');

        let enterCodeMask = twoFactorConfirmationModal.find('.enterCodeMask');
        let selectMethodMask = twoFactorConfirmationModal.find('.selectMethodMask');
        let noMethodMask = selectMethodMask.find('.noMethodMask');
        let fidoMask = twoFactorConfirmationModal.find('.fidoMask');
        let fidoFailMessage = fidoMask.find('.fidoFailMessage');
        let fidoFailMessageFailed = fidoFailMessage.find('.failed');
        let fidoFailMessageNotSupported = fidoFailMessage.find('.notSupported');
        let fidoRetryBtn = fidoFailMessage.find('.fidoRetry');
        let fidoOtherMethodBtn = fidoMask.find('.fidoOtherMethodBtn');

        let startLoader = twoFactorConfirmationModal.find('.start-loader');
        let methods = [];
        let exampleMethodCheck = twoFactorConfirmationModal.find('.exampleMethodCheck');
        let allMethods = twoFactorConfirmationModal.find('.allMethods');
        let selectMethodBtn = twoFactorConfirmationModal.find('.selectMethodBtn');
        let autoSelectFido = e.detail.autoSelectFido;

        twoFactorConfirmationModal.on('hidden.bs.modal', function (e) {
            if(!done){
                fail();
            }
        })
        selectMethodBtn.on('click', function (e) {
            selectMethod(getSelectedMethod());
        });
        codeSubmitBtn.on('click', function (e) {
            submitCode(codeInput.val());
        });
        selectOtherMethodBtn.on('click', function (e) {
            startSelectMethod();
        });
        fidoRetryBtn.on('click', function (e) {
            startFido2Login();
        });
        fidoOtherMethodBtn.on('click', function (e) {
            startSelectMethod();
        });

        startTwoFactor(e.detail.sessionCode);

        function submitCode(code){
            codeFormMask.hide();
            codeLoader.show();
            $.ajax({
                type: "PATCH",
                url: apiURL + "/auth/login/twoFactor/twoFactor",
                data: {sessionCode: sessionCodeSave, method: currentMethod, code: code}
            }).done(function (answer) {
                codeFormMask.show();
                codeLoader.hide();
                if (answer.success) {
                    success();
                } else {
                    sendNotify(getMessage("site.auth.action.message.factorCodeWrong"), "danger");
                }
            }).fail(function (err) {
                codeFormMask.show();
                codeLoader.hide();
                sendNotify(getMessage("site.auth.action.message.factorCodeWrong"), "danger");
            });
        }

        function getSelectedMethod() {
            return allMethods.find('input[name="method"]:checked').val();
        }

        function sendTwoFactor(method) {
            return $.ajax({
                type: "POST",
                url: apiURL + "/auth/login/twoFactor/twoFactor",
                data: {sessionCode: sessionCodeSave, type: method}
            });
        }



        function selectMethod(method) {
            if(method === "fido2") {
                fido2Site(methods.length > 1);
            } else {
                enterCodeMask.show();
                selectMethodMask.hide();
                codeLoader.show();

                sendTwoFactor(method).done(function (answer) {
                    codeLoader.hide();
                    if (answer.success === true) {
                        currentMethod = method;
                        codeFormMask.show();
                    } else {
                        startSelectMethod();
                        sendNotify(getMessage("general.action.message.failed"), "danger")
                    }
                }).fail(function (err) {
                    sendNotify(getMessage("general.action.message.failed"), "danger")
                    startSelectMethod();
                });
            }
        }


        function fido2Site(otherMethodsAvailable = false) {
            selectMethodMask.hide();

            fidoMask.show();
            fidoFailMessage.hide();
            fidoOtherMethodBtn.hide();
            if(otherMethodsAvailable){
                fidoOtherMethodBtn.show();
            }

            if (!browserSupportsWebAuthn()) {
                fidoFailMessage.show();
                fidoFailMessageNotSupported.show();
                return;
            }


            startFido2Login();
        }

        function startFido2Login() {
            fidoFailMessage.hide();
            fidoFailMessageNotSupported.hide();
            fidoOtherMethodBtn.attr('disabled', true)

            $.ajax({
                type: 'POST',
                url: apiURL + '/auth/fido2/login/option',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "Bearer " + sessionCodeSave);
                }
            }).done(function (answer) {
                if(answer.success) {
                    startAuthentication(answer.response).then(function (assertion) {
                        $.ajax({
                            type: 'POST',
                            url: apiURL + '/auth/fido2/login',
                            data: JSON.stringify(assertion),
                            beforeSend: function (xhr) {
                                xhr.setRequestHeader("Authorization", "Bearer " + sessionCodeSave);
                            }
                        }).done(async function (answer) {
                            if (answer.success) {
                                success();
                            } else {
                                fidoOtherMethodBtn.attr('disabled', false)
                                sendNotify(getMessage("general.action.message.failed") + ": " + answer.response.error_message, "danger");
                                fidoFailMessage.show();
                                fidoFailMessageFailed.show();
                            }
                        }).fail(function (error) {
                            fidoOtherMethodBtn.attr('disabled', false)
                            fidoFailMessage.show();
                            fidoFailMessageFailed.show();
                            sendNotify(getMessage("general.action.message.failed") + ": " + error.message, "danger");
                        });
                    }).catch(function (error) {
                        fidoOtherMethodBtn.attr('disabled', false)
                        fidoFailMessage.show();
                        fidoFailMessageFailed.show();
                        sendNotify(getMessage("general.action.message.failed") + ": " + error.message, "danger");
                    });
                } else {
                    fidoOtherMethodBtn.attr('disabled', false)
                    fidoFailMessage.show();
                    fidoFailMessageFailed.show();
                    sendNotify(getMessage("general.action.message.failed") + ": " + answer.response.error_message, "danger");
                }
            }).fail(function (error) {
                fidoOtherMethodBtn.attr('disabled', false)
                fidoFailMessage.show();
                fidoFailMessageFailed.show();
                sendNotify(getMessage("general.action.message.failed") + ": " + error.message, "danger");
            });
        }

        function success(){
            done = true;
            e.detail.successCallback();
            twoFactorConfirmationModal.modal('hide');
            twoFactorConfirmationModal.remove();
        }

        function fail(){
            done = true;
            e.detail.failedCallback();
            twoFactorConfirmationModal.modal('hide');
            twoFactorConfirmationModal.remove();
        }

        function startSelectMethod(){
            enterCodeMask.hide();
            fidoMask.hide();
            fidoFailMessage.hide();
            fidoOtherMethodBtn.hide();

            selectMethodMask.show();
            allMethods.show();
            selectMethodBtn.show();
        }

        function init(methods) {
            startLoader.hide();

            if(methods.length === 0){
                noMethodMask.show();
                selectMethodBtn.hide();
                selectMethodMask.show();
                return;
            }

            for (let i = 0; i < methods.length; i++) {
                addMethod(methods[i]);
            }


            if(autoSelectFido){
                let fido = methods.indexOf('fido2');
                if(fido !== -1){
                    selectMethod('fido2');
                    return;
                }
            }
            startSelectMethod();
        }

        function addMethod(method) {
            methods = methods.concat(method);

            let copy = exampleMethodCheck.clone();
            copy.show();
            copy.find(".methodInput").val(method);
            copy.find(".methodInput").attr('name', "method");
            copy.find(".methodLabel").text(getMessage('site.auth.twoFactor.type.' + method));

            allMethods.append(copy);
        }

        function startTwoFactor(sessionCode) {
            twoFactorConfirmationModal.modal('show', {backdrop: 'static', keyboard: false, focus: true});
            startLoader.show();

            sessionCodeSave = sessionCode;
            $.ajax({
                data: {sessionCode: sessionCode},
                type: 'POST',
                url: apiURL + '/auth/login/twoFactor/methods'
            }).done(function (answer) {
                if (answer.success === false) {
                    fail();
                    return;
                }
                if (answer.response.ready === false) {
                    fail();
                    return;
                }

                init(answer.response.types);
            }).fail(function (err) {
                fail();
            });
        }
    });

}



function startEmailConfirmation(successCallback, failedCallback) {
    var event = new CustomEvent('EmailConfirmationEvent', {detail: {successCallback: successCallback, failedCallback: failedCallback }});
    document.dispatchEvent(event);
}

function initEmailConfirmation() {
    document.addEventListener("EmailConfirmationEvent", e => {
        let modal = $('#emailVerification');
        modal.modal('show', {backdrop: 'static', keyboard: false, focus: true});
        document.getElementById("emailConfirmationResendBtn").removeAttribute("disabled");
        document.getElementById("emailConfirmationSubmitBtn").removeAttribute("disabled");


        function done(){
            modal.modal('hide');
            document.getElementById("emailConfirmationSubmitBtn").removeEventListener("click", submit);
            document.getElementById("emailConfirmationResendBtn").removeEventListener("click", resend);
            document.getElementById("emailConfirmationResendBtn").removeAttribute("disabled");

            e.detail.successCallback();
        }

        if(document.getElementById("emailConfirmationResendBtn") !== null) {
            document.getElementById("emailConfirmationResendBtn").addEventListener("click", resend);
        }

        if(document.getElementById("emailConfirmationSubmitBtn") !== null) {
            document.getElementById("emailConfirmationSubmitBtn").addEventListener("click", submit);
        }

        function submit() {
            document.getElementById("emailConfirmationSubmitBtn").setAttribute("disabled", "true")
            let value = document.getElementById("emailConfirmationCode").value;
            $.ajax({
                type: "POST",
                url: apiURL + "/user/settings/general/email/verify",
                data: {code: value},
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "Bearer " + accessToken);
                }
            }).done(function (answer) {
                if (answer.success) {
                    done();
                } else {
                    sendNotify(getMessage("general.action.message.failed"), "danger");
                    document.getElementById("emailConfirmationSubmitBtn").removeAttribute("disabled");
                }
            }).fail(function (err) {
                sendNotify(getMessage("general.action.message.failed"), "danger");
                document.getElementById("emailConfirmationSubmitBtn").removeAttribute("disabled");
            });
        }


        function resend() {
            document.getElementById("emailConfirmationResendBtn").setAttribute("disabled", "true");
            $.ajax({
                type: "POST",
                url: apiURL + "/user/settings/general/email/resendCode",
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "Bearer " + accessToken);
                }
            }).done(function (answer) {
                if (answer.success) {
                    sendNotify(getMessage("general.action.message.success"), "success");
                } else {
                    sendNotify(getMessage("general.action.message.failed"), "danger");
                }
            }).fail(function (err) {
                sendNotify(getMessage("general.action.message.failed"), "danger");
            });
        }

    });

}
