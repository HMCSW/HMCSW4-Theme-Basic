var callback;
const sleep = ms => new Promise(r => setTimeout(r, ms));

function addProduct(product_id, name, type, authCode, btn){
    $.ajax({
        type: "POST",
        url: apiURL + "/user/cart/addProduct",
        data: {
            "product_id": product_id,
            "type": "domain",
            "extra": {"authCode": authCode, "type": type, "name": name}
        },
        beforeSend: function (xhr) {
            xhr.setRequestHeader("Authorization", "Bearer " + accessToken);
        }
    }).done(function (answer) {
        $(".modal").modal("hide");
        document.getElementById("cartCount").textContent = answer.response.count;
        $("#cartModal-add").modal('show');
        if(document.getElementById("cartCountHeader") != null){
            document.getElementById("cartCountHeader").textContent = answer.response.count;
        }
    }).fail(function (err)  {
        $(".modal").modal("hide");

        if(err.responseJSON.response.error_message === "requireIdentityCheck") {
            startIdentityCheck(function () {
                addProduct(product_id, name, type, authCode, btn);
            }, function () {
                sendNotify(getMessage("general.action.message.failed"), 'danger');
            });
        } else if(err.status === 404){
            $("#cartModal-notFound").modal('show');
        } else if(err.status === 429){
            $("#cartModal-limit").modal('show');
        } else if(err.status === 402){
            $("#cartModal-cartFull").modal('show');
        } else {
            sendNotify(getMessage("general.action.message.failed"), "danger");
        }
    });
}

function selectDomain(btn){
    if(accessToken === ""){
        $("#cartModal-loginRequired").modal('show');
        return;
    }
    name = btn.id;
    btn.disabled = true;


    $.ajax({
        type: "POST",
        url: apiURL + "/p/domain/checkDomain",
        data: {name:name},
    }).done(function (answer) {
        btn.disabled = false;
        if(answer.success === true){
            if(answer.response.type === "new"){
                document.getElementById("cartModal-domainNew-todayPrice").textContent = answer.response.credits;
                document.getElementById("cartModal-domainNew-nextPrice").textContent = answer.response.renew;
                document.getElementById("cartModal-domainNew-name").textContent = answer.response.domainName;
                document.getElementById("cartModal-domainNew-btn").setAttribute("data-productId", answer.response.product_id);
                document.getElementById("cartModal-domainNew-btn").setAttribute("data-domainName", answer.response.domainName);


                $("#cartModal-domainNew").modal('show');

            } else if(answer.response.type === "transfer"){
                document.getElementById("cartModal-domainTransfer-todayPrice").textContent = answer.response.transfer;
                document.getElementById("cartModal-domainTransfer-nextPrice").textContent = answer.response.renew;
                document.getElementById("cartModal-domainTransfer-name").textContent = answer.response.domainName;
                document.getElementById("cartModal-domainTransfer-btn").setAttribute("data-productId", answer.response.product_id);
                document.getElementById("cartModal-domainTransfer-btn").setAttribute("data-domainName", answer.response.domainName);

                $("#cartModal-domainTransfer").modal('show');
            }
        } else {

        }
    }).fail(function ()  {
        btn.disabled = false;
        sendNotify(getMessage("general.action.message.failed"), "danger");
    });
}

function checkDomains(name, allDomains) {

    $.ajax({
        type: "POST", //GET, POST, PUT
        url: apiURL + "/p/domain/checkDomains",
        data: {name:name, allDomains:allDomains},
    }).done(function (answer) {
        if(answer.success === true){
            $("#domains_body").empty();
            $.each(answer.response.domains, function(index, value) {
                addRow(index, value)
            });

            $.each(answer.response.domains, function(index, value) {
                $.ajax({
                    type: "POST", //GET, POST, PUT
                    url: apiURL + "/p/domain/checkDomain",
                    data: {name:value["name"]},
                }).done(function (answer) {
                    if(answer.success === true){
                        updateRow(index, answer.response)
                    } else {
                        updateRow(index, {"type": "notHere", "domainName": index})
                    }
                }).fail(function ()  {
                    updateRow(index, {"type": "notHere", "domainName": index})
                });
            });
            enableCheckButton();
        } else {
            sendNotify(getMessage("general.action.message.failed"), "danger");
            enableCheckButton();
        }
    }).fail(function ()  {
        sendNotify(getMessage("general.action.message.failed"), "danger");
        enableCheckButton();
    });

}

function disableCheckButton(){
    checkButton_enable.style = "display: none";
    checkButton_disable.style = "display: block";
}

function enableCheckButton(){
    checkButton_disable.style = "display: none";
    checkButton_enable.style = "display: block";
}

const domainInput = document.getElementById("domain");
const allDomains = document.getElementById("allDomains");
domainInput.addEventListener("keyup", function(event) {
    if (event.keyCode === 13) {
        event.preventDefault();
        document.getElementById("checkButton").click();
        formSend();
    }
});


function formSend(){
    disableCheckButton();
    checkDomains(domainInput.value, allDomains.checked);
}

function updateRow(item, info){
    document.getElementById("button_" + item).innerHTML = "";
    if (info["type"] === "notHere"){
        document.getElementById("state_" + item).innerHTML = getMessage("site.products.domain.notHere");
        document.getElementById("button_" + item).innerHTML = "";
    } else if(info["type"] === "transfer"){
        btn = document.getElementById("transferButton").cloneNode(true);
        btn.id = info.domainName;
        btn.style = "display: block";

        document.getElementById("state_" + item).innerHTML = getMessage("site.products.domain.transfer");
        document.getElementById("button_" + item).appendChild(btn);
    } else if(info["type"] === "new"){
        btn = document.getElementById("buyButton").cloneNode(true);
        btn.id = info.domainName;
        btn.style = "display: block";
        document.getElementById("state_" + item).innerHTML = getMessage("site.products.domain.new");
        document.getElementById("button_" + item).appendChild(btn);
    }


}

function addRow(item, value){
    if(value["available"] === false){
        $("#domains").find("tbody")
            .append($("<tr>")
                .attr("id", item)
                .append($("<th>")
                    .text(value["name"])
                    .attr("scope", "row")
                )
                .append($("<td>"))
                .append($("<td>"))
                .append($("<td>"))
                .append($("<td>")
                    .attr("id", "state_" + item)
                    .append($("<i>")
                        .attr("class", "fa-solid fa-sync fa-spin")
                    )

                )
                .append($("<td>")
                    .attr("id", "button_" + item)

                )
            );
    } else {

        $("#domains").find("tbody")
            .append($("<tr>")
                .attr("id", item)
                .append($("<th>")
                    .text(value["name"])
                    .attr("scope", "row")
                )
                .append($("<td>")
                    .text(value["info"]["credits"])
                )
                .append($("<td>")
                    .text(value["info"]["transfer"])
                )
                .append($("<td>")
                    .text(value["info"]["renew"] + " " + getMessage("general.time.yearly"))
                )
                .append($("<td>")
                    .attr("id", "state_" + item)
                    .append($("<i>")
                        .attr("class", "fa-solid fa-sync fa-spin")
                    )

                )
                .append($("<td>")
                    .attr("id", "button_" + item)

                )
            );
    }

}
