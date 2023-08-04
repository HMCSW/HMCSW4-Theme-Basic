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
        $("#cartModal-loginRequired").modal('show');
        return;
    }
    var locationId = document.getElementById('location-'+productId).value;

    $.ajax({
        data: {
            "product_id": productId,
            "type": "teamspeak",
            'location_id': locationId,
            "extra": {"slots": slots}
        },
        type: "POST",
        url: apiURL + "/user/cart/addProduct",
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Bearer " + accessToken);
        },
    }).done(function (answer) {
        document.getElementById("cartCount").textContent = answer.response.count;
        $("#cartModal-add").modal('show');
        if (document.getElementById("cartCountHeader") != null) {
            document.getElementById("cartCountHeader").textContent = answer.response.count;
        }
    }).fail(function (err) {
        if(err.responseJSON.response.error_message === "requireIdentityCheck") {
            startIdentityCheck(function () {
                addToCart(productId, slots);
            }, function () {
                sendNotify(getMessage("general.action.message.failed"), 'danger');
            });
        } else if (err.status === 404) {
            $("#cartModal-notFound").modal('show');
        } else if (err.status === 429) {
            $("#cartModal-limit").modal('show');
        } else if (err.status === 402) {
            $("#cartModal-cartFull").modal('show');
        } else {
            sendNotify(getMessage("general.action.message.failed"),'danger');
        }
    });
}