const apiKey = '80036787eac16b24d14eba32990f4f82'; // Replace 'YOUR_API_KEY' with your actual Last.fm API key
const period = 'overall'; // You can change this to '7day', '1month', '3month', '6month', or '12month' as per your requirement
const limit = 1000; // Number of top tracks to fetch for each user
const blendLimit = 50; // Number of blended songs to include in the playlist

const genreScore = new Map();
const songPriority = new Map();

// fetches top songs using lastfm api: gets song name, artist name, and genre
const getUserTopTracks = async (username) => {
    const apiUrl = `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${username}&period=${period}&limit=${limit}&api_key=${apiKey}&format=json`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        return data.toptracks.track.map(track => ({
            name: track.name,
            artist: track.artist.name,
            genre: track.toptags ? track.toptags.tag.map(tag => tag.name) : [] // Check if toptags exist bc some songs dont have a genre tag
        }));
    } catch (error) {
        console.error(`Error fetching top tracks for user ${username}:`, error);
        return [];
    }
};

// user score: blend logic
/*
Users [user1Songs, user2Songs]
genreScore list
SongPriority priority list
For user in users
For song in user.userSongs
        If song.genre is in genreScore
            Increase score
        Else add to genreScore
        //check for related genres?
For user in users
    For userSongs of user
        For otherUser in users
            For song in otherUser.userSongs
                If song is in songPriority
                    Increase score
                Else add to songPriority
blendPlaylist of first 50 in songPriority
*/
const updateUserScores = (userSongs, isGenreScore) => {
    userSongs.forEach(song => {
        if (isGenreScore) {
            song.genre.forEach(genre => {
                if (genreScore.has(genre)) {
                    genreScore.set(genre, genreScore.get(genre) + 1);
                } else {
                    genreScore.set(genre, 1);
                }
            });
        } else {
            const songKey = `${song.name} - ${song.artist}`;
            if (songPriority.has(songKey)) {
                songPriority.set(songKey, songPriority.get(songKey) + 1);
            } else {
                songPriority.set(songKey, 1);
            }
        }
    });
};

// does the blend using values inputted from html
const blendPlaylist = async () => {
    try {
        // Get usernames from input fields
        const username1 = document.getElementById("username1").value;
        const username2 = document.getElementById("username2").value;

        // Fetch top tracks for both users
        const [user1TopTracks, user2TopTracks] = await Promise.all([getUserTopTracks(username1), getUserTopTracks(username2)]);

        // Update genre scores for both users
        updateUserScores(user1TopTracks, true);
        updateUserScores(user2TopTracks, true);

        // Update song priorities for both users
        updateUserScores(user1TopTracks, false);
        updateUserScores(user2TopTracks, false);

        // Sort genre score and song priority maps
        const sortedGenres = new Map([...genreScore.entries()].sort((a, b) => b[1] - a[1]));
        const sortedSongs = new Map([...songPriority.entries()].sort((a, b) => b[1] - a[1]));

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
