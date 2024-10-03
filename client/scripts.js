// Initialize Wavesurfer and other variables

document.getElementById('loginBtn').addEventListener('click', function () {
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    if (email && password) {
        // Make POST request to /api/token/ for JWT authentication
        fetch('http://localhost:8000/api/token/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email: email, password: password })
        })
            .then(response => {
                if (response.status === 200) {
                    // Handle successful response
                    return response.json();
                } else {
                    // Show error message in a toast for non-200 status codes
                    showErrorToast('Login failed: ' + response.status);
                    // Optionally return a rejected promise to prevent further processing
                    return Promise.reject('Login failed: ' + response.status);
                }
            })
            .then(data => {
                if (data.access) {
                    // Store the JWT token in localStorage
                    localStorage.setItem('jwtToken', data.access);

                    // Hide login form and show upload section
                    document.getElementById('loginForm').style.display = 'none';
                    document.getElementById('mainContainer').style.display = 'block';

                    // Get the toast element
                    const toastElement = document.getElementById('loginToast');
                    const toast = new bootstrap.Toast(toastElement);

                    // Show the toast
                    toast.show();
                } else {
                    // Display error message
                    document.getElementById('loginError').style.display = 'block';
                }
            })
            .catch(error => {
                // Display error message in a toast
                showErrorToast('Invalid login data');
            });
    }
});

// Function to show error in a toast
function showErrorToast(message) {
    // Get the error toast element
    const errorToastElement = document.getElementById('loginErrorToast');

    // Set the toast body content to the error message
    errorToastElement.querySelector('.toast-body').textContent = message;

    // Show the toast
    const toast = new bootstrap.Toast(errorToastElement);
    toast.show();
}

// Function to fetch allowed speakers and populate the dropdown
function fetchAllowedSpeakers() {
    const media_filter = document.getElementById('filterDropdown').value;

    fetch(`http://localhost:8000/api/allowed-media?media_filter=${media_filter}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("jwtToken")}`
        },
    })
        .then(response => response.json())
        .then(data => {
            const speakerDropdown = document.getElementById('speakerDropdown');
            data.forEach(speaker => {
                let option = document.createElement('option');
                option.value = speaker.id;
                const image_file = speaker.image_file.split("\\").pop();
                option.textContent = `Speaker ${speaker.speaker_id} (${image_file})`;
                speakerDropdown.appendChild(option);
            });
        })
        .catch(error => console.error('Error fetching speakers:', error));
}

// Function to refresh allowed speakers and repopulate the dropdown
function refreshAllowedSpeakers() {
    // Clear the existing options in the dropdown
    const speakerDropdown = document.getElementById('speakerDropdown');
    speakerDropdown.innerHTML = '<option value="" disabled selected>Select a speaker</option>'; // Reset to default option

    // Fetch the allowed speakers again
    fetchAllowedSpeakers();
}

// Attach the refresh button click event
document.getElementById('refreshBtn').addEventListener('click', refreshAllowedSpeakers);

// Event listener for dropdown change
document.getElementById('speakerDropdown').addEventListener('change', function () {
    const selectedSpeakerId = this.value;

    if (selectedSpeakerId) {
        // Fetch audio, image, and bounding box data for the selected speaker
        fetch(`http://localhost:8000/api/speaker-data/${selectedSpeakerId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem("jwtToken")}`
            },
        })
            .then(response => response.json())
            .then(data => {
                // Decode Base64 audio
                const audioElement = document.getElementById('speakerAudio');
                audioElement.src = `data:audio/mpeg;base64,${data.audio_file}`; // Adjust MIME type as needed

                // Decode Base64 image
                const imageElement = document.getElementById('speakerImage');
                imageElement.src = `data:image/jpeg;base64,${data.image_file}`; // Adjust MIME type as needed

                // Decode Base64 text file containing bounding boxes
                const boundingBoxesElement = document.getElementById('boundingBoxes');
                boundingBoxesElement.innerHTML = ''; // Clear previous bounding boxes

                // Decode Base64 text and process rows
                const decodedText = atob(data.text_file); // Decode the Base64 text file
                const rows = decodedText.trim().split('\n'); // Split by new line

                if (rows.length > 0 && rows[0]) {
                    rows.forEach((row, index) => {
                        const dropdown = document.createElement('select');
                        dropdown.className = 'form-select';

                        // Assuming options are predefined; adjust as necessary
                        const options = ['Option 1', 'Option 2', 'Option 3'];
                        options.forEach(option => {
                            const opt = document.createElement('option');
                            opt.value = option;
                            opt.textContent = option;
                            dropdown.appendChild(opt);
                        });

                        const label = document.createElement('label');
                        label.textContent = `Bounding Box ${index + 1}: `;
                        boundingBoxesElement.appendChild(label);
                        boundingBoxesElement.appendChild(dropdown);
                    });
                } else {
                    boundingBoxesElement.textContent = 'No bounding boxes found';
                }

                // Show the data display section
                document.getElementById('dataDisplay').style.display = 'block';
            })
            .catch(error => console.error('Error fetching speaker data:', error));
    } else {
        // Hide the data display section if no speaker is selected
        document.getElementById('dataDisplay').style.display = 'none';
    }
});


// Check if the user is already logged in (JWT token exists)
window.onload = function () {
    const token = localStorage.getItem('jwtToken');
    if (token) {
        document.getElementById('loginForm').style.display = 'none';
        document.getElementById('mainContainer').style.display = 'block';
    } else {
        document.getElementById('loginForm').style.display = 'block';
        document.getElementById('mainContainer').style.display = 'none';
    }
};

