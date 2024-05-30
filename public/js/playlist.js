let currentAudio = null;
let currentButton = null;

// Basic playing indicator
function togglePlayIndicator(button, isPlaying) {
    if (isPlaying) {
        button.innerHTML = `<div class="bars">
                                <div class="bar"></div>
                                <div class="bar"></div>
                                <div class="bar"></div>
                            </div>`;
        button.classList.add('playing');
    } 
    else {
        button.innerHTML = '&#9654;';
        button.classList.remove('playing');
    }
}

// Extracts the track ID, fetches details, and plays a track preview
function playTrack(button, uri) {
    const trackId = uri.split(':').pop();
    if (currentAudio) {
        currentAudio.pause();
        currentAudio.src = '';
        if (currentButton) {
            togglePlayIndicator(currentButton, false);
        }
    }
    fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: {
            'Authorization': `Bearer ${accessToken}`
        }
    })
    .then(response => response.json())
    .then(data => {
        if (data.preview_url) {
            currentAudio = new Audio(data.preview_url);
            currentAudio.volume = document.getElementById('volume').value;
            currentAudio.play();
            togglePlayIndicator(button, true);
            currentButton = button;
            currentAudio.onpause = () => {
                togglePlayIndicator(button, false);
            };
            currentAudio.onended = () => {
                togglePlayIndicator(button, false);
            };
        } 
        else {
            alert('Preview not available.');
        }
    })
}

// Handles the volume control, uses DOM event to make sure its available
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('volume').addEventListener('input', function() {
        if (currentAudio) {
            currentAudio.volume = this.value;
        }
    });
});
