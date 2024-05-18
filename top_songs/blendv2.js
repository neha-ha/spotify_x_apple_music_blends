const apiKey = '80036787eac16b24d14eba32990f4f82'; // Replace 'YOUR_API_KEY' with your actual Last.fm API key
const users = ['kisslandxo', 'sadhiika']; // Replace 'username1' and 'username2' with the usernames for which you want to fetch top tracks
const period = 'overall'; // You can change this to '7day', '1month', '3month', '6month', or '12month' as per your requirement
const limit = 1000; // Number of top tracks to fetch for each user
const blendLimit = 50; // Number of blended songs to include in the playlist

const genreScore = new Map();
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

const blendPlaylist = async () => {
    try {
        // Fetch top tracks for both users
        const [user1TopTracks, user2TopTracks] = await Promise.all(users.map(getUserTopTracks));

        // Update genre scores for both users
        users.forEach((user, index) => updateUserScores(index === 0 ? user1TopTracks : user2TopTracks, true));

        // Update song priorities for both users
        users.forEach((user, index) => updateUserScores(index === 0 ? user1TopTracks : user2TopTracks, false));

        // Sort genre score and song priority maps
        const sortedGenres = new Map([...genreScore.entries()].sort((a, b) => b[1] - a[1]));
        const sortedSongs = new Map([...songPriority.entries()].sort((a, b) => b[1] - a[1]));

        // Get the top blended songs based on song priority
        const blendedSongs = Array.from(sortedSongs.keys()).slice(0, blendLimit);

        // Print the blend playlist
        console.log("Blended Playlist:");
        blendedSongs.forEach((song, index) => {
            console.log(`${index + 1}. ${song}`);
        });
    } catch (error) {
        console.error('Error creating blend playlist:', error);
    }
};

blendPlaylist();