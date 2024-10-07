// Handle "Enter" key press for login
document.getElementById('loginForm').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        event.preventDefault(); // Prevent the form from being submitted in the default way
        loginUser(); // Trigger the login process
    }
});

// Function to login user
function loginUser() {
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
                    return response.json();
                } else {
                    showErrorToast('Login failed: ' + response.status);
                    return Promise.reject('Login failed: ' + response.status);
                }
            })
            .then(data => {
                if (data.access) {
                    if (!isTokenExpired(data.access)) {
                        localStorage.setItem('jwtToken', data.access);
                        // Hide login form
                        document.getElementById('loginForm').classList.add('d-none');
                        // Show main container
                        document.getElementById('mainContainer').classList.remove('d-none');
                        document.getElementById('mainContainer').classList.add('d-flex');

                        // Show login success toast
                        const toastElement = document.getElementById('loginToast');
                        const toast = new bootstrap.Toast(toastElement);
                        toast.show();
                    } else {
                        showErrorToast('Token is expired, please log in again.');
                    }
                } else {
                    document.getElementById('loginError').style.display = 'block';
                }
            })
            .catch(error => showErrorToast('Invalid login data'));
    }
}

// Attach event to login button
document.getElementById('loginBtn').addEventListener('click', loginUser);

// Reset Button functionality
document.getElementById('resetBtn').addEventListener('click', function () {
    document.getElementById('speakerAudio').src = '';
    document.getElementById('speakerImage').src = '';
    document.getElementById('boundingBoxes').innerHTML = '';
    document.getElementById('dataDisplay').style.display = 'none';
});

// Function to show error in a toast
function showErrorToast(message) {
    const errorToastElement = document.getElementById('loginErrorToast');
    errorToastElement.querySelector('.toast-body').textContent = message;
    const toast = new bootstrap.Toast(errorToastElement);
    toast.show();
}

// Function to check if the token is expired
function isTokenExpired(token) {
    try {
        const decoded = jwt_decode(token);
        const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds
        return decoded.exp < currentTime;
    } catch (error) {
        console.error("Error decoding token:", error);
        return true; // Treat invalid tokens as expired
    }
}

