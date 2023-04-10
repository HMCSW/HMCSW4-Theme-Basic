var {startAuthentication, browserSupportsWebAuthnAutofill, browserSupportsWebAuthn } = SimpleWebAuthnBrowser;
var passwordLessLoginResp;

var autoFillIsGeneralFailed = false;

fetch(apiURL + "/auth/fido2/passwordLess/option", {method: 'POST'}).then(resp => init(resp.json()));

if(browserSupportsWebAuthn){
    document.getElementById("webauthn").style = "display: block";
}

function autoLogin(){
    navigator.credentials.get({
        password: true,
        federated: {
            providers: [url]
        }
    }).then(function(cred) {
        if(cred === null) {
            // do nothing
        } else if(cred.type === "password"){
            if (cred) {
                login(cred.id, cred.password);
            }
        }
    });
}
autoLogin();

async function init(resp) {
    passwordLessLoginResp = await resp;

    if(browserSupportsWebAuthnAutofill && !autoFillIsGeneralFailed && browserSupportsWebAuthn) {
        let webauthnAutofillAuth;
        try {
            webauthnAutofillAuth = await startAuthentication(passwordLessLoginResp, true);
            const verificationResp = await fetch(apiURL + "/auth/fido2/passwordLess", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(webauthnAutofillAuth),
            });

            // Wait for the results of verification
            const verificationJSON = await verificationResp.json();

            // Show UI appropriate for the `verified` status
            if (verificationJSON && verificationJSON.success) {
                generateToken(verificationJSON.response.loginInfo.auth_code);
            } else {
                sendNotify("Autofill: " + getMessage("general.action.message.failed") + ": " + verificationJSON.response.error_message, "danger");
            }

        } catch (error) {
            if(error.message === "Operation failed." || error.message === "Aborted by AbortSignal." || error.message === "Browser does not support WebAuthn autofill") {
                autoFillIsGeneralFailed = true;
            } else if (error !== "Cancelling existing WebAuthn API call for new one") {
                sendNotify("Autofill: " + getMessage("general.action.message.failed") + ": " + error.message, "danger");
            }
        }
    }
}

function send(){
    form.style = "display: none";
    loader.style = "display: block";
}
function cancel(){
    loader.style = "display: none";
    form.style = "display: block";
    grecaptcha.reset();
}

