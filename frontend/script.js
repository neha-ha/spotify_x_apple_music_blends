async function getBlendedPlaylist() {
    const apiKey = '80036787eac16b24d14eba32990f4f82'; // Replace 'YOUR_API_KEY' with your actual Last.fm API key
    const username1 = document.getElementById('username1').value;
    const username2 = document.getElementById('username2').value;
    const period = 'overall';
    const limit = 1000;
    const blendLimit = 50;

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
                genre: track.toptags ? track.toptags.tag.map(tag => tag.name) : []
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

    try {
        const [user1TopTracks, user2TopTracks] = await Promise.all([getUserTopTracks(username1), getUserTopTracks(username2)]);

        [user1TopTracks, user2TopTracks].forEach((userTracks, index) => updateUserScores(userTracks, index === 0));

        const sortedSongs = new Map([...songPriority.entries()].sort((a, b) => b[1] - a[1]));

        const blendedSongs = Array.from(sortedSongs.keys()).slice(0, blendLimit);

        const playlistElement = document.getElementById('playlist');
        playlistElement.innerHTML = ''; // Clear previous playlist

        const playlistList = document.createElement('ol');
        blendedSongs.forEach((song, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${song}`;
            playlistList.appendChild(listItem);
        });
        playlistElement.appendChild(playlistList);
    } catch (error) {
        console.error('Error creating blend playlist:', error);
    }
}
