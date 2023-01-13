function addToCart(amount){
    if(accessToken === ""){
        $("#cartModal-loginRequired").modal("show");
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
        $("#cartModal-add").modal("show");
        if(document.getElementById("cartCountHeader") != null){
            document.getElementById("cartCountHeader").textContent = answer.response.count;
        }
    }).fail(function (err)  {
        if(err.status === 404){
            $("#cartModal-notFound").modal("show");
        } else if(err.status === 429){
            $("#cartModal-limit").modal("show");
        } else if(err.status === 402){
            $("#cartModal-cartFull").modal("show");
        } else {
            sendNotify(getMessage("general.action.message.failed"),'danger');
        }
    });
}