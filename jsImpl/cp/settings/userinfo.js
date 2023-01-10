function startAddressVerification(address_id) {
    startIdentityCheck(address_id,
        function (answer, interval) {
            if(newWindow.closed === true){
                     window.location.reload();
            }
        }, function (err) {
            $('.modal').modal('hide');
            sendNotify(getMessage("general.action.message.failed"),'danger');
        }
    );
}


// function startIdentityCheck(address_id){
//     $.ajax({
//         type: 'POST',
//         url: apiURL + '/user/settings/userInfo/address/'+address_id+'/identityCheck',
//         beforeSend: function (xhr) {
//             xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
//         },
//     }).done(function (answer) {
//         if(answer.success === true){
//             popupCenter(answer.response.url, 'IdentityCheck', 500, 750);
//             interval = setInterval(function(){
//                 if(newWindow.closed === true){
//                     window.location.reload();
//                 }
//
//                 console.log("111..")
//             }, 500);
//         } else {
//             getAlreadyStartedCheck(address_id);
//         }
//     }).fail(function (err)  {
//         getAlreadyStartedCheck(address_id);
//     });
// }
//
// function getAlreadyStartedCheck(address_id){
//     $.ajax({
//         type: 'GET',
//         url: apiURL + '/user/settings/userInfo/address/'+address_id+'/identityCheck',
//         beforeSend: function (xhr) {
//             xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
//         },
//     }).done(function (answer1) {
//         if(answer1.success === true) {
//             popupCenter(answer1.response.url, 'IdentityCheck', 500, 750);
//             interval = setInterval(function(){
//                 if(newWindow.closed === true){
//                     window.location.reload();
//                 }
//
//                 console.log("222..")
//             }, 500);
//         } else {
//             $('.modal').modal('hide');
//             sendNotify(getMessage("general.action.message.failed"), 'danger');
//         }
//     }).fail(function (err1)  {
//         $('.modal').modal('hide');
//         sendNotify(getMessage("general.action.message.failed"),'danger');
//     });
// }
