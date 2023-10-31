function updateLock(state){
    $.ajax({
        data: {'state': state},
        type: 'PATCH',
        url: apiURL + '/user/teams/'+team_id+'/services/'+service_id+'/lock',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        },
    }).done(function (answer) {
        if(answer.response.requireSessionCode) {
            startTwoFactorConfirmation(answer.response.sessionCode, function () {
                $.ajax({
                    data: {'state': state, 'sessionCode': answer.response.sessionCode},
                    type: 'PATCH',
                    url: apiURL + '/user/teams/'+team_id+'/services/'+service_id+'/lock',
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
                    },
                }).done(function (answer) {
                    if(state){
                        sendNotify(getMessage("site.cp.service.action.message.lock"), "success");
                    } else {
                        sendNotify(getMessage("site.cp.service.action.message.unlock"), "success");
                    }
                    location.reload();
                }).fail(function (answer) {
                    document.getElementById("lock").checked = !state;
                    sendNotify(getMessage("site.cp.service.action.message.lockFailed"), "danger");
                });
            }, function () {
                document.getElementById("lock").checked = !state;
                sendNotify(getMessage("site.cp.service.action.message.lockFailed"), "danger");
            });
        } else {
            location.reload();
            sendNotify(getMessage("site.cp.service.action.message.lock"), "success");
        }
    }).fail(function (answer) {
        document.getElementById("lock").checked = !state;
        sendNotify(getMessage("site.cp.service.action.message.lockFailed"), "danger");
    });
}

function terminateService(){
    $.ajax({
        type: 'DELETE',
        url: apiURL + '/user/teams/'+team_id+'/services/'+service_id+'/terminateService',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        },
    }).done(function (answer) {
        if(answer.response.requireSessionCode) {
            $('#terminate_later').modal('hide');
            startTwoFactorConfirmation(answer.response.sessionCode, function () {
                $.ajax({
                    data: {'sessionCode': answer.response.sessionCode},
                    type: 'DELETE',
                    url: apiURL + '/user/teams/'+team_id+'/services/'+service_id+'/terminateService',
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
                    },
                }).done(function (answer) {
                    $('.modal').modal('hide');
                    sendNotify(getMessage("site.cp.service.action.message.terminated"), "success");
                    location.reload();
                }).fail(function (answer) {
                    $('.modal').modal('hide');
                    sendNotify(getMessage("site.cp.service.action.message.terminateFailed"), "danger");
                });
            }, function () {
                $('.modal').modal('hide');
                sendNotify(getMessage("site.cp.service.action.message.terminateFailed"), "danger");
            });
        } else {
            $('.modal').modal('hide');
            location.reload();
            sendNotify(getMessage("site.cp.service.action.message.terminated"), "success");
        }
    }).fail(function (answer) {
        $('.modal').modal('hide');
        sendNotify(getMessage("site.cp.service.action.message.terminateFailed"), "danger");
    });
}
function terminateServiceInstant(){
    $.ajax({
        type: 'DELETE',
        url: apiURL + '/user/teams/'+team_id+'/services/'+service_id+'/terminateServiceInstant',
        beforeSend: function (xhr) {
            xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
        },
    }).done(function (answer) {
        if(answer.response.requireSessionCode) {
            $('#terminate_later').modal('hide');
            startTwoFactorConfirmation(answer.response.sessionCode, function () {
                $.ajax({
                    data: {'sessionCode': answer.response.sessionCode},
                    type: 'DELETE',
                    url: apiURL + '/user/teams/'+team_id+'/services/'+service_id+'/terminateServiceInstant',
                    beforeSend: function (xhr) {
                        xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
                    },
                }).done(function (answer) {
                    $('.modal').modal('hide');
                    sendNotify(getMessage("site.cp.service.action.message.terminated"), "success");
                    location.reload();
                }).fail(function (answer) {
                    $('.modal').modal('hide');
                    sendNotify(getMessage("site.cp.service.action.message.terminateFailed"), "danger");
                });
            }, function () {
                $('.modal').modal('hide');
                sendNotify(getMessage("site.cp.service.action.message.terminateFailed"), "danger");
            });
        } else {
            $('.modal').modal('hide');
            location.reload();
            sendNotify(getMessage("site.cp.service.action.message.terminated"), "success");
        }
    }).fail(function (answer) {
        $('.modal').modal('hide');
        sendNotify(getMessage("site.cp.service.action.message.terminateFailed"), "danger");
    });
}

