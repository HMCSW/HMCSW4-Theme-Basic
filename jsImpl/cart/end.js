
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

function createOrder(sessionCode){
    $.ajax({
        data: {'teamId': team_id, 'discountCode': discountCode, 'affiliate_id': affiliate_id, 'roundUp': roundUp, sessionCode: sessionCode, 'deliveryAddressId': deliveryAddressId, 'invoiceAddressId': invoiceAddressId},
        type: 'POST',
        url: apiURL + '/user/order/startOrder',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
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
        createOrder(null);
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
            let popUp = popupCenter(answer.response.link, 'Payment', 1000, 750);
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


// fast checkout
window.addEventListener('load', async event => {
    await import('https://js.stripe.com/v3/');
    $.ajax({
        type: 'GET',
        url: apiURL + '/user/cart/testFastUser',
        data: {
            'teamId': team_id,
            'discountCode': discountCode,
            'affiliate_id': affiliate_id,
            'roundUp': roundUp
        },
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        },
    }).done(function (answer) {
        if(answer.success === true) {
            $.ajax({
                type: 'GET',
                url: apiURL + '/user/cart',
                data: {
                    'teamId': team_id,
                    'discountCode': discountCode,
                    'affiliate_id': affiliate_id,
                    'roundUp': roundUp, 'deliveryAddressId': deliveryAddressId, 'invoiceAddressId': invoiceAddressId
                },
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
                },
            }).done(function (answer) {
                if (answer.success === true) {
                    initialFast(answer.response);
                }
            });
        }
    });
});

function initialFast(render) {
    const stripe = Stripe(stripePublicKey, {
        apiVersion: "2020-08-27",
    });

    var displayItems = [];
    var total = 0;
    render.items.forEach(function (item) {
        displayItems.push({
            amount: item.amount.full,
            label: item.name,
        });
        total += item.amount.full;
    });

    const paymentRequest = stripe.paymentRequest({
        country: 'DE',
        currency: render.checkoutInfo.currency.toLowerCase(),
        total: {
            label: 'Total',
            amount: total,
        },
        displayItems: displayItems,
        disableWallets: [
            "link"
        ],
        requestPayerName: true,
        requestPayerEmail: false,
    });
    const stripeElements = stripe.elements();
    const prButton = stripeElements.create('paymentRequestButton', {
        paymentRequest,
    });

    (async () => {
        const result = await paymentRequest.canMakePayment();
        if (result) {
            prButton.mount('#payment-request-button');
        } else {
            document.getElementById('payment-request-button').style.display = 'none';
        }
    })();

    paymentRequest.on('paymentmethod', async (ev) => {
        createFastOrder(ev)
    });

    paymentRequest.on('cancel', function() {
        unhideBTN();
    });

    async function startFastPayment(ev, external_id, clientSecret, link) {
        const {paymentIntent, error: confirmError} = await stripe.confirmCardPayment(
            clientSecret,
            {payment_method: ev.paymentMethod.id},
            {handleActions: false}
        );

        if (confirmError) {
            sendNotify(getMessage("general.action.message.failed"), 'danger');
            unhideBTN();
        } else {
            ev.complete('success');
            if (paymentIntent.status === "requires_action") {
                const {error} = await stripe.confirmCardPayment(clientSecret);
                if (error) {
                    sendNotify(getMessage("general.action.message.failed"), 'danger');
                    unhideBTN();
                } else {
                    endFastPayment(link)
                }
            } else {
                endFastPayment(link)
            }
        }
    }

    function endFastPayment(link){
        let popUp = popupCenter(link, 'Payment', 1000, 750);
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
            window.location.href = link;
        }
    }

    function createFastPayment(ev, order_id){
        $.ajax({
            data: {'order_id': order_id, 'identifier': "stripe"},
            type: 'POST',
            url: apiURL + '/user/order/startFastPayment',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
            },
        }).done(function (answer) {
            if(answer.success === true){
                startFastPayment(ev, answer.response.external_id, answer.response.client_secret, answer.response.link)
            } else {
                sendNotify(getMessage("general.action.message.failed"), 'danger');
                unhideBTN();
            }
        }).fail(function (err)  {
            sendNotify(getMessage("general.action.message.failed"), 'danger');
            unhideBTN();
        });
    }

    function createFastOrder(ev){
        hideBTN();
        $.ajax({
            data: {'teamId': team_id, 'discountCode': discountCode, 'affiliate_id': affiliate_id, 'roundUp': roundUp, sessionCode: 'fast', 'deliveryAddressId': deliveryAddressId, 'invoiceAddressId': invoiceAddressId},
            type: 'POST',
            url: apiURL + '/user/order/startOrder',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
            },
        }).done(function (answer) {
            if(answer.success === true){
                if(answer.response.requireIdentityCheck === true) {
                    sendNotify(getMessage("general.action.message.failed"), 'danger');
                    unhideBTN();
                } else if(answer.response.requireSessionCode === true){
                    sendNotify(getMessage("general.action.message.failed"), 'danger');
                    unhideBTN();
                } else {
                    createFastPayment(ev, answer.response.order_id);
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
}
