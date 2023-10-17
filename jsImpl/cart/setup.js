console.log("setup.js loaded");

function saveConfig(item){
    itemId = item.id;
    item.disabled = true;

    formName = "form_" + itemId;
    inputs = document.forms[formName].getElementsByClassName("configForm");

    var config = {};
    for (var i = 0; i < inputs.length; i++) {
        input  = inputs[i];
        var value;

        if(input.type === "checkbox") {
            value = input.checked;
        } else if(input.tagName === "SELECT" && input.multiple === true) {
            console.log(input.name);
            value = getSelectValues(input);
        } else {
            value = input.value;
        }

        if(value === " " || value.length === 0 || value === "undefined") {
            value = null;
        }
        if(value === null && input.required === true) {
            alert("Please fill in all required fields");
            return;
        }

        config[input.name] = value;
    }

    $.ajax({
        url: apiURL+"/user/cart/config/" + itemId,
        type: "patch",
        data: {config: JSON.stringify(config)},
        contentType: "application/json",
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
            xhr.setRequestHeader('Content-Type', 'application/json');
        }
    }).done(function(data) {
        sendNotify(getMessage("general.action.message.success"), "success");
        item.disabled = false;
    }).fail(function(data) {
        sendNotify(getMessage("general.action.message.failed"), "danger");
        item.disabled = false;
    });
}

function getSelectValues(select) {
    var result = [];
    var options = select && select.options;
    var opt;

    for (var i=0, iLen=options.length; i<iLen; i++) {
        opt = options[i];

        if (opt.selected) {
            result.push(opt.value || opt.text);
        }
    }
    return result;
}