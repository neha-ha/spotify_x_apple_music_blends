const apiKey = '80036787eac16b24d14eba32990f4f82'; // Replace 'YOUR_API_KEY' with your actual Last.fm API key
const period = 'overall'; // You can change this to '7day', '1month', '3month', '6month', or '12month' as per your requirement
const limit = 1000; // Number of top tracks to fetch for each user
const blendLimit = 50; // Number of blended songs to include in the playlist

const genreScore = new Map();
const artistScore = new Map();
const songPriority = new Map();

const getUserTopTracks = async (username) => {
    const apiUrl = `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${username}&period=${period}&limit=${limit}&api_key=${apiKey}&format=json`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        return data.toptracks.track.map(track => ({
            name: track.name,
            artist: track.artist.name,
            genre: track.toptags ? track.toptags.tag.map(tag => tag.name) : [] // Check if toptags exist
        }));
    } catch (error) {
        console.error(`Error fetching top tracks for user ${username}:`, error);
        return [];
    }
};

const updateSongScores = (userSongs) => {
    userSongs.forEach(song => {
        // get the genres and score them
        console.log(song.genre); // genre still not gained
        song.genre.forEach(genre => {
            if (genreScore.has(genre)) {
                genreScore.set(genre, genreScore.get(genre) + 1);
            } else {
                genreScore.set(genre, 1);
            }
        });
        // get the artists and score them
        if (artistScore.has(song.artist)) {
            artistScore.set(song.artist, artistScore.get(song.artist) + 1);
        } else {
            artistScore.set(song.artist, 1);
        }
        // get the songs and score them with the artists and genres
        const songKey = `${song.name} - ${song.artist}`;
        if (songPriority.has(songKey)) {
            songPriority.set(songKey, songPriority.get(songKey) + 3);
        } else {
            if (song.genre) {
                songPriority.set(songKey, artistScore.get(song.artist) + genreScore.get(song.genre) + 1);
            }
            else {
                songPriority.set(songKey, artistScore.get(song.artist) + 1);
            }
        }
    });
};

const blendPlaylist = async () => {
    try {
        // Get usernames from input fields
        const username1 = document.getElementById("username1").value;
        const username2 = document.getElementById("username2").value;

        // Fetch top tracks for both users
        const [user1TopTracks, user2TopTracks] = await Promise.all([getUserTopTracks(username1), getUserTopTracks(username2)]);

        // Update song scores for both users
        updateSongScores(user1TopTracks);
        updateSongScores(user2TopTracks);

        // Sort genre score and song priority maps
        const sortedSongs = new Map([...songPriority.entries()].sort((a, b) => b[1] - a[1]));
        console.log(songPriority);
        console.log(genreScore);
        console.log(artistScore);

        // Get the top blended songs based on song priority
        const blendedSongs = Array.from(sortedSongs.keys()).slice(0, blendLimit);

        // Update the playlist in the HTML
        const playlistItems = document.getElementById('playlistItems');
        playlistItems.innerHTML = ''; // Clear previous playlist items

        blendedSongs.forEach((song, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${index + 1}. ${song}`;
            playlistItems.appendChild(listItem);
        });
    } catch (error) {
        console.error('Error creating blend playlist:', error);
    }
};

// Attach event listener to the button to trigger blending playlist generation
document.getElementById('generatePlaylistBtn').addEventListener('click', blendPlaylist);