// Function to fetch media data and populate the table
async function fetchMediaData() {
    const token = localStorage.getItem("jwtToken");

    if (token && !isTokenExpired(token)) {
        try {
            const response = await fetch('http://localhost:8000/api/allowed-media', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            populateMediaTable(data); // Populate the table with the fetched data

        } catch (error) {
            console.error('Error fetching media data:', error);
            handleTokenExpired();
        }
    } else {
        handleTokenExpired();
    }
}

// Function to populate the media table
function populateMediaTable(mediaItems) {
    const mediaTableBody = document.getElementById('mediaTableBody');
    mediaTableBody.innerHTML = ''; // Clear existing rows

    mediaItems.forEach(item => {
        const row = document.createElement('tr');

        // Speaker #
        const speakerIdCell = document.createElement('td');
        speakerIdCell.textContent = item.speaker_id; // Assuming this is the speaker number
        speakerIdCell.style.textAlign = 'center'; // Center align
        row.appendChild(speakerIdCell);

        // Image File
        const imageFileCell = document.createElement('td');
        const imageFileName = item.image_file.split('\\').pop(); // Get last part after splitting by "\"
        imageFileCell.textContent = imageFileName;
        imageFileCell.style.textAlign = 'center'; // Center align
        row.appendChild(imageFileCell);

        // Annotated
        const annotatedCell = document.createElement('td');
        annotatedCell.textContent = item.annotated ? 'Yes' : 'No'; // Assuming annotated is a boolean
        annotatedCell.style.textAlign = 'center'; // Center align
        row.appendChild(annotatedCell);

        // Hidden field for item.id
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.value = item.id; // Assuming this is the item ID
        row.appendChild(hiddenInput);

        // Row selection functionality
        row.style.cursor = 'pointer'; // Indicate row is selectable
        row.addEventListener('click', () => {
            // Deselect all rows
            const rows = mediaTableBody.querySelectorAll('tr');
            rows.forEach(r => r.classList.remove('selected'));

            // Select this row
            row.classList.add('selected');
            // Store selected item ID in a variable for confirmation
            selectedItemId = item.id;
        });

        mediaTableBody.appendChild(row);
    });
}

// Handle modal opening and data fetching
document.getElementById('speakerModal').addEventListener('show.bs.modal', () => {
    fetchMediaData(); // Fetch media data when modal opens
});

// Initial selected item ID
let selectedItemId = null;

// Confirm button event listener
document.getElementById('confirmBtn').addEventListener('click', () => {
    console.log(selectedItemId);
    if (selectedItemId) {
        // Implement existing functionality to handle selected media ID
        console.log(`Selected Media ID: ${selectedItemId}`);

        // Fetch audio, image, and bounding box data for the selected media ID
        fetch(`http://localhost:8000/api/media-data/${selectedItemId}`, {
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
                    // Fetch bounding box options (vowels) from API
                    fetch('http://localhost:8000/api/vowels', {
                        method: 'GET',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem("jwtToken")}`,
                            'Content-Type': 'application/json'
                        }
                    })
                        .then(response => response.json())
                        .then(vowels => {
                            // Iterate over each bounding box (row) and create dropdowns
                            rows.forEach((row, index) => {
                                const dropdown = document.createElement('select');
                                dropdown.className = 'form-select';

                                // Set an ID or data attribute for Select2 to identify the dropdown
                                dropdown.setAttribute('id', `boundingBoxDropdown${index}`);

                                const defaultOpt = document.createElement('option');
                                defaultOpt.value = '';
                                defaultOpt.textContent = 'Select a vowel';
                                dropdown.appendChild(defaultOpt); // Add it as the first option

                                // Populate dropdown options with vowels from API
                                vowels.forEach(vowel => {
                                    const opt = document.createElement('option');
                                    opt.value = vowel.category_id; // Use category_id as the value
                                    opt.textContent = vowel.vowel; // Use vowel as the text
                                    dropdown.appendChild(opt);
                                });

                                const label = document.createElement('label');
                                label.textContent = `Bounding Box ${index + 1}: `;
                                boundingBoxesElement.appendChild(label);
                                boundingBoxesElement.appendChild(dropdown);

                                // Initialize Select2
                                $(dropdown).select2({
                                    placeholder: 'Select a vowel', // Placeholder for the dropdown
                                    allowClear: true // Allow the user to clear the selection
                                });
                            });
                        })
                        .catch(error => {
                            console.error('Error fetching vowels:', error);
                            boundingBoxesElement.textContent = 'Error fetching vowels.';
                        });
                } else {
                    boundingBoxesElement.textContent = 'No bounding boxes found';
                }

                // Show the data display section
                document.getElementById('dataDisplay').style.display = 'block';

                // Close the modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('speakerModal'));
                modal.hide();
            })
            .catch(error => console.error('Error fetching speaker data:', error));
    } else {
        alert("Please select a media item first.");
    }
});


// Function to fetch Speaker IDs for filtering
function fetchSpeakerIds() {
    fetch('http://localhost:8000/api/allowed-speaker', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("jwtToken")}`
        },
    })
        .then(response => response.json())
        .then(data => {
            const speakerIdOptions = document.getElementById('speakerIdOptions');
            speakerIdOptions.innerHTML = ''; // Clear existing options

            // Create a proper <ul> element for the dropdown
            data.forEach(speaker => {
                const option = document.createElement('li');
                option.innerHTML = `<a class="dropdown-item" href="#" data-value="${speaker.id}">${speaker.speaker_id}</a>`;
                speakerIdOptions.appendChild(option);
            });

            // Add event listeners for each dynamically created filter option
            const filterItems = speakerIdOptions.querySelectorAll('.dropdown-item');
            filterItems.forEach(item => {
                item.addEventListener('click', function (event) {
                    event.preventDefault(); // Prevent default anchor behavior

                    // Remove 'active' class from all items
                    filterItems.forEach(i => i.classList.remove('active'));
                    // Add 'active' class to the clicked item
                    this.classList.add('active');

                    const selectedValue = this.getAttribute('data-value');
                    document.getElementById('speakerIdFilterButton').innerText = selectedValue ? `Speaker ID: ${this.innerHTML}` : 'Filter by Speaker ID';
                });
            });
        })
        .catch(error => console.error('Error fetching speaker IDs:', error));
}

// Event listeners for Annotated Filter
const annotatedFilterItems = document.querySelectorAll('#annotatedFilterButton + .dropdown-menu .dropdown-item');
annotatedFilterItems.forEach(item => {
    item.addEventListener('click', function (event) {
        event.preventDefault(); // Prevent default anchor behavior

        // Remove 'active' class from all items
        annotatedFilterItems.forEach(i => i.classList.remove('active'));
        // Add 'active' class to the clicked item
        this.classList.add('active');

        const selectedValue = this.getAttribute('data-value');
        // Update the button text to reflect the selected filter
        document.getElementById('annotatedFilterButton').innerText = selectedValue ? `Annotated: ${this.innerHTML}` : 'Filter by Annotated';
    });
});

// Refresh Media Data function
function refreshMediaData() {
    const speakerId = Array.from(document.querySelectorAll('#speakerIdOptions .dropdown-item.active')).map(item => item.getAttribute('data-value')).join('');
    const annotated = Array.from(document.querySelectorAll('#annotatedFilterButton + .dropdown-menu .dropdown-item.active')).map(item => item.getAttribute('data-value')).join('');

    let queryParams = '';

    if (speakerId) {
        queryParams += `?speaker_id=${speakerId}`;
    }

    if (annotated) {
        queryParams += queryParams ? `&annotated=${annotated}` : `?annotated=${annotated}`;
    }

    fetch(`http://localhost:8000/api/allowed-media${queryParams}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem("jwtToken")}`
        },
    })
        .then(response => response.json())
        .then(data => {
            populateMediaTable(data);
        })
        .catch(error => console.error('Error fetching filtered media data:', error));
}

// Event listener for refresh button
document.getElementById('refreshBtn').addEventListener('click', refreshMediaData);

// Fetch data when the modal is opened
document.getElementById('speakerModal').addEventListener('show.bs.modal', () => {
    fetchMediaData();
    fetchSpeakerIds(); // Fetch speaker IDs when the modal opens
});

// Handle expired token (e.g., redirect to login or refresh token)
function handleTokenExpired() {
    alert('Your session has expired. Please log in again.');
    localStorage.removeItem('jwtToken'); // Clear the expired token
    window.location.reload(); // Optionally reload the page to show the login form
}

// Toggle functionality for Monophthongs table
document.getElementById('toggleMonophthongsTableBtn').addEventListener('click', function () {
    const table = document.getElementById('monophthongsTable');

    if (table.style.display === 'none' || table.style.display === '') {
        table.style.display = 'table'; // Show the table
    } else {
        table.style.display = 'none'; // Hide the table
    }
});

// Toggle functionality for Diphthongs table
document.getElementById('toggleDiphthongsTableBtn').addEventListener('click', function () {
    const table = document.getElementById('diphthongsTable');

    if (table.style.display === 'none' || table.style.display === '') {
        table.style.display = 'table'; // Show the table
    } else {
        table.style.display = 'none'; // Hide the table
    }
});



// Check if the user is already logged in (JWT token exists)
window.onload = function () {
    const token = localStorage.getItem('jwtToken');
    if (token && !isTokenExpired(token)) {
        document.getElementById('loginForm').classList.add('d-none');
        document.getElementById('loginForm').classList.remove('d-flex');
        document.getElementById('mainContainer').classList.add('d-flex');
        document.getElementById('mainContainer').classList.remove('d-none');
    } else {
        document.getElementById('loginForm').classList.add('d-flex');
        document.getElementById('loginForm').classList.remove('d-none');
        document.getElementById('mainContainer').classList.add('d-none');
        document.getElementById('mainContainer').classList.remove('d-flex');
    }
};

