var teams = $('#teams')
var teamsCache = teams.html();
teams.sortable({
    placeholder: 'col-lg-4',
    update: function (event, ui) {
        var data = $(teams).sortable('serialize');
        $.ajax({
            data: data,
            type: 'POST',
            url: apiURL + '/user/teams/sort',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
            },
        }).done(function (answer) {
            if(answer.success !== true){
                teams.html(teamsCache).sortable('refresh')
            }
        }).fail(function (err)  {
            teams.html(teamsCache).sortable('refresh');
        });
    }
});