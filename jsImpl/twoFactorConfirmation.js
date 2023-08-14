window.addEventListener('load', async event => {
    await import(url + '/assets/js/simpleWebauthn/index.umd.min.js');
    initTwoFactorConfirmation();
});
function startTwoFactorConfirmation(sessionCode, successCallback, failedCallback) {
    var event = new CustomEvent('TwoFactorConfirmationEvent', {detail: {sessionCode: sessionCode, successCallback: successCallback, failedCallback: failedCallback }});
    document.dispatchEvent(event);
}
async function initTwoFactorConfirmation() {
    var sessionCodeSave;
    let modal = $('#twoFactorConfirmation');

    document.addEventListener("TwoFactorConfirmationEvent", e => {
        const {startAuthentication, browserSupportsWebAuthn} = SimpleWebAuthnBrowser;
        startTwoFactor(e.detail.sessionCode);

        function done(){
            modal.off();
            modal.modal('hide');
            e.detail.successCallback();
        }

        function fail(){
            modal.off();
            modal.modal('hide');
            e.detail.failedCallback();
        }

        function startTwoFactor(sessionCode) {
            sessionCodeSave = sessionCode;
            $.ajax({
                data: {'sessionCode': sessionCode},
                type: 'POST',
                url: apiURL + '/auth/login/twoFactor/methods'
            }).done(function (answer) {
                if (answer.success === false) {
                    done();
                    return;
                }
                if (answer.response.ready === false) {
                    done();
                    return;
                }
                $('.modal').modal('hide');
                modal.modal('show', {backdrop: 'static', keyboard: false, focus: true});

                modal.on('hidden.bs.modal', function (e) {
                    fail();
                })
                init(answer.response.types);
            }).fail(function (err) {
                fail();
            });
        }

        async function startFido2Login() {
            document.getElementById('fidoFailMessage').style = "display:none";

            const resp = await fetch(apiURL + "/auth/fido2/login/option", {
                method: 'POST', headers: {
                    'Authorization': 'Bearer ' + sessionCodeSave,
                }
            });

            let asseResp;
            try {
                asseResp = await startAuthentication(await resp.json());

                const verificationResp = await fetch(apiURL + "/auth/fido2/login", {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + sessionCodeSave,
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(asseResp),
                });

                const verificationJSON = await verificationResp.json();

                if (verificationJSON && verificationJSON.success) {
                    done();
                } else {
                    fidoFail();
                    sendNotify(getMessage("general.action.message.failed") + ": " + verificationJSON.response.error_message, "danger");
                }
            } catch (error) {
                fidoFail();
                sendNotify(getMessage("general.action.message.failed") + ": " + error.message, "danger");
            }

        }

        var fidoAvailable = false;
        var methods = {};
        var currentMethod;

        function init(methods) {
            resetMethods();

            document.getElementById('selectMethod').style = "display:block";
            document.getElementById('allMethodsLoader').style = "display:block";

            for (let i = 0; i < methods.length; i++) {
                addMethod(methods[i]);
            }
            let methodsCount = methods.length;

            if (methodsCount === 0) {
                document.getElementById('noMethod').style = "display:block";
                document.getElementById('allMethodsLoader').style = "display:none";
            } else {
                document.getElementById('allMethodsLoader').style = "display:none";
                if (fidoAvailable) {
                    fido2Site(methodsCount > 1);
                } else {
                    startSelectProcess();
                }
            }

        }

        function fidoFail() {
            document.getElementById("cancelFido").removeAttribute("disabled");
            document.getElementById('fidoFailMessage').style = "display:block";

            document.getElementById('fidoFailBtn').addEventListener('click', fidoRetry);
        }

        function fidoRetry() {
            document.getElementById('fidoFailBtn').removeEventListener('click', fidoRetry);
            document.getElementById('fidoFailMessage').style = "display:none";
            document.getElementById("cancelFido").setAttribute("disabled", "true");
            startFido2Login();
        }

        function fido2Site(otherMethodsAvailable = false) {
            document.getElementById("code-loader").style = "display:none";
            document.getElementById("code-form").style = "display:none";
            document.getElementById("enterCode").style = "display:none";
            document.getElementById("allMethods").style = "display:none";
            document.getElementById("selectBTN").style = "display:none";
            document.getElementById("cancelFido").style = "display:none";

            document.getElementById("selectMethod").style = "display:block";
            document.getElementById("fidoInfo").style = "display:block";
            document.getElementById("cancelFido").setAttribute("disabled", "true");
            if (otherMethodsAvailable) {
                document.getElementById("cancelFido").style = "display:block";
                document.getElementById("cancelFido").addEventListener("click", cancelFido);
            }

            startFido2Login();
        }

        function cancelFido() {
            document.getElementById("cancelFido").removeEventListener("click", cancelFido);
            document.getElementById("fidoFailMessage").style = "display:none";
            document.getElementById("fidoInfo").style = "display:none";

            startSelectProcess();
        }

        function startSelectProcess(fido = false) {
            document.getElementById("allMethods").style = "display:block";
            document.getElementById("selectBTN").style = "display:block";

            document.getElementById("enterCode").style = "display:none"
            document.getElementById("selectMethod").style = "display:block";

            let option = document.getElementById("fidoOption");
            if (typeof (option) != 'undefined' && option != null) {
                if (fido) {
                    option.style = "display:block";
                } else {
                    option.style = "display:none";
                }
            }

            document.getElementById("selectBTN").addEventListener("click", selectBTN);
        }

        function submitCode() {
            let value = document.getElementById("code").value;
            if (value.length > 0) {
                $.ajax({
                    type: "PATCH",
                    url: apiURL + "/auth/login/twoFactor/twoFactor",
                    data: {sessionCode: sessionCodeSave, method: currentMethod, code: value}
                }).done(function (answer) {
                    if (answer.success) {
                        document.getElementById("code-loader").style = "display:block";
                        document.getElementById("code-form").style = "display:none";

                        done();
                    } else {
                        sendNotify(getMessage("site.auth.action.message.factorCodeWrong"), "danger");
                    }
                }).fail(function (err) {
                    sendNotify(getMessage("site.auth.action.message.factorCodeWrong"), "danger");
                });
            }
        }

        function submitCodeEmptyCheck() {
            let code = document.getElementById("code");
            let value = code.value;

            document.getElementById("submit-code").addEventListener("click", submitCode);
            if (value.length <= 0) {
                document.getElementById("submit-code").setAttribute("disabled", "true");
            } else {
                document.getElementById("submit-code").removeAttribute("disabled");
            }
        }

        function selectBTN() {
            document.getElementById("selectBTN").removeEventListener("click", selectBTN);
            let selectedMethod = getSelectedMethod();
            if (selectedMethod !== undefined) {
                document.getElementById("enterCode").style = "display:block"
                document.getElementById("selectMethod").style = "display:none";

                document.getElementById("selectOtherMethod").addEventListener("click", selectOtherMethod);
                document.getElementById("submit-code").setAttribute("disabled", "true");

                document.getElementById("code-loader").style = "display:block";
                document.getElementById("code-form").style = "display:none";

                if (selectedMethod === "fido2") {
                    fido2Site(true);
                } else {
                    setMethod(selectedMethod).done(function (answer) {
                        document.getElementById("code-loader").style = "display:none";
                        document.getElementById("code-form").style = "display:block";
                        currentMethod = selectedMethod;

                        document.getElementById("code").focus({preventScroll: true, focusVisible: true});
                        document.getElementById("code").addEventListener('input', submitCodeEmptyCheck);
                    }).fail(function (err) {
                        sendNotify(getMessage("general.action.message.failed"), "danger")
                        document.getElementById("enterCode").style = "display:none"
                        document.getElementById("code-loader").style = "display:none";
                        document.getElementById("selectMethod").style = "display:block";
                        startSelectProcess(true);
                    });
                }
            }
        }

        function selectOtherMethod() {
            document.getElementById("selectOtherMethod").removeEventListener("click", selectBTN);
            document.getElementById("code").removeEventListener('change', submitCodeEmptyCheck);
            document.getElementById("submit-code").removeEventListener("click", submitCode);
            startSelectProcess(true);
        }

        function getSelectedMethod() {
            const radioButtons = document.querySelectorAll('input[name="method"]');
            let selected;
            for (const radioButton of radioButtons) {
                if (radioButton.checked) {
                    selected = radioButton.value;
                    break;
                }
            }
            return selected;
        }

        function resetMethods(){
            document.getElementById('allMethods').innerHTML = "";
        }

        function addMethod(method) {
            if (method === "fido2") {
                if (browserSupportsWebAuthn) {
                    fidoAvailable = true;
                }
            }
            var example = document.getElementById('exampleMethodCheck').cloneNode(true);
            example.removeAttribute("style");
            example.removeAttribute("id")

            example.children[0].id = method;
            example.children[0].value = method;
            example.children[0].name = "method";
            example.children[1].innerHTML = getMessage('site.auth.twoFactor.type.' + method);
            example.children[1].setAttribute("for", method);
            if (method === "fido2") {
                example.style = "display:none";
                example.id = "fidoOption";
            }

            document.getElementById('allMethods').appendChild(example);
        }

        function setMethod(method) {
            return $.ajax({
                type: "POST",
                url: apiURL + "/auth/login/twoFactor/twoFactor",
                data: {sessionCode: sessionCodeSave, type: method}
            });
        }

    }, false);
}