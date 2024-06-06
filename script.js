const apiKey = '80036787eac16b24d14eba32990f4f82';
const period = 'overall';
const limit = 500;
const blendLimit = 50;

const genreScore = new Map();
const artistScore = new Map();
const songPriority = new Map();


const getUserProfile = async (username) => {
    const apiUrl = `https://ws.audioscrobbler.com/2.0/?method=user.getinfo&user=${username}&api_key=${apiKey}&format=json`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const user = data.user;
        if (user.image[0]['#text'] == '') {
            return 'https://lastfm.freetls.fastly.net/i/u/avatar170s/818148bf682d429dc215c1705eb27b98.png';
        }
        return user.image[0]['#text'];
        //console.log(data);
        //console.log(data.image);
        //console.log(typeof data.image);
        return data.image;
    }
    catch (error) {
        return error;
    }
}

const getUserTopTracks = async (username) => {
    const apiUrl = `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${username}&period=${period}&limit=${limit}&api_key=${apiKey}&format=json`;
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        const link = await getUserProfile(username);
        const tracksWithGenres = await Promise.all(data.toptracks.track.map(async (track) => {
            const genre = await getTrackTopTags(track.artist.name, track.name);
            return {
                user: username,
                name: track.name,
                artist: track.artist.name,
                genre: genre,

                // Added this to include the track's URL
                uri: track.url,
                img: link
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
        ////console.log(data.toptags);
        return (data.toptags.tag ? data.toptags.tag.map(tag => tag.name) : []);
    } catch (error) {
        return [];
    }
}

const updateSongScores = (userSongs) => {
    userSongs.forEach(song => {
        song.genre = song.genre.slice(0, 10);
        //console.log("genres for", song.name, ":", song.genre);
        Array.prototype.forEach.call(song.genre, genre => {
            if (genreScore.has(genre)) {
                genreScore.set(genre, genreScore.get(genre) + 0.1);
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
        const songIndex = userSongs.indexOf(song);
        if (songPriority.has(songKey)) {
            //console.log("already in:", songPriority.get(songKey), (10 * Math.log(limit - songIndex)), 50);
            songPriority.set(songKey, songPriority.get(songKey) + (10 * Math.log(limit - songIndex)) + 50);
        } else {
            if (song.genre) {
                const genresScore = song.genre.reduce((totalScore, genre) => totalScore + genreScore.get(genre), 0);
                //console.log("genre:", Math.log(artistScore.get(song.artist)), genresScore/2, (10 * Math.log(limit - songIndex)))
                songPriority.set(songKey, Math.log(artistScore.get(song.artist)) + genresScore/2 + (10 * Math.log(limit - songIndex)) + 1);
            }
            else {
                //console.log("no genre:", Math.log(artistScore.get(song.artist)), (10 * Math.log(limit - songIndex)))
                songPriority.set(songKey, Math.log(artistScore.get(song.artist)) + (10 * Math.log(limit - songIndex)) + 1);
            }
        }
    });
};

const blendPlaylist = async (username1, username2) => {
    try {
        const [user1TopTracks, user2TopTracks] = await Promise.all([getUserTopTracks(username1), getUserTopTracks(username2)]);
        updateSongScores(user1TopTracks);
        updateSongScores(user2TopTracks);
        const sortedSongs = new Map([...songPriority.entries()].sort((a, b) => b[1] - a[1]));
        const sortedGenres = new Map([...genreScore.entries()].sort((a, b) => b[1] - a[1]));
        const sortedArtists = new Map([...artistScore.entries()].sort((a, b) => b[1] - a[1]));

        // This the only part I changed, core functionality still the same. I just needed to map the 
        // song keys back to the original song objects by grabbing the song name and artist
        const blendedSongs = Array.from(sortedSongs.keys()).slice(0, blendLimit).map(songKey => {
            const [name, artist] = songKey.split(' - ');
            const song = user1TopTracks.concat(user2TopTracks).find(s => s.name === name && s.artist === artist);
            return song;
        });
        //console.log(blendedSongs[49].img);
       return blendedSongs;
    } catch (error) {
        console.error('Error creating blend playlist:', error);
    }
};

module.exports = {
    blendPlaylist
};
