var callback;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function calculateCredits() {
    const slots = document.getElementById("slots").value;
    let credits = (slots * amount) / 100;

    credits = (credits * 100) / 100;
    credits = credits.toFixed(2);

    document.getElementById("prizeDiv").innerHTML = credits + "€ / Monat";
    document.getElementById("slotsDiv").innerHTML = slots + " Slots";
}


function addToCart(productId, slots) {

    if (accessToken === "") {
        $("#cartModal-loginRequired").modal();
        return;
    }

    $.ajax({
        data: {
            "product_id": productId,
            "type": "teamspeak",
            "extra": {"slots": slots}
        },
        type: "POST",
        url: apiURL + "/user/cart/addProduct",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Bearer " + accessToken);
        },
    }).done(function (answer) {
        document.getElementById("cartCount").textContent = answer.response.count;
        $("#cartModal-add").modal();
        if (document.getElementById("cartCountHeader") != null) {
            document.getElementById("cartCountHeader").textContent = answer.response.count;
        }
    }).fail(function (err) {
        if(err.responseJSON.response.error_message === "requireIdentityCheck") {
            modal = $("#cartModal-requireIdentityCheck");
            modal.data( "productId", productId );
            modal.data( "slots", slots );
            modal.modal();
        } else if (err.status === 404) {
            $("#cartModal-notFound").modal();
        } else if (err.status === 429) {
            $("#cartModal-limit").modal();
        } else if (err.status === 402) {
            $("#cartModal-cartFull").modal();
        } else {
            sendNotify(getMessage("general.action.message.failed"),'danger');
        }
    });
}


function startAddressVerification() {
    startIdentityCheck(0,
        async function (answer, interval) {
            modal = $("#cartModal-requireIdentityCheck");
            modal.modal('hide');
            clearInterval(interval);
            await sleep(200);
            addToCart(modal.data("productId"), modal.data("slots"));
        },
        function (err) {
            $('#cartModal-requireIdentityCheck').modal('hide');
            sendNotify(getMessage("general.action.message.failed"),'danger');
        }
    );
}