var callback;
const sleep = ms => new Promise(r => setTimeout(r, ms));
function addToCart(productId){
    if(accessToken === ''){
        $('#cartModal-loginRequired').modal("show");
        return;
    }

    $.ajax({
        data: {'product_id': productId},
        type: 'POST',
        url: apiURL + '/user/cart/addProduct',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        },
    }).done(function (answer) {
        document.getElementById('cartCount').textContent = answer.response.count;
        $('#cartModal-add').modal("show");
        if(document.getElementById('cartCountHeader') != null){
            document.getElementById('cartCountHeader').textContent = answer.response.count;
        }
    }).fail(function (err)  {
        if(err.responseJSON.response.error_message === "requireIdentityCheck"){
            $("#cartModal-requireIdentityCheck" ).data( "productId", productId );
            $('#cartModal-requireIdentityCheck').modal("show");
        } else if(err.status === 404){
            $('#cartModal-notFound').modal("show");
        } else if(err.status === 429){
            $('#cartModal-limit').modal("show");
        } else if(err.status === 402){
            $('#cartModal-cartFull').modal("show");
        } else {
            sendNotify(getMessage("general.action.message.failed"),'danger');
        }
    });
}

function startAddressVerification() {
    startIdentityCheck(0,
        async function (answer, interval) {
            $('#cartModal-requireIdentityCheck').modal('hide');
            clearInterval(interval);
            await sleep(200);
            addToCart($("#cartModal-requireIdentityCheck").data("productId"));
        },
        function (err) {
            $('#cartModal-requireIdentityCheck').modal('hide');
            sendNotify(getMessage("general.action.message.failed"),'danger');
        }
    );
}