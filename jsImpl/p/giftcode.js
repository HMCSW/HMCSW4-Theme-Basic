function addToCart(amount){
    if(accessToken === ""){
        $("#cartModal-loginRequired").modal();
        return;
    }


    $.ajax({
        data: {"amount": amount},
        type: "POST",
        url: apiURL + "/user/cart/addGiftcode",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Bearer " + accessToken);
        },
    }).done(function (answer) {
        document.getElementById("cartCount").textContent = answer.response.count;
        $("#cartModal-add").modal();
        if(document.getElementById("cartCountHeader") != null){
            document.getElementById("cartCountHeader").textContent = answer.response.count;
        }
    }).fail(function (err)  {
        if(err.status == 404){
            $("#cartModal-notFound").modal();
        } else if(err.status == 429){
            $("#cartModal-limit").modal();
        } else if(err.status == 402){
            $("#cartModal-cartFull").modal();
        } else {
            sendNotify(getMessage("general.action.message.failed"),'danger');
        }
    });
}