function failed(message){
    resetSession();
    sendNotify(message, "danger")
    cancel();
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

function isCaptchaChecked() {
    return grecaptcha && grecaptcha.getResponse().length !== 0;
}
function onSiteLogin(){
    if(!isCaptchaChecked){
        return false;
    }

    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;

    $.ajax({
        data: {'response': grecaptcha.getResponse()},
        type: 'POST',
        url: apiURL + '/auth/captcha'
    }).done(function (answer) {
        login(username, password);
    }).fail(function (err)  {
        grecaptcha.reset();
    });

}

function login(username, password){
    send();
    $.ajax({
        type: "POST",
        url: apiURL + "/auth/login",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
        }
    }).done(function (answer) {

        if(answer.success === true){
            if(document.getElementById('remember_login').checked){
                setSession("refresh_token", answer.response.refresh_token, true);
            }
            if(answer.response.twoFactor.ready === false){
                generateToken(answer.response.auth_code);
            } else {
                setSession("twoFactor_type", "", false);
                setSession("twoFactor_session-code", answer.response.auth_code, false);
                setSession("twoFactor_types", answer.response.twoFactor.types, false);
                setSession("twoFactor_userId", answer.response.user_id, false);
                setSession("twoFactor_refreshToken", true, false);

                setSessions(successToFactor_url);
            }
            cancel();
        } else {
            failed("site.auth.action.message." + answer.response.error_code);
            cancel();
        }
    }).fail(function (err)  {
        if(err.responseJSON.response.error_code != null) {
            failed(getMessage("site.auth.action.message." + err.responseJSON.response.error_code));
        } else {
            failed(getMessage("general.action.message.failed"));
        }
        cancel();
    });
}
import(url + '/assets/js/qrCode/qr-scanner.min.js').then((module) => {
    const QrScanner = module.default;
    if(QrScanner.hasCamera()){
        document.getElementById('createQRCode').style = 'display: block';
    }

// QR-CODE LOGIN

    var loginForm = document.getElementById("loginForm");
    var qrCodeForm = document.getElementById("qrCodeForm");

    $("#createQRCode").click(function () {
        loginForm.style = "display: none";
        qrCodeForm.style = "display: block";
        createQRCode();
    });

    document.getElementById("qrLogin-btn-cancelFull").addEventListener("click", function () {
       cancelLoginFull();
    });

    document.getElementById("qrLogin-btn").addEventListener("click", function () {
       cancelLogin();
    });

    function cancelLoginFull(){
        loginForm.style = "display: block";
        qrCodeForm.style = "display: none";

        clearInterval(checkCodeInterval);
        clearInterval(qrCodeResetInterval);
        codeScannedByClient = false;
        qrCodeFormLoader.style = "display: none";
        document.getElementById("qrCodeFormUserInfo").style = "display: none";


        qrCodeFormIMG = document.getElementById("qrCodeFormIMG");
        if (typeof (qrCodeFormIMG) != "undefined" && qrCodeFormIMG != null) {
            qrCodeFormIMG.parentNode.removeChild(qrCodeFormIMG)
        }
    }

    function cancelLogin() {
        clearInterval(checkCodeInterval);
        clearInterval(qrCodeResetInterval);
        codeScannedByClient = false;
        loginForm.style = "display: none";
        qrCodeForm.style = "display: block";
        qrCodeFormLoader.style = "display: block";
        document.getElementById("qrCodeFormUserInfo").style = "display: none";


        qrCodeFormIMG = document.getElementById("qrCodeFormIMG");
        if (typeof (qrCodeFormIMG) != "undefined" && qrCodeFormIMG != null) {
            qrCodeFormIMG.parentNode.removeChild(qrCodeFormIMG)
        }

        createQRCode();
    }

    var qrCodeFormLoader = document.getElementById("qrCodeFormLoader");
    var qrCode = document.getElementById("qrCode");

    var checkCodeInterval;
    var qrCodeResetInterval;

    function createQRCode() {
        $.ajax({
            type: "POST",
            url: apiURL + "/auth/login/createLoginQRCode",
        }).done(function (answer) {
            if (answer.success === true) {
                var img = document.createElement("img");
                img.src = answer.response.img;
                img.style = "background-color: #ffffff";
                img.width = 250;
                img.height = 250;
                img.id = "qrCodeFormIMG"


                qrCodeForm.appendChild(img);

                const code = answer.response.code;
                checkCodeInterval = setInterval(function () {
                    checkCode(code)
                }, 2000);

                qrCodeResetInterval = setInterval(function () {
                    cancelLogin()
                }, 6000000);

                qrCodeFormLoader.style = "display: none";
            } else {
                failedQRLogin().then(r => {
                });
            }
        }).fail(function (err) {
            failedQRLogin().then(r => {
            });
        });
    }

    var codeScannedByClient = false;

    function checkCode(code) {
        $.ajax({
            type: "POST",
            url: apiURL + "/auth/login/checkLoginQRCode",
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", "Bearer " + code);
            },
        }).done(function (answer) {
            if (answer.success === true) {
                clearInterval(qrCodeResetInterval);
                if (answer.response.status === 0) {
                    if (codeScannedByClient === false) {
                        codeScannedByClient = true;
                        qrCodeFormIMG = document.getElementById("qrCodeFormIMG");
                        qrCodeFormIMG.parentNode.removeChild(qrCodeFormIMG)

                        qrCodeFormUserInfo = document.getElementById("qrCodeFormUserInfo");
                        qrCodeFormUserInfoName = document.getElementById("qrCodeFormUserInfoName");
                        qrCodeFormUserInfoRank = document.getElementById("qrCodeFormUserInfoRank");
                        qrCodeFormUserInfoIMG = document.getElementById("qrCodeFormUserInfoIMG");

                        qrCodeFormUserInfoIMG.src = answer.response.userInfo.icon;
                        qrCodeFormUserInfoIMG.alt = answer.response.userInfo.name;
                        qrCodeFormUserInfoName.textContent = answer.response.userInfo.name;
                        qrCodeFormUserInfoRank.textContent = answer.response.userInfo.rank;
                        qrCodeFormUserInfo.style = "";
                    }
                } else {
                    clearInterval(checkCodeInterval);
                    generateToken(answer.response.loginInfo.auth_code);
                }
            }
        }).fail(function (err) {
            if (codeScannedByClient === true) {
                cancelLogin();
            }

        });
    }


    async function failedQRLogin() {
        await Sleep(3000);
        createQRCode();
    }
});

function Sleep(milliseconds) {
    return new Promise(resolve => setTimeout(resolve, milliseconds));
}


async function startFido2Login() {
    let webauthnAuth;
    try {
        webauthnAuth = await startAuthentication(passwordLessLoginResp);

        const verificationResp = await fetch(apiURL + "/auth/fido2/passwordLess", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(webauthnAuth),
        });

        // Wait for the results of verification
        const verificationJSON = await verificationResp.json();

        // Show UI appropriate for the `verified` status
        if (verificationJSON && verificationJSON.success) {
            generateToken(verificationJSON.response.loginInfo.auth_code);
        } else {
            init(passwordLessLoginResp);
            sendNotify(getMessage("general.action.message.failed") + ": " + verificationJSON.response.error_message, "danger");
        }

    } catch (error) {
        init(passwordLessLoginResp);
        sendNotify(getMessage("general.action.message.failed") + ": " + error.message, "danger");
    }

}
