function startAddressVerification(address_id) {
    startIdentityCheck(
        function () {
            if(newWindow.closed === true){
                     window.location.reload();
            }
        }, function () {
            $('.modal').modal('hide');
            sendNotify(getMessage("general.action.message.failed"),'danger');
        }, address_id, true
    );
}
