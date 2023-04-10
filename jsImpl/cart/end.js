
function hideBTN(){
    document.getElementById('btn_loading').style = '';
    document.getElementById('btn_submit').style = 'display:none';
}

function unhideBTN(){
    document.getElementById('btn_loading').style = 'display:none';
    document.getElementById('btn_submit').style = '';
    grecaptcha.reset();
}
function isCaptchaChecked() {
    return grecaptcha && grecaptcha.getResponse().length !== 0;
}
function unGreyButton(){
    if(isCaptchaChecked() === true && document.getElementById('withdrawal').checked === true && document.getElementById('tos').checked === true){
        document.getElementById('btn_submit').disabled = false;
    }
}
function greyButton(){
    document.getElementById('btn_submit').disabled = true;
}

function focusWindow(){
    newWindow.focus();
}

$('#withdrawal').change(function () {
    if(this.checked){
        unGreyButton();
    } else {
        greyButton();
    }
}).change();

$('#tos').change(function () {
    if(this.checked){
        unGreyButton();
    } else {
        greyButton();
    }
}).change();

function showPaymentLoadingModal(){
    $('#paymentLoadingModal').modal('show', {backdrop: 'static', keyboard: false});
}
showPaymentLoadingModal();

function startOrder(){
    hideBTN();
    if(!isCaptchaChecked){
        return false;
    }
    $.ajax({
        data: {'response': grecaptcha.getResponse()},
        type: 'POST',
        url: apiURL + '/auth/captcha'
    }).done(function (answer) {
        if(answer.success === true){
            $.ajax({
                data: {'teamId': team_id, 'discountCode': discountCode, 'affiliate_id': affiliate_id},
                type: 'POST',
                url: apiURL + '/user/order/startOrder',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
                },
            }).done(function (answer) {
                if(answer.success === true){
                    startPayment(answer.response.order_id, paymentMethod);

                } else {
                    sendNotify(getMessage("general.action.message.failed"), 'danger');
                    unhideBTN();
                }
            }).fail(function (err)  {
                sendNotify(getMessage("general.action.message.failed"), 'danger');
                unhideBTN();
            });
        } else {
            sendNotify(getMessage("action.message.recaptchaFailed"), 'danger');
            unhideBTN();
        }
    }).fail(function (err)  {
        sendNotify(getMessage("action.message.recaptchaFailed"), 'danger');
        unhideBTN();
    });
}


var interval;

function startPayment(order_id, paymentMethod){
    var method;
    if(paymentMethod.type === 'oneTime'){
        method = paymentMethod.method;
    } else {
        method = paymentMethod.id;
    }

    $.ajax({
        data: {'method': method, 'paymentType': paymentMethod.type, 'order_id': order_id},
        type: 'POST',
        url: apiURL + '/user/order/startPayment',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        },
    }).done(function (answer) {
        if(answer.success === true){
            popUp = popupCenter(answer.response.link, 'Payment', 1000, 750);
            if(popUp === true) {
                showPaymentLoadingModal();
                interval = setInterval(function () {
                    if (newWindow.closed === true) {
                        $('.modal').modal('hide');
                        unhideBTN();
                        clearInterval(interval);
                    }
                }, 500);
            } else {
                window.location.href = answer.response.link;
            }
        } else {
            sendNotify(getMessage("general.action.message.failed"), 'danger');
            unhideBTN();
        }
    }).fail(function (err)  {
        sendNotify(getMessage("general.action.message.failed"), 'danger');
        unhideBTN();
    });
}