
function showLoader(loader, area){
    document.getElementById(loader).style = 'display:block';
    document.getElementById(area).style = 'display:none';
}
function showArea(loader, area){
    document.getElementById(area).style = 'display:block';
    document.getElementById(loader).style = 'display:none';
}

function payInvoice(invoice_id){
    showLoader('invoiceBTN_' + invoice_id + '_loader', 'invoiceBTN_' + invoice_id + '_2');
    $.ajax({
        type: 'POST',
        url: apiURL + '/user/invoices/' + invoice_id + '/pay',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        },
    }).done(function (answer) {
        if(answer.success === true){
            showArea('invoiceBTN_' + invoice_id + '_loader', 'invoiceBTN_' + invoice_id + '_1');
            sendNotify(getMessage("site.cp.invoice.member.action.message.invoicePayed"), 'success');
        } else {
            showArea('invoiceBTN_' + invoice_id + '_loader', 'invoiceBTN_' + invoice_id + '_2');
            sendNotify(getMessage("site.cp.invoice.member.action.message.invoiceNotPayed"), 'danger');
        }
    }).fail(function (err)  {
        showArea('invoiceBTN_' + invoice_id + '_loader', 'invoiceBTN_' + invoice_id + '_2');
        sendNotify(getMessage("site.cp.invoice.member.action.message.invoiceNotPayed"), 'danger');
    });
}


function showInvoicePDF(invoice_id){

    $.ajax({
        type: 'GET',
        url: apiURL + '/user/invoices/' + invoice_id + '/file',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        },
    }).done(function (answer) {
        if(answer.success === true){
            const fancybox = new Fancybox([
                {
                    src: answer.response,
                    type: 'pdf',
                },
            ]);

        } else {
            sendNotify(getMessage("general.action.message.failed"), 'danger');
        }
    }).fail(function (err)  {
        sendNotify(getMessage("general.action.message.failed"), 'danger');
    });
}