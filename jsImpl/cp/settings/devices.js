document.querySelectorAll('[data-frames]').forEach((frame) => {
    frame.onclick = function(){
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


function removeAllDevices(){
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
                }, function (){
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

    const video = document.getElementById('video');
    const flashToggle = document.getElementById('flashBox');
    const camList = document.getElementById('camList');
    const scanner = new QrScanner(video, result => setResult(result), {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 10
    });

    function initialCam() {
        $('#videoModal').on('hidden.bs.modal', function (e) {
            stopScan();
        })

        const updateFlashAvailability = () => {
            scanner.hasFlash().then(hasFlash => {
                document.getElementById('flashToggleDIV').style = hasFlash ? 'display: block' : 'display: none';
            });
        };

        scanner.start().then((r) => {
            updateFlashAvailability();

            QrScanner.listCameras(true).then(cameras => cameras.forEach(camera => {
                const option = document.createElement('option');
                option.value = camera.id;
                option.text = camera.label;
                camList.add(option);
            }));
        }).catch((err) => {
            $('.modal').modal('hide');
            document.getElementById('deviceQRCodeLogin').style = 'display:none';
            stopScan();
        });

        flashToggle.addEventListener('click', () => {
            scanner.toggleFlash()
                .then(() => flashToggle.checked = !!scanner.isFlashOn())
                .catch(e => flashToggle.checked = false);
        });

        camList.addEventListener('change', event => {
            scanner.setCamera(event.target.value).then(updateFlashAvailability);
        });
        $('#closeCamera').click(function () {
            stopScan();
        });
        $('#submitCodeBtn').click(function () {
            submitCode();
        });
    }

    var scannedCode = null;

    function setResult(result) {
        if (scannedCode === null) {
            stopScan();
            scannedCode = result.data

            document.getElementById('submitVideo').style = 'display: none';
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
                    document.getElementById('submitCode').style = 'display: block';
                    document.getElementById('submitFailed').style = 'display: none';
                } else {
                    document.getElementById('submitCode').style = 'display: none';
                    document.getElementById('submitFailed').style = 'display: block';
                }
            }).fail(function (err) {
                document.getElementById('submitCode').style = 'display: none';
                document.getElementById('submitFailed').style = 'display: block';
            });
        }

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
            document.getElementById('submitCode').style = 'display: none';
            if (answer.success === true) {
                document.getElementById('submitSuccess').style = 'display: block';
            } else {
                document.getElementById('submitFailed').style = 'display: block';
            }
        }).fail(function (err) {
            document.getElementById('submitCode').style = 'display: none';
            document.getElementById('submitFailed').style = 'display:block';
        });
    }

    function stopScan() {
        scanner.stop();
        video.style = 'display: hidden';
    }

    $('#openCamera').click(function () {
        $('#videoModal').modal("show");

        initialCam();
        document.getElementById('submitVideo').style = 'display: block';
        document.getElementById('submitCode').style = 'display: none';
        document.getElementById('submitSuccess').style = 'display: none';
        document.getElementById('submitFailed').style = 'display: none';
    });

    QrScanner.hasCamera().then((r) => {
        if(r) {
            document.getElementById('deviceQRCodeLogin').style = 'display: block';
        }
    });

});