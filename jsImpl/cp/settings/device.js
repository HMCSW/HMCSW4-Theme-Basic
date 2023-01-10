import QrScanner from '/assets/js/qrCode/qr-scanner.min.js'

$( '#openCamera' ).click(function() {
    $('#videoModal').modal();

    initialCam();
    document.getElementById('submitVideo').style = 'display: block';
    document.getElementById('submitCode').style = 'display: none';
    document.getElementById('submitSuccess').style = 'display: none';
    document.getElementById('submitFailed').style = 'display: none';
    scanner.start();
});

function showIFrame(deviceId){
    var button = document.getElementById('button-' + deviceId);
    var frame = document.getElementById('iframe-' + deviceId);
    var frameURl = button.getAttribute('data-frameUrl');

    frame.style = 'height:300px;width:100%; display: block';
    frame.src = frameURl;

    button.parentNode.removeChild(button);

}


function initialCam(){
    const video = document.getElementById('video');
    const flashToggle = document.getElementById('flashBox');
    const camList = document.getElementById('camList');
    $('#videoModal').on('hidden.bs.modal', function (e) {
        stopScan();
    })

    const scanner = new QrScanner(video, result => setResult(result), {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        maxScansPerSecond: 10
    });
    const updateFlashAvailability = () => {
        scanner.hasFlash().then(hasFlash => {
            document.getElementById('flashToggleDIV').style = hasFlash ? 'display: block' : 'display: none';
        });
    };

    scanner.start().then(() => {
        updateFlashAvailability();

        QrScanner.listCameras(true).then(cameras => cameras.forEach(camera => {
            const option = document.createElement('option');
            option.value = camera.id;
            option.text = camera.label;
            camList.add(option);
        }));
    });
    flashToggle.addEventListener('click', () => {
        scanner.toggleFlash()
            .then(() => flashToggle.checked = scanner.isFlashOn() ? true : false)
            .catch(e => flashToggle.checked = false );
    });

    camList.addEventListener('change', event => {
        scanner.setCamera(event.target.value).then(updateFlashAvailability);
    });
    $( '#closeCamera' ).click(function() {
        stopScan();
    });
    $( '#submitCodeBtn' ).click(function() {
        submitCode();
    });

    var scannedCode = null;
    function setResult(result) {
        if(scannedCode === null){
            stopScan();
            scannedCode = result.data

            document.getElementById('submitVideo').style = 'display: none';
            $.ajax({
                type: 'POST',
                url: apiURL +'/user/settings/devices/scanLoginToken',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
                },
                data: {
                    'code' : scannedCode
                }
            }).done(function (answer) {
                if(answer.success === true){
                    document.getElementById('submitCode').style = 'display: block';
                    document.getElementById('submitFailed').style = 'display: none';
                } else {
                    document.getElementById('submitCode').style = 'display: none';
                    document.getElementById('submitFailed').style = 'display: block';
                }
            }).fail(function (err)  {
                document.getElementById('submitCode').style = 'display: none';
                document.getElementById('submitFailed').style = 'display: block';
            });
        }

    }

    function submitCode(){
        $.ajax({
            type: 'POST',
            url: apiURL +'/user/settings/devices/approveLoginToken',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
            },
            data: {
                'code' : scannedCode
            }
        }).done(function (answer) {
            document.getElementById('submitCode').style = 'display: none';
            if(answer.success === true){
                document.getElementById('submitSuccess').style = 'display: block';
            } else {
                document.getElementById('submitFailed').style = 'display: block';
            }
        }).fail(function (err)  {
            document.getElementById('submitCode').style = 'display: none';
            document.getElementById('submitFailed').style = 'display:block';
        });
    }

    function stopScan(){
        scanner.stop();
        video.style = 'display: hidden';
    }
}


