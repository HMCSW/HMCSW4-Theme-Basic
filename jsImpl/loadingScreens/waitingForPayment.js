var interval;
interval = setInterval(function(){ checkOrder( orderId) }, 2000);


function showWaitingMessage(){
    document.getElementById('waitingMessage').style.display = 'block';
    document.getElementById('spinner').classList = 'spinner-border text-warning';
}
function showFailedMessage(){
    document.getElementById('waitingMessage').style.display = 'none';
    document.getElementById('failedMessage').style.display = 'block';
    document.getElementById('spinner').style.display = 'none';
    document.getElementById('failedIcon').style = 'width: 3rem; height: 3rem;';
}


let failCount = 0;
function checkOrder(order_id){
    $.ajax({
        data: {'order_id': order_id},
        type: 'POST',
        url: apiURL + '/user/order/checkOrder',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        },
    }).done(function (answer) {
        if(answer.success === true){
            if(window.opener == null){
                if (answer.response.type === 'done') {
                    window.location.href = answer.response.return;
                } else if (answer.response.type === 'failed') {
                    window.location.href = answer.response.return;
                }
            } else {
                if (answer.response.type === 'done') {
                    window.opener.location.href = answer.response.return;
                    window.close();
                } else if (answer.response.type === 'failed') {
                    window.opener.sendNotify(getMessage('site.cart.end.action.message.paymentError'), 'danger')
                    window.close();
                }
            }
        }
    }).fail(function (err)  {
        failCount++;
        if(failCount > 15){
            showWaitingMessage();
        }
        if(failCount > 40){
            showFailedMessage();
        }
    });
}