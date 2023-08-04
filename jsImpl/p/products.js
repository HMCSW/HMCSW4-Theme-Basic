var callback;
const sleep = ms => new Promise(r => setTimeout(r, ms));
function addToCart(btn){
    var productId = btn.id;
    var locationId = document.getElementById('location-'+productId).value;

    if(accessToken === ''){
        $('#cartModal-loginRequired').modal('show');
        return;
    }

    $.ajax({
        data: {'product_id': productId, 'location_id': locationId},
        type: 'POST',
        url: apiURL + '/user/cart/addProduct',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        },
    }).done(function (answer) {
        document.getElementById('cartCount').textContent = answer.response.count;
        $('#cartModal-add').modal('show');
        if(document.getElementById('cartCountHeader') != null){
            document.getElementById('cartCountHeader').textContent = answer.response.count;
        }
    }).fail(function (err)  {
        if(err.responseJSON.response.error_message === "requireIdentityCheck"){
            startIdentityCheck(function () {
                addToCart(productId);
            }, function () {
                sendNotify(getMessage("general.action.message.failed"), 'danger');
            });
        } else if(err.status === 404){
            $('#cartModal-notFound').modal('show');
        } else if(err.status === 429){
            $('#cartModal-limit').modal('show');
        } else if(err.status === 402){
            $('#cartModal-cartFull').modal('show');
        } else {
            sendNotify(getMessage("general.action.message.failed"),'danger');
        }
    });
}

window.onload = function(){

    var url = document.location.toString();
    if (url.match('#')) {
        $('.nav-tabs a[href="#' + url.split('#')[1] + '"]').tab('show');
    }

    $('.nav-tabs a[href="#' + url.split('#')[1] + '"]').on('shown', function (e) {
        window.location.hash = e.target.hash;
    });
}