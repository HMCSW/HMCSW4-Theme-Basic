const {startAuthentication, browserSupportsWebAuthn} = SimpleWebAuthnBrowser;
//
async function startFido2LoginTwoFactor() {
    document.getElementById('fidoFailMessage').style = "display:none";

    const resp = await fetch(apiURL + "/auth/fido2/login/option", {method: 'POST', headers: {
            'Authorization': 'Bearer ' + sessionCode,
        }});

    let asseResp;
    try {
        asseResp = await startAuthentication(await resp.json());

        const verificationResp = await fetch(apiURL + "/auth/fido2/login", {
            method: 'POST',
            headers: {
                'Authorization': 'Bearer ' + sessionCode,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(asseResp),
        });

        const verificationJSON = await verificationResp.json();

        if (verificationJSON && verificationJSON.success) {
            generateTokenTwoFactor(sessionCode);
        } else {
            fidoFailTwoFactor();
            sendNotify(getMessage("general.action.message.failed") + ": "+ verificationJSON.response.error_message, "danger");
        }
    } catch (error) {
        fidoFailTwoFactor();
        sendNotify(getMessage("general.action.message.failed") + ": " + error.message, "danger");
    }

}

window.addEventListener('load', async event => {
    await import(url + '/assets/js/simpleWebauthn/index.umd.min.js');
    initTwoFactor();
});

var fidoAvailable = false;
var methods = {};
var currentMethod;

function initTwoFactor() {
    document.getElementById('selectMethod-twofactor').style = "display:block";
    document.getElementById('allMethodsLoader-twofactor').style = "display:block";

    getMethodsTwoFactor().done(function (answer) {
        if (answer.success) {
            if (answer.response.types.length > 0) {
                for (let i = 0; i < answer.response.types.length; i++) {
                    addMethodTwoFactor(answer.response.types[i]);
                }
                methods = answer.response.types;
                let methodsCount = methods.length;

                if(methodsCount === 0){
                    document.getElementById('noMethod-twofactor').style = "display:block";
                    document.getElementById('allMethodsLoader-twofactor').style = "display:none";
                } else {
                    document.getElementById('allMethodsLoader-twofactor').style = "display:none";
                    if(fidoAvailable){
                        fido2SiteTwoFactor(methodsCount > 1);
                    } else {
                        startSelectProcessTwoFactor();
                    }
                }
            } else {
                document.getElementById('noMethod-twofactor').style = "display:block";
                document.getElementById('allMethodsLoader-twofactor').style = "display:none";
            }
        }
    }).fail(function (err) {
        document.getElementById('noMethod-twofactor').style = "display:block";
        document.getElementById('allMethodsLoader-twofactor').style = "display:none";
    })

}

function fidoFailTwoFactor(){
    document.getElementById("cancelFido-twofactor").removeAttribute("disabled");
    document.getElementById('fidoFailMessage-twofactor').style = "display:block";

    document.getElementById('fidoFailBtn-twofactor').addEventListener('click', fidoRetryTwoFactor);
}

function fidoRetryTwoFactor(){
    document.getElementById('fidoFailBtn-twofactor').removeEventListener('click', fidoRetryTwoFactor);
    document.getElementById('fidoFailMessage-twofactor').style = "display:none";
    document.getElementById("cancelFido-twofactor").setAttribute("disabled", "true");
    startFido2LoginTwoFactor();
}

function fido2SiteTwoFactor(otherMethodsAvailable = false){
    document.getElementById("code-loader-twofactor").style = "display:none";
    document.getElementById("code-form-twofactor").style = "display:none";
    document.getElementById("enterCode-twofactor").style = "display:none";
    document.getElementById("allMethods-twofactor").style = "display:none";
    document.getElementById("selectBTN-twofactor").style = "display:none";
    document.getElementById("cancelFido-twofactor").style = "display:none";

    document.getElementById("selectMethod-twofactor").style = "display:block";
    document.getElementById("fidoInfo-twofactor").style = "display:block";
    document.getElementById("cancelFido-twofactor").setAttribute("disabled", "true");
    if(otherMethodsAvailable){
        document.getElementById("cancelFido-twofactor").style = "display:block";
        document.getElementById("cancelFido-twofactor").addEventListener("click", cancelFidoTwoFactor);
    }

    startFido2LoginTwoFactor();
}

function cancelFidoTwoFactor(){
    document.getElementById("cancelFido-twofactor").removeEventListener("click", cancelFidoTwoFactor);
    document.getElementById("fidoFailMessage-twofactor").style = "display:none";
    document.getElementById("fidoInfo-twofactor").style = "display:none";

    startSelectProcessTwoFactor();
}

function startSelectProcessTwoFactor(fido = false){
    document.getElementById("allMethods-twofactor").style = "display:block";
    document.getElementById("selectBTN-twofactor").style = "display:block";

    document.getElementById("enterCode-twofactor").style = "display:none"
    document.getElementById("selectMethod-twofactor").style = "display:block";

    let option = document.getElementById("fidoOption-twofactor");
    if(typeof(option) != 'undefined' && option != null) {
        if (fido) {
            option.style = "display:block";
        } else {
            option.style = "display:none";
        }
    }

    document.getElementById("selectBTN-twofactor").addEventListener("click", selectBTNTwoFactor);
}

function submitCodeTwoFactor(){
    let value = document.getElementById("code-twofactor").value;
    if(value.length > 0){
        $.ajax({
            type: "PATCH",
            url: apiURL + "/auth/login/twoFactor/twoFactor",
            data: {sessionCode: sessionCode, method: currentMethod, code: value }
        }).done(function (answer) {
            if(answer.success){
                document.getElementById("code-loader-twofactor").style = "display:block";
                document.getElementById("code-form-twofactor").style = "display:none";

                generateTokenTwoFactor(sessionCode);
            } else {
                sendNotify(getMessage("site.auth.action.message.factorCodeWrong"), "danger");
            }
        }).fail(function (err) {
            sendNotify(getMessage("site.auth.action.message.factorCodeWrong"), "danger");
        });
    }
}

function submitCodeEmptyCheckTwoFactor(){
    let code = document.getElementById("code-twofactor");
    let value = code.value;

    document.getElementById("submit-code-twofactor").addEventListener("click", submitCodeTwoFactor);
    if(value.length <= 0){
        document.getElementById("submit-code-twofactor").setAttribute("disabled", "true");
    } else {
        document.getElementById("submit-code-twofactor").removeAttribute("disabled");
    }
}

function selectBTNTwoFactor(){
    document.getElementById("selectBTN").removeEventListener("click", selectBTNTwoFactor);
    let selectedMethod = getSelectedMethodTwoFactor();
    if(selectedMethod !== undefined){
        document.getElementById("enterCode-twofactor").style = "display:block"
        document.getElementById("selectMethod-twofactor").style = "display:none";

        document.getElementById("selectOtherMethod-twofactor").addEventListener("click", selectOtherMethodTwoFactor);
        document.getElementById("submit-code-twofactor").setAttribute("disabled", "true");

        document.getElementById("code-loader-twofactor").style = "display:block";
        document.getElementById("code-form-twofactor").style = "display:none";

        if(selectedMethod === "fido2"){
            fido2SiteTwoFactor(true);
        } else {
            setMethodTwoFactor(selectedMethod).done(function (answer) {
                document.getElementById("code-loader-twofactor").style = "display:none";
                document.getElementById("code-form-twofactor").style = "display:block";
                currentMethod = selectedMethod;

                document.getElementById("code-twofactor").focus({preventScroll: true, focusVisible: true});
                document.getElementById("code-twofactor").addEventListener('input', submitCodeEmptyCheckTwoFactor);
            }).fail(function (err) {
                sendNotify(getMessage("general.action.message.failed"), "danger")
                document.getElementById("enterCode-twofactor").style = "display:none"
                document.getElementById("code-loader-twofactor").style = "display:none";
                document.getElementById("selectMethod-twofactor").style = "display:block";
                startSelectProcessTwoFactor(true);
            });
        }
    }
}

function selectOtherMethodTwoFactor(){
    document.getElementById("selectOtherMethod-twofactor").removeEventListener("click", selectBTNTwoFactor);
    document.getElementById("code-twofactor").removeEventListener('change', submitCodeEmptyCheckTwoFactor);
    document.getElementById("submit-code-twofactor").removeEventListener("click", submitCodeTwoFactor);
    startSelectProcessTwoFactor(true);
}

function getSelectedMethodTwoFactor(){
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

function addMethodTwoFactor(method) {
    if(method === "fido2"){
        if(browserSupportsWebAuthn) {
            fidoAvailable = true;
        }
    }
    example = document.getElementById('exampleMethodCheck-twofactor').cloneNode(true);
    example.removeAttribute("style");
    example.removeAttribute("id")

    example.children[0].id = method;
    example.children[0].value = method;
    example.children[0].name = "method";
    example.children[1].innerHTML = getMessage('site.auth.twoFactor.type.'+method);
    example.children[1].setAttribute("for", method);
    if(method === "fido2"){
        example.style = "display:none";
        example.id = "fidoOption";
    }

    document.getElementById('allMethods-twofactor').appendChild(example);
}

function getMethodsTwoFactor() {
    return $.ajax({
        type: "POST",
        url: apiURL + "/auth/login/twoFactor/methods",
        data: {sessionCode: sessionCode}
    });
}

function setMethodTwoFactor(method){
    return $.ajax({
        type: "POST",
        url: apiURL + "/auth/login/twoFactor/twoFactor",
        data: {sessionCode: sessionCode, type: method}
    });
}


function generateTokenTwoFactor(token){
    $.ajax({
        type: "POST",
        url: apiURL + "/auth/login/generateAccessToken",
        beforeSend: function (xhr) {   //Set token here
            xhr.setRequestHeader("Authorization", "Bearer " + token);
        }
    }).done(function (answer) {
        if(answer.success === true){
            setSession("access_token", answer.response.access_token, false);
            setSession("refresh_token", answer.response.refresh_token, true);
            setSessions(success_url)
        } else {
            sendNotify(answer.response.error_code);
        }
    }).fail(function (err)  {
        sendNotify(getMessage("general.action.message.failed"));
    });
}

var sessionsToSet = [];

function resetSession(){
    sessionsToSet = [];
}
function setSession(name, value, cookie){
    sessionsToSet.push({name: name, value: value, cookie: cookie});
}

function setSessions(url){
    $.ajax({
        type: "POST",
        url: apiURL + "/session",
        data: JSON.stringify({sessions: sessionsToSet, url: url})
    }).done(function (answer) {
        sessionsToSet = {};

        if(answer.success) {
            document.location.href = answer.response.url
        }
    }).fail(function (err)  {
        failed("unknownError");
    });

}