var {browserSupportsWebAuthn} = SimpleWebAuthnBrowser;
var passwordLessLoginResp;

var autoFillIsGeneralFailed = false;


if (browserSupportsWebAuthn) {
    document.getElementById("webauthn").style = "display: block";
    $.ajax(apiURL + "/auth/fido2/passwordLess/option", {
        method: 'POST',
    }).then(resp => initPasswordLess(resp));
}

function autoLogin() {
    navigator.credentials.get({
        password: true,
        federated: {
            providers: [url]
        }
    }).then(function (cred) {
        if (cred === null) {
            // do nothing
        } else if (cred.type === "password") {
            if (cred) {
                login(cred.id, cred.password);
            }
        }
    });
}

autoLogin();

async function initPasswordLess(resp) {
    if (resp.success) {
        const {startAuthentication, browserSupportsWebAuthn} = SimpleWebAuthnBrowser;

        passwordLessLoginResp = await resp.response;

        if (browserSupportsWebAuthnAutofill && !autoFillIsGeneralFailed && browserSupportsWebAuthn) {
            let webauthnAutofillAuth;
            // try {
            webauthnAutofillAuth = await startAuthentication(passwordLessLoginResp, true);

            $.ajax(apiURL + "/auth/fido2/passwordLess", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                data: JSON.stringify(webauthnAutofillAuth)
            }).done(function (answer) {
                if (answer.success) {
                    generateToken(answer.response.loginInfo.auth_code);
                } else {
                    sendNotify("Autofill: " + getMessage("general.action.message.failed") + ": " + answer.response.error_message, "danger");
                }
            }).fail(function (err) {
                if (err.responseJSON.response.error_code != null) {
                    sendNotify(getMessage("general.action.message.failed") + ": " + err.responseJSON.response.error_message, "danger");
                } else {
                    sendNotify(getMessage("general.action.message.failed"), "danger");
                }
            });
        }
    }
}

function send() {
    form.style = "display: none";
    loader.style = "display: block";
}

function cancel() {
    loader.style = "display: none";
    form.style = "display: block";
    grecaptcha.reset();
}

function failed(message) {
    resetSession();
    sendNotify(message, "danger")
    cancel();
}

var sessionsToSet = [];

function resetSession() {
    sessionsToSet = [];
}

function setSession(name, value, cookie) {
    sessionsToSet.push({name: name, value: value, cookie: cookie});
}

function setSessions(url) {
    $.ajax({
        type: "POST",
        url: apiURL + "/session",
        data: JSON.stringify({sessions: sessionsToSet, url: url})
    }).done(function (answer) {
        sessionsToSet = {};

        if (answer.success) {
            document.location.href = answer.response.url
        }
    }).fail(function (err) {
        if (err.responseJSON.response.error_code != null) {
            failed(getMessage("general.action.message.failed") + ": " + err.responseJSON.response.error_message);
        } else {
            failed(getMessage("general.action.message.failed"));
        }
    });

}


function generateToken(token) {
    $.ajax({
        type: "POST",
        url: apiURL + "/auth/login/generateAccessToken",
        beforeSend: function (xhr) {   //Set token here
            xhr.setRequestHeader("Authorization", "Bearer " + token);
        }
    }).done(function (answer) {
        if (answer.success === true) {
            setSession("access_token", answer.response.access_token, false);
            setSession("refresh_token", answer.response.refresh_token, true);
            setSessions(success_url)
        } else {
            failed(answer.response.error_code);
        }
    }).fail(function (err) {
        if (err.responseJSON.response.error_code != null) {
            failed(getMessage("general.action.message.failed") + ": " + err.responseJSON.response.error_message);
        } else {
            failed(getMessage("general.action.message.failed"));
        }
    });
}

function isCaptchaChecked() {
    return grecaptcha && grecaptcha.getResponse().length !== 0;
}

function onSiteLogin() {
    if (!isCaptchaChecked) {
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
    }).fail(function (err) {
        grecaptcha.reset();
    });

}

function login(username, password) {
    send();
    $.ajax({
        type: "POST",
        url: apiURL + "/auth/login",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
        }
    }).done(function (answer) {

        if (answer.success === true) {
            if (document.getElementById('remember_login').checked) {
                setSession("refresh_token", answer.response.refresh_token, true);
            }
            if (answer.response.twoFactor.ready === false) {
                generateToken(answer.response.auth_code);
            } else {
                startTwoFactorConfirmation(answer.response.auth_code, function () {
                    generateToken(answer.response.auth_code);
                }, function () {
                    failed(getMessage("general.action.message.failed"));
                });
            }
            cancel();
        } else {
            failed("site.auth.action.message." + answer.response.error_message);
            cancel();
        }
    }).fail(function (err) {
        if (err.responseJSON.response.error_code != null) {
            failed(getMessage("site.auth.action.message." + err.responseJSON.response.error_message));
        } else {
            failed(getMessage("general.action.message.failed"));
        }
        cancel();
    });
}

import(url + '/assets/js/qrCode/qr-scanner.min.js').then((module) => {
    const QrScanner = module.default;
    document.getElementById('createQRCode').style = 'display: block';

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

    function cancelLoginFull() {
        loginForm.style = "display: block";
        qrCodeForm.style = "display: none";

        clearInterval(checkCodeInterval);
        clearInterval(qrCodeResetInterval);
        codeScannedByClient = false;
        qrCodeFormLoader.style = "display: none";
        document.getElementById("qrCodeFormUserInfo").style = "display: none";


        var qrCodeFormIMG = document.getElementById("qrCodeFormIMG");
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


        var qrCodeFormIMG = document.getElementById("qrCodeFormIMG");
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
                        var qrCodeFormIMG = document.getElementById("qrCodeFormIMG");
                        qrCodeFormIMG.parentNode.removeChild(qrCodeFormIMG)

                        var qrCodeFormUserInfo = document.getElementById("qrCodeFormUserInfo");
                        var qrCodeFormUserInfoName = document.getElementById("qrCodeFormUserInfoName");
                        var qrCodeFormUserInfoRank = document.getElementById("qrCodeFormUserInfoRank");
                        var qrCodeFormUserInfoIMG = document.getElementById("qrCodeFormUserInfoIMG");

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
    const {startAuthentication} = SimpleWebAuthnBrowser;
    let webauthnAuth;
    try {
        webauthnAuth = await startAuthentication(passwordLessLoginResp);

        $.ajax(apiURL + "/auth/fido2/passwordLess", {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            data: JSON.stringify(webauthnAuth)
        }).done(function (answer) {
            if (answer.success) {
                generateToken(answer.response.loginInfo.auth_code);
            } else {
                initPasswordLess(passwordLessLoginResp);
                sendNotify(getMessage("general.action.message.failed") + ": " + answer.response.error_message, "danger");
            }
        }).fail(function (err) {
            if (err.responseJSON.response.error_code != null) {
                sendNotify(getMessage("general.action.message.failed") + ": " + err.responseJSON.response.error_message, "danger");
            } else {
                sendNotify(getMessage("general.action.message.failed"), "danger");
            }
        });

    } catch (error) {
        sendNotify(getMessage("general.action.message.failed") + ": " + error.message, "danger");
    }

}