
window.addEventListener('load',  function (){
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);

    if(!urlParams.has('code') || !urlParams.has('state')){
        window.close();
    }

    let redirectUrl = new URL(url+'/auth/login');

    redirectUrl.searchParams.append('code', urlParams.get('code'));
    redirectUrl.searchParams.append('state', urlParams.get('state'));
    redirectUrl.searchParams.append('return_to', urlParams.get('return_to'));
    redirectUrl.searchParams.append('remoteLogin', urlParams.get('name'));



    if(window.opener == null){
        window.location.href = redirectUrl.href;
    } else {
        window.opener.location.href = redirectUrl.href;
        window.close();
    }
});