const {startAuthentication, browserSupportsWebAuthn} = SimpleWebAuthnBrowser;
//
async function startFido2Login() {
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
            generateToken(sessionCode);
        } else {
            fidoFail();
            sendNotify(getMessage("general.action.message.failed") + ": "+ verificationJSON.response.error_message, "danger");
        }
    } catch (error) {
        fidoFail();
        sendNotify(getMessage("general.action.message.failed") + ": " + error.message, "danger");
    }

}

window.addEventListener('load', event => {
    init();
});

var fidoAvailable = false;
var methods = {};
var currentMethod;

function init() {
    document.getElementById('selectMethod').style = "display:block";
    document.getElementById('allMethodsLoader').style = "display:block";

    getMethods().done(function (answer) {

        if (answer.success) {
            if (answer.response.types.length > 0) {
                for (let i = 0; i < answer.response.types.length; i++) {
                    addMethod(answer.response.types[i]);
                }
                methods = answer.response.types;
                let methodsCount = methods.length;

                if(methodsCount === 0){
                    document.getElementById('noMethod').style = "display:block";
                    document.getElementById('allMethodsLoader').style = "display:none";
                } else {
                    document.getElementById('allMethodsLoader').style = "display:none";
                    if(fidoAvailable){
                        fido2Site(methodsCount > 1);
                    } else {
                        startSelectProcess();
                    }
                }
            } else {
                document.getElementById('noMethod').style = "display:block";
                document.getElementById('allMethodsLoader').style = "display:none";
            }
        }
    }).fail(function (err) {
        document.getElementById('noMethod').style = "display:block";
        document.getElementById('allMethodsLoader').style = "display:none";
    })

}

function fidoFail(){
    document.getElementById("cancelFido").removeAttribute("disabled");
    document.getElementById('fidoFailMessage').style = "display:block";

    document.getElementById('fidoFailBtn').addEventListener('click', fidoRetry);
}

function fidoRetry(){
    document.getElementById('fidoFailBtn').removeEventListener('click', fidoRetry);
    document.getElementById('fidoFailMessage').style = "display:none";
    document.getElementById("cancelFido").setAttribute("disabled", "true");
    startFido2Login();
}

function fido2Site(otherMethodsAvailable = false){
    document.getElementById("code-loader").style = "display:none";
    document.getElementById("code-form").style = "display:none";
    document.getElementById("enterCode").style = "display:none";
    document.getElementById("allMethods").style = "display:none";
    document.getElementById("selectBTN").style = "display:none";
    document.getElementById("cancelFido").style = "display:none";

    document.getElementById("selectMethod").style = "display:block";
    document.getElementById("fidoInfo").style = "display:block";
    document.getElementById("cancelFido").setAttribute("disabled", "true");
    if(otherMethodsAvailable){
        document.getElementById("cancelFido").style = "display:block";
        document.getElementById("cancelFido").addEventListener("click", cancelFido);
    }

    startFido2Login();
}

function cancelFido(){
    document.getElementById("cancelFido").removeEventListener("click", cancelFido);
    document.getElementById("fidoFailMessage").style = "display:none";
    document.getElementById("fidoInfo").style = "display:none";

    startSelectProcess();
}

function startSelectProcess(fido = false){
    document.getElementById("allMethods").style = "display:block";
    document.getElementById("selectBTN").style = "display:block";

    document.getElementById("enterCode").style = "display:none"
    document.getElementById("selectMethod").style = "display:block";

    let option = document.getElementById("fidoOption");
    if(typeof(option) != 'undefined' && option != null) {
        if (fido) {
            option.style = "display:block";
        } else {
            option.style = "display:none";
        }
    }

    document.getElementById("selectBTN").addEventListener("click", selectBTN);
}

function submitCode(){
    let value = document.getElementById("code").value;
    if(value.length > 0){
         $.ajax({
            type: "PATCH",
            url: apiURL + "/auth/login/twoFactor/twoFactor",
            data: {sessionCode: sessionCode, method: currentMethod, code: value }
        }).done(function (answer) {
            if(answer.success){
                document.getElementById("code-loader").style = "display:block";
                document.getElementById("code-form").style = "display:none";

                generateToken(sessionCode);
            } else {
                sendNotify(getMessage("site.auth.action.message.factorCodeWrong"), "danger");
            }
         }).fail(function (err) {
             sendNotify(getMessage("site.auth.action.message.factorCodeWrong"), "danger");
         });
    }
}

function submitCodeEmptyCheck(){
    let code = document.getElementById("code");
    let value = code.value;

    document.getElementById("submit-code").addEventListener("click", submitCode);
    if(value.length <= 0){
        document.getElementById("submit-code").setAttribute("disabled", "true");
    } else {
        document.getElementById("submit-code").removeAttribute("disabled");
    }
}

function selectBTN(){
    document.getElementById("selectBTN").removeEventListener("click", selectBTN);
    let selectedMethod = getSelectedMethod();
    if(selectedMethod !== undefined){
        document.getElementById("enterCode").style = "display:block"
        document.getElementById("selectMethod").style = "display:none";

        document.getElementById("selectOtherMethod").addEventListener("click", selectOtherMethod);
        document.getElementById("submit-code").setAttribute("disabled", "true");

        document.getElementById("code-loader").style = "display:block";
        document.getElementById("code-form").style = "display:none";

        if(selectedMethod === "fido2"){
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

function selectOtherMethod(){
    document.getElementById("selectOtherMethod").removeEventListener("click", selectBTN);
    document.getElementById("code").removeEventListener('change', submitCodeEmptyCheck);
    document.getElementById("submit-code").removeEventListener("click", submitCode);
    startSelectProcess(true);
}

function getSelectedMethod(){
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

function addMethod(method) {
    if(method === "fido2"){
        if(browserSupportsWebAuthn) {
            fidoAvailable = true;
        }
    }
    example = document.getElementById('exampleMethodCheck').cloneNode(true);
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

    document.getElementById('allMethods').appendChild(example);
}

function getMethods() {
    return $.ajax({
        type: "POST",
        url: apiURL + "/auth/login/twoFactor/methods",
        data: {sessionCode: sessionCode}
    });
}

function setMethod(method){
    return $.ajax({
        type: "POST",
        url: apiURL + "/auth/login/twoFactor/twoFactor",
        data: {sessionCode: sessionCode, type: method}
    });
}


function generateToken(token){
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
            failed(answer.response.error_code);
        }
    }).fail(function (err)  {
        failed(getMessage("general.action.message.failed"));
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
        data: {sessions: sessionsToSet, url: url}
    }).done(function (answer) {
        sessionsToSet = {};

        if(answer.success) {
            document.location.href = answer.response.url
        }
    }).fail(function (err)  {
        failed("unknownError");
    });

}