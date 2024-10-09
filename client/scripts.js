let waveform;

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
async function fetchMediaData(page = 1, pageSize = 10) {
    const token = localStorage.getItem("jwtToken");

    // Update the hidden input with the current page
    document.getElementById('currentPage').value = page;

    if (token && !isTokenExpired(token)) {
        try {
            // Build query parameters for filtering
            const speakerId = Array.from(document.querySelectorAll('#speakerIdOptions .dropdown-item.active')).map(item => item.getAttribute('data-value')).join('');
            const annotated = Array.from(document.querySelectorAll('#annotatedFilterButton + .dropdown-menu .dropdown-item.active')).map(item => item.getAttribute('data-value')).join('');

            let queryParams = `?page=${page}&page_size=${pageSize}`;

            if (speakerId) {
                queryParams += `&speaker_id=${speakerId}`;
            }

            if (annotated) {
                queryParams += `&annotated=${annotated}`;
            }

            // Fetch media data from the API
            const response = await fetch(`http://localhost:8000/api/allowed-media${queryParams}`, {
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
            populateMediaTable(data.results); // Populate the table with the fetched results
            renderPagination(data.count, page, pageSize); // Render pagination controls

        } catch (error) {
            console.error('Error fetching media data:', error);
            if (token && isTokenExpired(token)) {
                handleTokenExpired(); // Handle token expiration
            } else {
                showToast('errorToast', 'An error occurred while fetching media data.'); // Show toast with error message
            }
        }
    } else {
        handleTokenExpired();
    }
}

// Initial selected item ID
let selectedItemId = null;

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
        annotatedCell.textContent = item.is_annotated ? 'Yes' : 'No'; // Assuming annotated is a boolean
        annotatedCell.style.textAlign = 'center'; // Center align
        row.appendChild(annotatedCell);

        // Hidden field for item.id
        const hiddenInput = document.createElement('input');
        hiddenInput.type = 'hidden';
        hiddenInput.value = item.id; // Assuming this is the item ID
        row.appendChild(hiddenInput);

        if (selectedItemId && selectedItemId == item.id) {
            row.classList.add('selected')
        }
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

// Function to render pagination controls
function renderPagination(totalCount, currentPage, pageSize) {
    const paginationContainer = document.getElementById('paginationContainer');

    // Remove only existing buttons and page info
    const existingButtons = paginationContainer.querySelectorAll('button');
    existingButtons.forEach(button => button.remove());

    // Create or update the page information display
    const pageInfo = document.getElementById('pageInfo');
    pageInfo.textContent = `Page ${currentPage} of ${Math.ceil(totalCount / pageSize)}`; // Update text

    // Previous button
    const prevButtonContainer = document.getElementById('prevButtonContainer');
    prevButtonContainer.innerHTML = ''; // Clear previous button container
    if (currentPage > 1) {
        const prevButton = document.createElement('button');
        prevButton.innerHTML = '&lt;'; // HTML entity for left arrow
        prevButton.onclick = () => fetchMediaData(currentPage - 1, pageSize); // Fetch previous page
        prevButtonContainer.appendChild(prevButton); // Append to previous button section
    }

    // Next button
    const nextButtonContainer = document.getElementById('nextButtonContainer');
    nextButtonContainer.innerHTML = ''; // Clear next button container
    if (currentPage < Math.ceil(totalCount / pageSize)) {
        const nextButton = document.createElement('button');
        nextButton.innerHTML = '&gt;'; // HTML entity for right arrow
        nextButton.onclick = () => fetchMediaData(currentPage + 1, pageSize); // Fetch next page
        nextButtonContainer.appendChild(nextButton); // Append to next button section
    }
}


// Confirm button event listener
document.getElementById('confirmBtn').addEventListener('click', () => {
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

                handleWaveformAudio(data);

                // Decode Base64 image
                const imageElement = document.getElementById('speakerImage');
                imageElement.src = `data:image/jpeg;base64,${data.image_file}`; // Adjust MIME type as needed

                handleBoundingBoxes(data);

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

function handleWaveformAudio(data) {
    // Decode Base64 audio
    const audioBase64 = data.audio_file;
    const audioBlob = new Blob([Uint8Array.from(atob(audioBase64), c => c.charCodeAt(0))], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);

    if (waveform) {
        waveform.destroy();
    }

    // Initialize Plugins
    const regions = WaveSurfer.Regions.create();

    // Initialize WaveSurfer
    waveform = WaveSurfer.create({
        container: '#waveform',
        waveColor: 'violet',
        progressColor: 'purple',
        barWidth: 2,
        responsive: true,
        autoCenter: false,
        plugins: [
            regions, // Enable the regions plugin
        ]
    });

    // Load the audio
    waveform.load(audioUrl);

    // Add a region to highlight a portion of the audio
    waveform.on('ready', () => {
        regions.addRegion({
            start: data['region_start'] - data['start_time'], // start time in seconds
            end: data['region_end'] - data['start_time'], // end time in seconds
            color: 'rgba(255, 0, 0, 0.5)', // color of the highlight
            drag: false,
            resize: false,
        });
        updateTiming();
    });

    waveform.on('audioprocess', updateTiming); // Update current time while playing

    regions.on('region-clicked', (region, e) => {
        e.stopPropagation() // prevent triggering a click on the waveform
        region.play()
        document.getElementById('playPauseBtn').textContent = 'Pause';
    })

    // Update button text when a region is played
    regions.on('region-play', function () {
        document.getElementById('playPauseBtn').textContent = 'Pause';
    });

    // Update button text when the audio stops
    waveform.on('finish', function () {
        waveform.pause(); // Stop the playback
        document.getElementById('playPauseBtn').textContent = 'Play'; // Change button text to 'Play'
    });
}

// Update the timing display
function updateTiming() {
    const currentTime = document.getElementById('currentTime');
    const duration = document.getElementById('duration');

    // Update current time
    currentTime.textContent = formatTime(waveform.getCurrentTime());

    // Update duration if the audio is loaded
    if (waveform.getDuration() > 0) {
        duration.textContent = formatTime(waveform.getDuration());
    }
}

// Format time as mm:ss
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' + secs : secs}`;
}

function handleBoundingBoxes(data) {
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
}

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

// Event listener for refresh button
document.getElementById('refreshBtn').addEventListener('click', () => {
    const currentPage = parseInt(document.getElementById('currentPage').value); // Get the current page number
    fetchMediaData(currentPage, 10); // Call fetchMediaData with the current page and page size
});

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

// Reset Button functionality
document.getElementById('resetBtn').addEventListener('click', function () {
    document.getElementById('waveform').innerHTML = '';
    if (waveform) {
        waveform.destroy();
    }
    document.getElementById('speakerImage').src = '';
    document.getElementById('boundingBoxes').innerHTML = '';
    document.getElementById('dataDisplay').style.display = 'none';
    document.getElementById('currentTime').innerHTML = '0:00';
    document.getElementById('duration').innerHTML = '0:00';
});

// Play and Stop functionality
document.getElementById('playPauseBtn').addEventListener('click', function () {
    if (waveform.isPlaying()) {
        waveform.pause(); // Pause the audio
        this.textContent = 'Play'; // Change button text to 'Play'
    } else {
        waveform.play(); // Play the audio
        this.textContent = 'Pause'; // Change button text to 'Pause'
    }
});

document.getElementById('stopBtn').addEventListener('click', () => {
    if (waveform) {
        waveform.stop(); // Stop playback
        const playPauseBtn = document.getElementById('playPauseBtn');
        playPauseBtn.textContent = 'Play'; // Reset button text
        document.getElementById('currentTime').innerHTML = '0:00';
    }
});

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

// Function to show toast messages
function showToast(toastId) {
    const toastElement = new bootstrap.Toast(document.getElementById(toastId));
    toastElement.show();
}

$('#saveBoundingBoxesBtn').click(function () {
    if (!selectedItemId) {
        alert("Please select a media item before saving.");
        return;
    }

    // Collect all selected bounding box IDs
    let selectedBoundingBoxes = [];
    $('#boundingBoxes select').each(function () {
        let selectedId = $(this).val();
        if (selectedId) {
            selectedBoundingBoxes.push(parseInt(selectedId));
        }
    });

    // Prepare the payload
    let payload = {
        "media_id": selectedItemId,
        "bounding_boxes": selectedBoundingBoxes
    };

    // Make POST request using the selected media_id
    $.ajax({
        url: `http://localhost:8000/api/annotation`,  // Using the dynamic media_id
        type: 'POST',
        contentType: 'application/json',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem("jwtToken")}`
        },
        data: JSON.stringify(payload),
        success: function (response) {
            console.log("Bounding boxes saved successfully", response);
            showToast('successToast'); // Show success toast
        },
        error: function (xhr, status, error) {
            console.error("Error saving bounding boxes", status, error);
            showToast('errorToast'); // Show error toast
        }
    });
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

