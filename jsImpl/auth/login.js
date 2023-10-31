window.addEventListener('load', function () {
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    let loginMask = $("#loginMask");
    let loadingMask = $("#loadingMask");
    let loginActionButtons = loginMask.find("loginActionButtons");
    let loginBtn_noLoader = loginMask.find("#loginBtn_noLoader");
    let loginBtn = loginMask.find("#loginBtn");
    let loginBtnLoader = loginMask.find("#loginBtn_loader");
    let username = loginMask.find("#username");
    let password = loginMask.find("#password");
    let deviceIdentification = localStorage.getItem("deviceIdentification");
    let qrCodeLoginModal = $("#qrCodeLoginModal");
    let createQRCodeBtn = loginMask.find("#createQRCode");
    let qrCodeLoginCodeArea = qrCodeLoginModal.find("#qrCodeLoginCodeArea");
    let qrCodeLoginImage = qrCodeLoginModal.find("#qrCodeLoginImage");
    let qrCodeFormUserInfo = qrCodeLoginModal.find("#qrCodeFormUserInfo");
    let qrCodeFormNotMeBtn = qrCodeLoginModal.find("#qrCodeFormNotMeBtn");
    let qrCodeCheckCodeInterval;
    let fidoBtn = loginMask.find("#fidoBtn");

    loginMask.show();
    loadingMask.hide();


    function autoLogin() {
        navigator.credentials.get({
            password: true,
            federated: {
                providers: [url]
            }
        }).then(function (cred) {
            if (cred === null) {
                // nothing to do
            } else if (cred.type === "password") {
                if (cred) {
                    username.val(cred.id);
                    password.val(cred.password);
                    onLoginClick(cred.id, cred.password);
                }
            }
        });
    }

    function checkTokenResponse(response) {
        if (response.success === true) {
            setSession("access_token", response.response.access_token, false);
            if (response.response.refresh_token) {
                if (document.getElementById('remember_login').checked) {
                    setSession("refresh_token", response.response.refresh_token, true);
                }
            }
            setSessions(success_url)
        } else {
            loginRequestError(response);
            cancelLogin();
        }
    }

    function generateToken(token) {
        $.ajax({
            type: "POST",
            url: apiURL + "/auth/login/generateAccessToken",
            beforeSend: function (xhr) {   //Set token here
                xhr.setRequestHeader("Authorization", "Bearer " + token);
            }
        }).done(function (answer) {
            checkTokenResponse(answer);
        }).fail(function (err) {
            loginRequestError(err);
            cancelLogin();
        });
    }

    function checkLoginResponse(response, autoSelectFido = true) {
        if (response.success === true) {
            if (response.response.deviceIdentification) {
                localStorage.setItem("deviceIdentification", response.response.deviceIdentification);
            }

            if (response.response.twoFactor.ready === false) {
                generateToken(response.response.auth_code);
            } else {
                startTwoFactorConfirmation(response.response.auth_code, function () {
                    generateToken(response.response.auth_code);
                }, function () {
                    cancelLogin();
                }, autoSelectFido);
            }
        } else {
            loginRequestError(response);
            cancelLogin();
        }
    }

    function cancelLogin() {
        loginBtn_noLoader.show();
        loginBtnLoader.hide();
        loginActionButtons.attr("disabled", false);
    }

    function onLoginClick(username, password) {
        if (username === "" || password === "") {
            return;
        }

        blockLogin();
        loginRequest(username, password)
    }

    loginBtn.click(function () {
        if (!isCaptchaChecked()) {
            return;
        }

        $.ajax({
            data: {'response': grecaptcha.getResponse()},
            type: 'POST',
            url: apiURL + '/auth/captcha'
        }).done(function (answer) {
            onLoginClick(username.val(), password.val());
        }).fail(function (err) {
            grecaptcha.reset();
        });
    });

    function blockLogin() {
        loginBtn_noLoader.hide();
        loginBtnLoader.show();
        loginActionButtons.attr("disabled", true);
    }

    if (urlParams.has('remoteLogin')) {
        blockLogin();
        let data = {};
        data.name = urlParams.get('remoteLogin');
        data.code = urlParams.get('code');
        data.state = urlParams.get('state');
        if (deviceIdentification != null) {
            data.deviceIdentification = deviceIdentification;
        }
        $.ajax({
            type: "POST",
            url: apiURL + "/auth/login/external/" + urlParams.get('remoteLogin'),
            data: data
        }).done(function (answer) {
            checkLoginResponse(answer);
            if(answer.success === false){
                urlParams.delete('code');
                urlParams.delete('state');
                urlParams.delete('remoteLogin');
                var url = new URL(window.location.href);
                url.searchParams.delete('qrCodeLoginCode');
                window.history.replaceState({}, '', url);
            }
        }).fail(function (err) {
            urlParams.delete('code');
            urlParams.delete('state');
            urlParams.delete('remoteLogin');

            var url = new URL(window.location.href);
            url.searchParams.delete('qrCodeLoginCode');
            window.history.replaceState({}, '', url);

            loginRequestError(err);
            cancelLogin();
            autoLogin();
        });
    } else {
        autoLogin();
    }

    let remoteAccount = $(".remoteAccount");

    remoteAccount.click(function () {
        startRemoteLogin($(this).data("url"), $(this).data("name"));
    });

    function startRemoteLogin(url, name) {
        let popUp = popupCenter(url, name, 500, 750);
        if (popUp !== true) {
            window.location.href = url;
        }
    }


    function loginRequest(username, password) {
        let data = {};
        if (deviceIdentification != null) {
            data.deviceIdentification = deviceIdentification;
        }

        $.ajax({
            type: "POST",
            url: apiURL + "/auth/login",
            beforeSend: function (xhr) {
                xhr.setRequestHeader("Authorization", "Basic " + btoa(username + ":" + password));
            },
            data: data
        }).done(function (answer) {
            checkLoginResponse(answer);
        }).fail(function (err) {
            loginRequestError(err);
        });
    }


    function isCaptchaChecked() {
        return grecaptcha && grecaptcha.getResponse().length !== 0;
    }

    qrCodeLogin();

    function qrCodeLogin() {
        createQRCodeBtn.parent().show();

        function startQrCodeLogin() {
            qrCodeLoginImage.attr("src", "");
            createQRCode();
            qrCodeLoginCodeArea.show();
            qrCodeFormUserInfo.hide();
        }

        createQRCodeBtn.click(function () {
            qrCodeLoginModal.modal('show');
            startQrCodeLogin();
        });

        qrCodeLoginModal.on('hidden.bs.modal', function (e) {
            failQrCodeLogin();
        })

        function createQRCode() {
            $.ajax({
                type: "POST",
                url: apiURL + "/auth/login/createLoginQRCode",
            }).done(function (answer) {
                if (answer.success === true) {
                    qrCodeLoginImage.attr("src", answer.response.img);

                    const code = answer.response.code;
                    qrCodeCheckCodeInterval = setInterval(function () {
                        checkQrCode(code)
                    }, 2000);

                } else {
                    failQrCodeLogin();
                }
            }).fail(function (err) {
                failQrCodeLogin();
            });
        }


        function checkQrCode(code) {
            let data = {};
            if (deviceIdentification != null) {
                data.deviceIdentification = deviceIdentification;
            }

            $.ajax({
                type: "POST",
                url: apiURL + "/auth/login/checkLoginQRCode",
                beforeSend: function (xhr) {
                    xhr.setRequestHeader("Authorization", "Bearer " + code);
                },
                data: data
            }).done(function (answer) {
                if (answer.success === true) {
                    if (answer.response.status === 0) {
                        qrCodeLoginCodeArea.hide();

                        qrCodeFormUserInfo.find("#qrCodeFormUserInfoName").text(answer.response.userInfo.name);
                        qrCodeFormUserInfo.find("#qrCodeFormUserInfoRank").text(answer.response.userInfo.rank);
                        qrCodeFormUserInfo.find("#qrCodeFormUserInfoIMG").attr("src", answer.response.userInfo.icon);
                        qrCodeFormUserInfo.show();
                    } else {
                        endQrCodeLogin();
                        generateToken(answer.response.auth_code);
                    }
                }
            }).fail(function (err) {
                failQrCodeLogin();
            });
        }

        function failQrCodeLogin() {
            endQrCodeLogin();
            sendNotify(getMessage("general.action.message.failed"), "danger");
        }

        function endQrCodeLogin() {
            qrCodeLoginModal.modal('hide');
            clearInterval(qrCodeCheckCodeInterval);
        }

        qrCodeFormNotMeBtn.click(function () {
            clearInterval(qrCodeCheckCodeInterval);
            startQrCodeLogin();
        });
    }

    fido();

    function fido() {
        if (browserSupportsWebAuthnAutofill()) {
            $.ajax(apiURL + "/auth/fido2/passwordLess/option", {
                method: 'POST',
            }).then(resp => {
                initPasswordLess(resp);
            });
        }

        if (browserSupportsWebAuthn()) {
            fidoBtn.parent().show();
        }
        if(platformAuthenticatorIsAvailable()){
            fidoBtn.parent().show();
        }

        fidoBtn.click(function () {
            $.ajax(apiURL + "/auth/fido2/passwordLess/option", {
                method: 'POST',
            }).then(resp => {
                startFido2Login(resp);
            });
        });

        function initPasswordLess(resp) {
            if (resp.success) {
                startAuthentication(resp.response, true).then(sendFidoRequest).catch(function (err) {
                    // do nothing..
                });
            }
        }

        function sendFidoRequest(auth){
            auth.deviceIdentification = deviceIdentification;
            $.ajax(apiURL + "/auth/fido2/passwordLess", {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                data: JSON.stringify(auth)
            }).done(function (answer) {
                checkLoginResponse(answer);
            }).fail(function (err) {
                loginRequestError(err);
            });
        }

        function startFido2Login(resp) {
            if (resp.success) {
                try {
                    blockLogin();
                    startAuthentication(resp.response).then(sendFidoRequest).catch(function (err) {
                        cancelLogin();
                        sendNotify(getMessage("general.action.message.failed") + ": " + err, "danger");
                    });

                } catch (error) {
                    cancelLogin();
                    sendNotify(getMessage("general.action.message.failed") + ": " + error.message, "danger");
                }
            }
        }
    }

    function loginRequestError(err){
        if(err.responseJSON !== undefined) {
            if (err.responseJSON.response.error_code != null) {
                sendNotify(getMessage("general.action.message.failed") + ": " + err.responseJSON.response.error_message, "danger");
            } else {
                sendNotify(getMessage("general.action.message.failed"), "danger");
            }
        } else if(err.response !== undefined) {
            if (err.response.error_code != null) {
                sendNotify(getMessage("general.action.message.failed") + ": " + err.response.error_message, "danger");
            } else {
                sendNotify(getMessage("general.action.message.failed"), "danger");
            }
        } else {
            sendNotify(getMessage("general.action.message.failed"), "danger");
        }
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
            } else {
                loginRequestError(answer);
            }
        }).fail(function (err) {
            loginRequestError(err);
        });

    }

});