var renewSelect = document.getElementById("renewSelect");
var renewSelectMethods = document.getElementById("renewSelectMethods");
var renewSubmit = document.getElementById("renewSubmit");
var methods = [];
var amount = 0;

if(renewSelect){
    renewSelect.addEventListener("change", function () {
        renewSelect.disabled = true;
        amount = renewSelect.options[renewSelect.selectedIndex].getAttribute('data-amount');

        getMethods(amount);

        function getMethods(amount) {
            $.ajax({
                url: apiURL + '/user/teams/' + team_id + '/services/' + service_id + '/renew/methods',
                type: 'GET',
                data: {
                    "amount": amount
                },
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
                },
            }).done(function (data) {
                renewSelect.disabled = false;
                methods = data.response;
                renewSelectMethods.innerHTML = '';
                if (data.response.length !== 0) {
                    renewSelectMethods.disabled = false;
                }

                renewSelectMethods.innerHTML = '<option value="" selected disabled hidden>' + getMessage("site.cp.service.renew.modal.methods") + '</option>';

                for (key in methods) {
                    const method = methods[key];
                    renewSelectMethods.innerHTML += '<option value="' + key + '">' + method.name + '</option>'
                }
            }).fail(function (jqXHR, textStatus, errorThrown) {
            });
        }
    });
}

function hideBTN(){
    renewSubmit.disabled = true;
}

function unhideBTN(){
    renewSubmit.disabled = false;
}

if(renewSelect) {
    renewSelectMethods.addEventListener("change", function () {
        renewSubmit.disabled = false;
    });


    renewSubmit.addEventListener("click", function () {
        startOrder();

        function startOrder() {
            hideBTN();
            createOrder(null);
        }

        function createOrder(sessionCode) {
            paymentMethod = methods[renewSelectMethods.value];

            $.ajax({
                data: {
                    'time': renewSelect.value,
                    sessionCode: sessionCode,
                    'team_id': team_id,
                    'service_id': service_id
                },
                type: 'POST',
                url: apiURL + '/user/order/startRenew',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
                },
            }).done(function (answer) {
                if (answer.success === true) {
                    if (answer.response.requireIdentityCheck === true) {
                        startIdentityCheck(function () {
                            createOrder(null);
                        }, function () {
                            sendNotify(getMessage("general.action.message.failed"), 'danger');
                            unhideBTN();
                        });
                    } else if (answer.response.requireSessionCode === true) {
                        startTwoFactorConfirmation(answer.response.sessionCode, function () {
                            createOrder(answer.response.sessionCode);
                        }, function () {
                            sendNotify(getMessage("general.action.message.failed"), 'danger');
                            unhideBTN();
                        });
                    } else {
                        startPayment(answer.response.order_id, paymentMethod);
                    }

                } else {
                    sendNotify(getMessage("general.action.message.failed"), 'danger');
                    unhideBTN();
                }
            }).fail(function (err) {
                sendNotify(getMessage("general.action.message.failed"), 'danger');
                unhideBTN();
            });
        }


        function startPayment(order_id, paymentMethod) {
            var method;
            if (paymentMethod.type === 'oneTime') {
                method = paymentMethod.method;
            } else {
                method = paymentMethod.id;
            }

            $.ajax({
                data: {'method': method, 'paymentType': paymentMethod.type, 'order_id': order_id},
                type: 'POST',
                url: apiURL + '/user/order/startPayment',
                beforeSend: function (xhr) {
                    xhr.setRequestHeader('Authorization', 'Bearer ' + accessToken);
                },
            }).done(function (answer) {
                if (answer.success === true) {
                    popUp = popupCenter(answer.response.link, 'Payment', 1000, 750);
                    if (popUp === true) {
                        showPaymentLoadingModal();
                        interval = setInterval(function () {
                            if (newWindow.closed === true) {
                                $('#paymentLoadingModal').modal('hide');
                                unhideBTN();
                                clearInterval(interval);
                            }
                        }, 500);
                    } else {
                        window.location.href = answer.response.link;
                    }
                } else {
                    sendNotify(getMessage("general.action.message.failed"), 'danger');
                    unhideBTN();
                }
            }).fail(function (err) {
                sendNotify(getMessage("general.action.message.failed"), 'danger');
                unhideBTN();
            });
        }
    });
}

function showPaymentLoadingModal(){
    $('#paymentLoadingModal').modal('show', {backdrop: 'static', keyboard: false, focus: true});
}

function focusWindow(){
    newWindow.focus();
}