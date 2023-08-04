window.addEventListener('load', async event => {
    initIdentityCheckRequired();
});

function startIdentityCheck(successCallback, failedCallback, address_id, skipWindow){
    var event = new CustomEvent('IdentityCheckRequired', {detail: {address_id: address_id, skipWindow: skipWindow, successCallback: successCallback, failedCallback: failedCallback }});
    document.dispatchEvent(event);
}

async function initIdentityCheckRequired() {
    var sessionCodeSave;
    let modal = $('#identityCheckRequired');

    document.addEventListener("IdentityCheckRequired", e => {
        startIdentityCheck();


        function end(){
            modal.off();
            modal.modal('hide', {});
            document.getElementById("reopenIdentityCheck").removeEventListener("click", reopen);
            document.getElementById("startIdentityCheck").removeEventListener("click", startCheck);
            document.getElementById("reopenIdentityCheck").style.display = "none";
            document.getElementById("startIdentityCheck").style.display = "block";
        }

        function done(){
            end();
            e.detail.successCallback();
        }

        function fail(){
            end();
            e.detail.failedCallback();
        }

        function startIdentityCheck() {
            if(e.detail.skipWindow === true) {
                startCheck();
            } else {

                modal.modal('show', {backdrop: 'static', keyboard: false, focus: true});

                modal.on('hidden.bs.modal', function (e) {
                    fail();
                });
                document.getElementById("startIdentityCheck").addEventListener("click", startCheck);
            }
        }

        function checkIdentityCheck(){

            if(e.detail.address_id !== undefined){
                requestUrl = apiURL + '/user/settings/userInfo/address/'+e.detail.address_id+'/identityCheck/status/';
            } else {
                requestUrl = apiURL + '/user/settings/userInfo/address/identityCheck/status/';
            }

            $.ajax({
                type: 'GET',
                url: requestUrl,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
                },
            }).done(function (answer) {
                if(answer.success){
                    if(answer.response.status == "true"){
                        done();
                    } else {
                        fail();
                    }
                } else {
                    fail();
                }
            }).fail(function (err)  {
                fail();
            });
        }
        function reopen(){
            newWindow.focus();
        }

        function startCheck(){
            document.getElementById("startIdentityCheck").removeEventListener("click", startCheck);
            document.getElementById("reopenIdentityCheck").style.display = "block";
            document.getElementById("reopenIdentityCheck").addEventListener("click", reopen);

            document.getElementById("startIdentityCheck").style.display = "none";

            if(e.detail.address_id !== undefined){
                requestUrl = apiURL + '/user/settings/userInfo/address/'+e.detail.address_id+'/identityCheck/full';
            } else {
                requestUrl = apiURL + '/user/settings/userInfo/address/identityCheck/full';
            }
            $.ajax({
                type: 'POST',
                url: requestUrl,
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
                },
            }).done(function (answer) {
                if(answer.success === true){
                    popupCenter(answer.response.url, 'IdentityCheck', 500, 750);
                    interval = setInterval(function(){

                        if(newWindow.closed === true){
                            clearInterval(interval);
                            checkIdentityCheck();
                        }
                    }, 500);
                } else {
                    fail();
                }
            }).fail(function (err)  {
                fail();
            });
        }


    });

}
