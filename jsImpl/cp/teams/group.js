function updateGeneralPermission(permission, status){
    $.ajax({
        data: {'permission': permission, 'status':  status === true ? 1 : 0},
        type: 'PUT',
        url: apiURL + '/user/teams/' + team_id + '/groups/' + group_id + '/permission',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer '+ accessToken);
        },
    }).done(function (answer) {
        if(answer.success === true){
            sendNotify(getMessage("site.cp.teams.action.message.updatePermission"), 'success');
        } else {
            sendNotify(getMessage("site.cp.teams.action.message.updatePermissionFailed"), 'danger');
        }
    }).fail(function (err)  {
        sendNotify(getMessage("site.cp.teams.action.message.updatePermissionFailed"), 'danger');
    });
}


function updateServicePermission(permission, status, service_id){
    $.ajax({
        data: {'permission': permission, 'status': status, 'service_id': service_id},
        type: 'PUT',
        url: apiURL + '/user/teams/' + team_id + '/groups/' + group_id + '/permission',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer '+ accessToken);
        },
    }).done(function (answer) {
        if(answer.success === true){
            sendNotify(getMessage("site.cp.teams.action.message.updatePermission"), 'success');
        } else {
            sendNotify(getMessage("site.cp.teams.action.message.updatePermissionFailed"), 'danger');
        }
    }).fail(function (err)  {
        sendNotify(getMessage("site.cp.teams.action.message.updatePermissionFailed"), 'danger');
    });
}
