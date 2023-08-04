function deleteTeam(){
    $.ajax({
        url: apiURL+'/user/teams/'+team_id,
        type: 'delete',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        },
    }).done(function (answer) {
        if (answer.success === true) {
            if (answer.response.requireSessionCode === true) {
                $('.modal').modal('hide');
                startTwoFactorConfirmation(answer.response.sessionCode, function () {
                    $.ajax({
                        data: {sessionCode: answer.response.sessionCode},
                        url: apiURL+'/user/teams/'+team_id,
                        type: 'delete',
                        beforeSend: function (xhr) {
                            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
                        },
                    }).done(function (answer) {
                        document.getElementById('deleteTeamSubmit').disabled = false;
                        if(answer.success === false){
                            document.getElementById('deleteTeamSubmit').disabled = false;
                            sendNotify(getMessage('site.cp.teams.settings.action.message.deleteTeamFailed'), 'danger');
                        } else {
                            location.reload();
                        }
                    }).fail(function (err) {
                        document.getElementById('deleteTeamSubmit').disabled = false;
                        sendNotify(getMessage('site.cp.teams.settings.action.message.deleteTeamFailed'), 'danger');
                    });
                }, function (){
                    document.getElementById('deleteTeamSubmit').disabled = false;
                    sendNotify(getMessage('site.cp.teams.settings.action.message.deleteTeamFailed'), 'danger');
                });
            } else {
                location.reload();
            }
        } else {
            document.getElementById('deleteTeamSubmit').disabled = false;
            sendNotify(getMessage('site.cp.teams.settings.action.message.deleteTeamFailed'), 'danger');
        }
    }).fail(function (err) {
        document.getElementById('deleteTeamSubmit').disabled = false;
        sendNotify(getMessage('site.cp.teams.settings.action.message.deleteTeamFailed'), 'danger');
    });


}

document.getElementById('deleteTeamSubmit').addEventListener('click', function () {
    deleteTeam();
});