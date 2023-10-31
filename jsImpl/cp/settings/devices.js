document.querySelectorAll('[data-frames]').forEach((frame) => {
    frame.onclick = function () {
        var button = document.getElementById('button-' + this.dataset.frameid);
        var iframe = document.getElementById('iframe-' + this.dataset.frameid);
        var frameURl = button.getAttribute('data-frameUrl');

        iframe.style = 'height:300px;width:100%; display: block';
        iframe.src = frameURl;

        button.parentNode.removeChild(button);
    };

});

document.getElementById('removeAllDevices').addEventListener("click", (event) => {
    removeAllDevices();
});


function removeAllDevices() {
    $.ajax({
        type: 'DELETE',
        url: apiURL + '/user/settings/devices',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        },
    }).done(function (answer) {
        if (answer.success === true) {
            if (answer.response.requireSessionCode === true) {
                startTwoFactorConfirmation(answer.response.sessionCode, function () {
                    $.ajax({
                        data: {sessionCode: answer.response.sessionCode},
                        type: 'DELETE',
                        url: apiURL + '/user/settings/devices',
                        beforeSend: function (xhr) {
                            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
                        },
                    }).done(function (answer) {
                        location.reload();
                    }).fail(function (err) {
                        sendNotify(getMessage("site.cp.settings.action.message.deviceRemovedFailed"), 'danger');
                    });
                }, function () {
                    sendNotify(getMessage("site.cp.settings.action.message.deviceRemovedFailed"), 'danger');
                });
            } else {
                location.reload();
            }
        } else {
            sendNotify(getMessage("site.cp.settings.action.message.deviceRemovedFailed"), 'danger');
        }
    }).fail(function (err) {
        sendNotify(getMessage("site.cp.settings.action.message.deviceRemovedFailed"), 'danger');
    });
}

import(url + '/assets/js/qrCode/qr-scanner.min.js').then((module) => {
    const QrScanner = module.default;

    let deviceQRCodeLogin = $('#deviceQRCodeLogin');
    let openCameraBtn = deviceQRCodeLogin.find('#openCamera');
    let videoModal = $('#qrCodeScanModal');

    let videoMask = videoModal.find('#qrCodeScanVideoMask');
    let submitCodeMask = videoModal.find('#qrCodeScanSubmitCodeMask');
    let submitCodeSuccessMask = videoModal.find('#qrCodeScanSubmitCodeSuccessMask');
    let submitCodeFailedMask = videoModal.find('#qrCodeScanSubmitCodeFailedMask');
    let submitCodeBtn = videoModal.find('#submitCodeBtn');

    let video = videoMask.find('#video');
    let flashToggle = videoMask.find('#flashBox');
    let camList = videoMask.find('#camList');

    let resultRequest = false;
    let scannedCode = false;


    let currentURLParams = new URLSearchParams(window.location.search);
    if(currentURLParams.has('qrCodeLoginCode')){
        initialModal();
        setResult(currentURLParams.get('qrCodeLoginCode'));
    }

    const scanner = new QrScanner(video[0], result => {
        scanner.stop();
        setResult(getLoginCodeFromUrl(result.data));
    }, {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 5
    });

    videoModal.on('hidden.bs.modal', function (e) {
        stopScan();
    })

    const updateFlashAvailability = () => {
        scanner.hasFlash().then(hasFlash => {
            if (hasFlash) {
                flashToggle.parent().show();
            } else {
                flashToggle.parent().hide();
            }
        });
    };

    function startCam() {
        scanner.start().then((r) => {
            updateFlashAvailability();
            camList.empty();
            QrScanner.listCameras(true).then(cameras => cameras.forEach(camera => camList.append($('<option>').val(camera.id).text(camera.label))));
        }).catch((err) => {
            videoModal.modal('hide');
            deviceQRCodeLogin.hide();
            stopScan();
        });
    }

    flashToggle.on('click', () => {
        scanner.toggleFlash()
            .then(() => flashToggle.checked = !!scanner.isFlashOn())
            .catch(e => flashToggle.checked = false);
    });
    camList.on('change', event => {
        scanner.setCamera(event.target.value).then(updateFlashAvailability);
    });

    $('#closeCamera').click(function () {
        stopScan();
    });
    submitCodeBtn.click(function () {
        submitCode();
    });

    function initialModal(){
        resultRequest = false;
        videoModal.modal("show");
        videoMask.show();
        submitCodeMask.hide();
        submitCodeSuccessMask.hide();
        submitCodeFailedMask.hide();
    }

    openCameraBtn.click(function () {
        initialModal();
        startCam();
    });


    function getLoginCodeFromUrl(code) {
        let url = new URL(code);

        const urlParams = new URLSearchParams(url.searchParams);
        if (urlParams.has('qrCodeLoginCode')) {
            return urlParams.get('qrCodeLoginCode');
        }
        return false;
    }

    function setResult(code) {
        scannedCode = code;
        if (scannedCode === false) {
            return;
        }

        if (resultRequest === true) {
            return;
        }

        resultRequest = true;

        videoMask.hide();
        $.ajax({
            type: 'POST',
            url: apiURL + '/user/settings/devices/scanLoginToken',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
            },
            data: {
                'code': scannedCode
            }
        }).done(function (answer) {
            if (answer.success === true) {
                submitCodeMask.show();
            } else {
                submitCodeFailedMask.show();
            }
        }).fail(function (err) {
            submitCodeFailedMask.show();
        });

    }

    function submitCode() {
        $.ajax({
            type: 'POST',
            url: apiURL + '/user/settings/devices/approveLoginToken',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
            },
            data: {
                'code': scannedCode
            }
        }).done(function (answer) {
            submitCodeMask.hide();
            if (answer.success === true) {
                submitCodeSuccessMask.show();

                setTimeout(function () {
                    // remove url params
                    var url = new URL(window.location.href);
                    url.searchParams.delete('qrCodeLoginCode');
                    window.history.replaceState({}, '', url);
                }, 1000);
            } else {
                submitCodeFailedMask.show();
            }
        }).fail(function (err) {
            submitCodeMask.hide();
            submitCodeFailedMask.show();
        });
    }

    function stopScan() {
        scanner.stop();
        videoMask.hide();
    }

    QrScanner.hasCamera().then((r) => {
        if (r) {
            deviceQRCodeLogin.show();
        }
    });

});