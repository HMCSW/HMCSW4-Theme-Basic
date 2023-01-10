var interval;
interval = setInterval(function(){ checkOrder( orderId) }, 2000);


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
    }).fail(function (err)  {});
}