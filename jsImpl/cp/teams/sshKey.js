function toggleAutoInstall(object){

    $.ajax({
        data: {'status': object.checked === true ? 1 : 0},
        type: 'POST',
        url: apiURL + '/user/teams/' + team_id + '/sshKeys/' + object.id + '/autoInstall',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        },
    }).done(function (answer) {
        if(answer.success === true){
            sendNotify(getMessage("general.action.message.success"), 'success');
        } else {
            sendNotify(getMessage("general.action.message.failed"), 'danger');
        }
    }).fail(function (err)  {
        sendNotify(getMessage("general.action.message.failed"), 'danger');
    });
}