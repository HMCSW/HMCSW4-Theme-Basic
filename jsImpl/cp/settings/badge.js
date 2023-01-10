var badges = $('#badges')
var badgeCache = badges.html();

badges.sortable({
    placeholder: 'list-group-item list-group-item-action',
    update: function (event, ui) {
        var data = $(badges).sortable('serialize');
        $.ajax({
            data: data,
            type: 'POST',
            url: apiUrl + '/user/settings/badges/sort',
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
            },
        }).done(function (answer) {
            if(answer.success !== true){
                badges.html(badgeCache).sortable('refresh')
            }
        }).fail(function (err)  {
            badges.html(badgeCache).sortable('refresh');
        });
    }
});