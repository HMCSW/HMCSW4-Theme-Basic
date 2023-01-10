function editMember(object){
    $.ajax({
        data: {'group_id': object.value},
        type: 'PUT',
        url: apiURL + '/user/teams/' + team_id + '/members/' + object.dataset.userid,
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer '+ accessToken);
        },
    }).done(function (answer) {
        if(answer.success === true){
            document.getElementById('editMember-'+ object.dataset.userid +'-name').innerHTML = answer.response.name
            document.getElementById('editMember-'+ object.dataset.userid +'-dropDown').innerHTML = answer.response.name

            sendNotify(getMessage("general.action.message.success"), 'success');
        } else {
            sendNotify(getMessage("general.action.message.failed"), 'danger');
        }
    }).fail(function (err)  {
        sendNotify(getMessage("general.action.message.failed"), 'danger');
    });
}

function removeMember(user_id){
    $.ajax({
        type: 'DELETE',
        url: apiURL + '/user/teams/' + team_id + '/members/' + user_id,
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer '+ accessToken);
        },
    }).done(function (answer) {
        if(answer.success === true){
            document.getElementById('icon-'+ user_id).remove()
            document.getElementById('user-'+ user_id).remove()
            $('.modal').modal('hide');

            sendNotify(getMessage("general.action.message.success"), 'success');
        } else {
            sendNotify(getMessage("general.action.message.failed"), 'danger');
        }
    }).fail(function (err)  {
        sendNotify(getMessage("general.action.message.failed"), 'danger');
    });
}
