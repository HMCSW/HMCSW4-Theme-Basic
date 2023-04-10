const { platformAuthenticatorIsAvailable, startRegistration } = SimpleWebAuthnBrowser;

document.getElementById('radio-mode-integrated').disabled = !platformAuthenticatorIsAvailable;

async function setupFido2() {
    const fido_name = document.getElementById('fido-name').value;

    let mode;

    if (document.getElementById('radio-mode-physical').checked) {
        mode = "physical";
    } else {
        mode = "integrated";
    }

    const resp = await fetch(apiURL + '/auth/fido2/register/option', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + accessToken
        },
        body: JSON.stringify({
            keyName: fido_name,
            mode: mode
        })
    });

    let attResp;
    try {
        // Pass the options to the authenticator and wait for a response
        attResp = await startRegistration(await resp.json());

        // POST the response to the endpoint that calls
        // @simplewebauthn/server -> verifyRegistrationResponse()
        const verificationResp = await fetch(apiURL + '/auth/fido2/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + accessToken
            },
            body: JSON.stringify(attResp),
        });

        // Wait for the results of verification
        const verificationJSON = await verificationResp.json();

        // Show UI appropriate for the `verified` status
        if (verificationJSON.success) {
            sendNotify(getMessage("general.action.message.success"), 'success');
            location.reload();
        } else {
            sendNotify(getMessage("general.action.message.failed") + ": "+ verificationJSON.response.error_message, "danger");
        }

    } catch (error) {
        sendNotify(getMessage("general.action.message.failed") + ": " + error.message, "danger");
    }

}