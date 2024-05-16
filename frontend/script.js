const apiKey = '80036787eac16b24d14eba32990f4f82';  // Last.fm API key
const period = 'overall';  // Fetching period
const limit = 1000;  // Number of top tracks to fetch for each user
const blendLimit = 50;  // Number of blended songs to include in the playlist

const genreScore = new Map();
const artistScore = new Map();
const songPriority = new Map();

// Fetches top songs using Last.fm API: gets song name, artist name, and genre
const getUserTopTracks = async (username) => {
    const apiUrl = `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${username}&period=${period}&limit=${limit}&api_key=${apiKey}&format=json`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const tracksWithGenres = await Promise.all(data.toptracks.track.map(async (track) => {
            const genre = await getTrackTopTags(track.artist.name, track.name);
            return {
                name: track.name,
                artist: track.artist.name,
                genre: genre
            };
        }));
        return tracksWithGenres;
    } catch (error) {
        console.error(`Error fetching top tracks for user ${username}:`, error);
        return [];
    }
};

// Fetch top tags (genres) for a track
const getTrackTopTags = async (artist, track) => {
    const apiUrl2 = `https://ws.audioscrobbler.com/2.0/?method=track.getTopTags&artist=${artist}&track=${track}&api_key=${apiKey}&format=json`;
    try {
        const response = await fetch(apiUrl2);
        const data = await response.json();
        return (data.toptags.tag ? data.toptags.tag.map(tag => tag.name) : []);
    } catch {
        return [];
    }
};

// Update song scores based on user's top tracks
const updateSongScores = (userSongs) => {
    userSongs.forEach(song => {
        song.genre.forEach(genre => {
            if (genreScore.has(genre)) {
                genreScore.set(genre, genreScore.get(genre) + 0.5);
            } else {
                genreScore.set(genre, 1);
            }
        });

        if (artistScore.has(song.artist)) {
            artistScore.set(song.artist, artistScore.get(song.artist) + 3);
        } else {
            artistScore.set(song.artist, 1);
        }

        const songKey = `${song.name} - ${song.artist}`;
        if (songPriority.has(songKey)) {
            songPriority.set(songKey, songPriority.get(songKey) + 5);
        } else {
            songPriority.set(songKey, artistScore.get(song.artist) + (song.genre.reduce((totalScore, genre) => totalScore + genreScore.get(genre), 0)) + 1);
        }
    });
};

// Blend playlists based on user inputs
const blendPlaylist = async () => {
    const username1 = document.getElementById("username1").value;
    const username2 = document.getElementById("username2").value;

    const [user1TopTracks, user2TopTracks] = await Promise.all([getUserTopTracks(username1), getUserTopTracks(username2)]);

    updateSongScores(user1TopTracks);
    updateSongScores(user2TopTracks);

    const sortedSongs = new Map([...songPriority.entries()].sort((a, b) => b[1] - a[1]));
    const blendedSongs = Array.from(sortedSongs.keys()).slice(0, blendLimit);

    const playlistItems = document.getElementById('playlistItems');
    playlistItems.innerHTML = '';

    blendedSongs.forEach((song, index) => {
        const listItem = document.createElement('li');
        listItem.textContent = `${index + 1}. ${song}`;
        playlistItems.appendChild(listItem);
    });
};

/************************************************************************
*
* I added some functions for the animations. We can put these in another
* .js file, was just going off your previous code which worked well.
*
************************************************************************/

// Error bubble
function showBubble(message) {
    const bubble = document.getElementById('bubble');
    bubble.textContent = message;
    bubble.style.display = 'block';
    requestAnimationFrame(() => {bubble.classList.add('show');});
    setTimeout(() => {bubble.classList.remove('show');
    setTimeout(() => {bubble.style.display = 'none';}, 500);}, 3000);
}

// Validate inputs in text box
function validateInputs() {
    const username1 = document.getElementById('username1').value.trim();
    const username2 = document.getElementById('username2').value.trim();
    const usernameRegex = /^[a-zA-Z0-9_]+$/;
    if (!username1) {
        showBubble('Username 1 is required.');
        return false;
    }
    if (!username2) {
        showBubble('Username 2 is required.');
        return false;
    }
    if (!usernameRegex.test(username1) || !usernameRegex.test(username1)) {
        showBubble('Username can only contain letters, numbers, and underscores.');
        return false;
    }
    return true;
}

// Shows spinner
function showLoader() {
    document.querySelector('.button-text').style.display = 'none';
    document.querySelector('.spinner').style.display = 'flex';
}

// Hides spinner
function hideLoader() {
    document.querySelector('.spinner').style.display = 'none';
    document.querySelector('.button-text').style.display = 'inline-block';
}

// Shows song list w/ transition
function showPopup() {
    const songList = document.getElementById('playlistPopup');
    songList.classList.add('active');
}

// Hides song list w/ transition
function hidePopup() {
    const songList = document.getElementById('playlistPopup');
    songList.classList.remove('active');
}

// Generate button
document.getElementById('generatePlaylistBtn').addEventListener('click', async () => {
    if (!validateInputs()) {
        return;
    }

    showLoader();
    await blendPlaylist();
    hideLoader();
    showPopup();
});

// Closes song list
document.querySelector('.close-btn').addEventListener('click', function() {
    hidePopup();
});
