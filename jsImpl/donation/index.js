window.addEventListener('load', async event => {
    initDonation();
});


function initDonation() {
    document.getElementById('bodyNoLoader').removeAttribute('style');
    document.getElementById('bodyLoader').style = 'display:none';
    hideBTN();

    document.getElementById('donationMethod').disabled = true;


    document.getElementById('donationAmount').addEventListener('input', checkAmount);
}

let typingTimer;
let doneTypingInterval = 1000;
let donationAmount = document.getElementById('donationAmount');

donationAmount.addEventListener('keyup', () => {
    methodLoader(true);
    clearMethods();
    clearTimeout(typingTimer);
    if (donationAmount.value) {
        typingTimer = setTimeout(doneTyping, doneTypingInterval);
    }
});

function getAmount(){
    return Math.trunc(donationAmount.value*100);
}

function doneTyping () {
    hideBTN();
    getMethods(getAmount());
}

function checkAmount(){
    if(getAmount() >= 1){
        amountSelected = true;
    } else {
        document.getElementById('donationMethod').disabled = true;
    }
}

document.getElementById('donationSubmit').addEventListener('click', startOrder);

function startOrder(){
    hideBTN(true);
    createOrder(null);
}

methods = [];
tosSelected = false;
termsSelected = false;
methodSelected = false;
amountSelected = false;

function clearMethods(){
    document.getElementById('donationMethod').disabled = true;
    document.getElementById('donationMethod').innerHTML = '';
}

function getMethods(amounts){
    $.ajax({
        url: apiURL+'/donation/methods',
        type: 'GET',
        data: {
            "amount": amounts
        },
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        },
    }).done(function (data) {
        methodLoader(false);
        clearMethods();
        if(data.response.length === 0){
            methodSelected = false;
            hideBTN();

            document.getElementById('donationMethod').innerHTML += '<option disabled selected>No method found</option>'
            document.getElementById('donationMethod').disabled = true;

            return;
        }
        methodSelected = true;
        unhideBTN();

        methods = data.response;

        for (key in data.response) {
            const method = data.response[key];
            document.getElementById('donationMethod').innerHTML += '<option value="'+key+'">'+method.name+'</option>'
        }
        document.getElementById('donationMethod').disabled = false;
    }).fail(function (jqXHR, textStatus, errorThrown) {
        methodLoader(false);
        clearMethods();
        methodSelected = false;
        document.getElementById('donationMethod').innerHTML += '<option disabled selected>No method found</option>'
        document.getElementById('donationMethod').disabled = true;

        hideBTN();
    });
}


function createOrder(sessionCode){
    paymentMethod = methods[document.getElementById('donationMethod').value];
    comment = document.getElementById('donationText').value;

    $.ajax({
        data: {'amount': getAmount(), sessionCode: sessionCode, id: donationPageId, text: comment },
        type: 'POST',
        url: apiURL + '/user/order/startDonation',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer '+ accessToken);
        },
    }).done(function (answer) {
        if(answer.success === true){
            if(answer.response.requireIdentityCheck === true) {
                startIdentityCheck(function () {
                    createOrder(null);
                }, function () {
                    sendNotify(getMessage("general.action.message.failed"), 'danger');
                    unhideBTN();
                });
            } else if(answer.response.requireSessionCode === true){
                startTwoFactorConfirmation(answer.response.sessionCode, function () {
                    createOrder(answer.response.sessionCode);
                }, function () {
                    sendNotify(getMessage("general.action.message.failed"), 'danger');
                    unhideBTN();
                });
            } else {
                startPayment(answer.response.order_id, paymentMethod);
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

function methodLoader(state){
    if(state === true){
        document.getElementById('donationMethodCard').style = 'display: none';
        document.getElementById('donationMethodLoader').style = 'display:block';
    }else {
        document.getElementById('donationMethodLoader').style = 'display:none';
        document.getElementById('donationMethodCard').style = 'display:block';
    }
}

function hideBTN(click = false){
    if(tosSelected === false || termsSelected === false || methodSelected === false || amountSelected === false || click === true) {
        document.getElementById('donationSubmitLoading').style = '';
        document.getElementById('donationSubmit').style = 'display:none';
    }
}

function unhideBTN(){
    if(tosSelected === true && termsSelected === true && methodSelected === true && amountSelected === true){
        document.getElementById('donationSubmitLoading').style = 'display:none';
        document.getElementById('donationSubmit').removeAttribute('style');
    }
}

$('#withdrawal').change(function () {
    if(this.checked){
        termsSelected = true;
        unhideBTN();
    } else {
        termsSelected = false;
        hideBTN();
    }
}).change();

$('#tos').change(function () {
    if(this.checked){
        tosSelected = true;
        unhideBTN();
    } else {
        tosSelected = false;
        hideBTN();
    }
}).change();


function showPaymentLoadingModal(){
    $('#paymentLoadingModal').modal('show', {backdrop: 'static', keyboard: false, focus: true});
}

function focusWindow(){
    newWindow.focus();
}