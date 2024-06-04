const apiKey = '80036787eac16b24d14eba32990f4f82'; // Replace 'YOUR_API_KEY' with your actual Last.fm API key
const period = 'overall'; // You can change this to '7day', '1month', '3month', '6month', or '12month' as per your requirement
const limit = 500; // Number of top tracks to fetch for each user
const blendLimit = 50; // Number of blended songs to include in the playlist

const genreScore = new Map();
const artistScore = new Map();
const songPriority = new Map();

// fetches top songs using lastfm api: gets song name, artist name, and genre
const getUserTopTracks = async (username) => {
    const apiUrl = `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${username}&period=${period}&limit=${limit}&api_key=${apiKey}&format=json`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        console.log(data.toptracks.track);
        const tracksWithGenres = await Promise.all(data.toptracks.track.map(async (track) => {
            const genre = await getTrackTopTags(track.artist.name, track.name);
            return {
                name: track.name,
                artist: track.artist.name,
                genre: genre,
                username: username
            };
        }));
        return tracksWithGenres;
    } catch (error) {
        console.error(`Error fetching top tracks for user ${username}:`, error);
        return [];
    }
};

const getTrackTopTags = async (artist, track) => {
    const apiUrl2 = `https://ws.audioscrobbler.com/2.0/?method=track.getTopTags&artist=${artist}&track=${track}&autocorrect[1]&api_key=${apiKey}&format=json`;
    try {
        const response = await fetch(apiUrl2);
        const data = await response.json();
        console.log(data.toptags);
        return (data.toptags.tag ? data.toptags.tag.map(tag => tag.name) : []);
    } catch (error) {
        // console.error(`Error fetching track tags for track ${track}:`, error);
        return [];
    }
}

const updateSongScores = (userSongs, username) => { 
    userSongs.forEach(song => { // get the songs and score them with the artists and genres
        const songKey = `${song.name} - ${song.artist}`;
        const songIndex = userSongs.indexOf(song);
        if (songPriority.has(songKey)) {
            console.log("already in:", songPriority.get(songKey));
            songPriority.set(songKey, [songPriority.get(songKey)[0] + (10 * Math.log(limit - songIndex)) + 50, songPriority.get(songKey)[1]]);
            songPriority.get(songKey)[1].push(username);
        } else {
            if (song.genre) {
                const genresScore = song.genre.reduce((totalScore, genre) => totalScore + genreScore.get(genre), 0);
                console.log("genre:", Math.log(artistScore.get(song.artist)), genresScore/2, (10 * Math.log(limit - songIndex)))
                songPriority.set(songKey, [Math.log(artistScore.get(song.artist)) + genresScore/2 + (10 * Math.log(limit - songIndex)) + 1, [username]]);
            }
            else {
                console.log("no genre:", Math.log(artistScore.get(song.artist)), (10 * Math.log(limit - songIndex)))
                songPriority.set(songKey, [Math.log(artistScore.get(song.artist)) + (10 * Math.log(limit - songIndex)) + 1, [username]]);
            }
        }
    });
};

const updateGenreScores = (userSongs) => { // get the genres and score them
    userSongs.forEach(song => {
        song.genre = song.genre.slice(0, 10);
        Array.prototype.forEach.call(song.genre, genre => {
            if (genreScore.has(genre)) {
                genreScore.set(genre, genreScore.get(genre) + 0.1);
            } else {
                genreScore.set(genre, 1);
            }
        });
    });
};

const updateArtistScores = (userSongs) => { // get the artists and score them
    userSongs.forEach(song => {
        if (artistScore.has(song.artist)) {
            artistScore.set(song.artist, artistScore.get(song.artist) + 2);
        } else {
            artistScore.set(song.artist, 1);
        }
    });
};

const reduceRepeats = (songs) => {
    const artistCount = new Map();
    songs.forEach(song => {
        if (artistCount[song.artist]) {
            if (artistCount[song.artist] > blendLimit * .3) {
                artistScore.set(song.artist, artistScore.get(song.artist) + 1);
            }
            else {
                song[1][0] -= 50;
            }
        }
        else {
            artistCount.set(song.artist, 1);
        }
    });
};

// does the blend using values inputted from html
const blendPlaylist = async (username1, username2) => {
    try {
        // Get usernames from input fields
        //const username1 = document.getElementById("username1").value;
        //const username2 = document.getElementById("username2").value;

        // Fetch top tracks for both users
        const [user1TopTracks, user2TopTracks] = await Promise.all([getUserTopTracks(username1), getUserTopTracks(username2)]);

        // Update song scores for both users
        updateArtistScores(user1TopTracks);
        updateArtistScores(user2TopTracks);
        updateGenreScores(user1TopTracks);
        updateGenreScores(user2TopTracks);
        updateSongScores(user1TopTracks, username1);
        updateSongScores(user2TopTracks, username2);

        // Sort genre score and song priority maps
        const sortedSongs = new Map([...songPriority.entries()].sort((a, b) => b[1][0] - a[1][0]));
        reduceRepeats(sortedSongs);
        const sortedSongs2 = new Map([...sortedSongs.entries()].sort((a, b) => b[1][0] - a[1][0]));
        
        // Get the top blended songs based on song priority
        const blendedSongs = Array.from(sortedSongs2.keys()).slice(0, blendLimit);

        // Shuffle the blend to make it a lil more random
        const shuffledSongs = blendedSongs
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value)

        //console.log(user1TopTracks);
        //console.log(user2TopTracks);
        //console.log(sortedSongs);
        //console.log(songPriority);
        //console.log(genreScore);
        //console.log(artistScore);

        const sortedGenres = new Map([...genreScore.entries()].sort((a, b) => b[1] - a[1]));
        console.log(sortedGenres);
        const sortedArtists = new Map([...artistScore.entries()].sort((a, b) => b[1] - a[1]));
        console.log(sortedArtists);
        console.log(shuffledSongs);

        

        // Update the playlist in the HTML
        /*
        const playlistItems = document.getElementById('playlistItems');
        playlistItems.innerHTML = ''; // Clear previous playlist items

        blendedSongs.forEach((song, index) => {
            const listItem = document.createElement('li');
            listItem.textContent = `${index + 1}. ${song}`;
            playlistItems.appendChild(listItem);
        });
        */
       return shuffledSongs;
    } catch (error) {
        console.error('Error creating blend playlist:', error);
    }
};

module.exports = {
    blendPlaylist
};

// Attach event listener to the button to trigger blending playlist generation
//document.getElementById('generatePlaylistBtn').addEventListener('click', blendPlaylist);
