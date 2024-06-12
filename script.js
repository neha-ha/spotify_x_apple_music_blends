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
        //console.log(data);
        //console.log(data.user.image[0]);

        // if user has no profile picture
        if (user.image[0]['#text'] == '') {
            // url of default lastfm empty pfp
            return 'https://lastfm.freetls.fastly.net/i/u/avatar170s/818148bf682d429dc215c1705eb27b98.png';
        }
        // otherwise, return the url of the small pfp
        return user.image[0]['#text'];
        
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
    
    // create a map to track the number of times an artist has appeared
    const artistCount = new Map();

    // songs refers to the sorted songs list passed in
    // looks like this
    //'Heartless - The Weeknd' => [ 214.76510534665704, [ 'kisslandxo', 'kisslandxo' ] ],
    //'Reminder - The Weeknd' => [ 112.85524878555142, [ 'kisslandxo', 'kisslandxo' ] ],

    // loop through each value, key in the map
    songs.forEach((score, songTitle) => {
        console.log("song ", songTitle);

        // get artist name from song title
        const parts = songTitle.split(' - '); // i.e. parts = ['Heartless', 'The Weeknd']
        const artist = parts[1]; 

        if (artistCount.has(artist)) {
            // add 1 to the count if there
            artistCount.set(artist, artistCount.get(artist) + 1);
        }
        else {
            // otherwise start w 1
            artistCount.set(artist, 1);
        }

        // if artist has already appeared more than 10 times, set score of that song to 0 so it is not included in the blend
        if (artistCount.get(artist) > 10) {
            const score_zeroed = score;
            score_zeroed[0] = 0;
            songs.set(songTitle, score_zeroed);
        }

        
    });

    console.log('artist counts ', artistCount);

};

const blendPlaylist = async (username1, username2) => {
    try {
        const [user1TopTracks, user2TopTracks] = await Promise.all([getUserTopTracks(username1), getUserTopTracks(username2)]);
        
        // Update song scores for both users
        updateArtistScores(user1TopTracks);
        updateArtistScores(user2TopTracks);
        updateGenreScores(user1TopTracks);
        updateGenreScores(user2TopTracks);
        updateSongScores(user1TopTracks, username1);
        updateSongScores(user2TopTracks, username2);
        
        const sortedSongs = new Map([...songPriority.entries()].sort((a, b) => b[1][0] - a[1][0]));
        console.log("sorted songs prior to reduce ", sortedSongs );
        reduceRepeats(sortedSongs);
        console.log("sorted songs after reduce  ", sortedSongs );
        const sortedSongs2 = new Map([...sortedSongs.entries()].sort((a, b) => b[1][0] - a[1][0]));

                            // get the first 0->blendLimit of sortedSongs         // iterates over each songKey in that
        const blendedSongs = Array.from(sortedSongs2.keys()).slice(0, blendLimit).map(songKey => {
            
            // titles are of the form "Reminder - The Weeknd"
            // this splits into ["Reminder", "The Weeknd"]
            const [name, artist] = songKey.split(' - ');

            // now we need to search each user's top tracks 
            const song_in_user1 = user1TopTracks.find(s => s.name === name && s.artist === artist)
            const song_in_user2 = user2TopTracks.find(s => s.name === name && s.artist === artist)

            // and for later logic, we need the position as well
            const song_in_user1_index = user1TopTracks.findIndex(s => s.name === name && s.artist === artist)
            const song_in_user2_index = user2TopTracks.findIndex(s => s.name === name && s.artist === artist)
            // if the song wasn't found in the top tracks, the variable will be undefined
            // let's create another song object that holds modified info 
            

            if (song_in_user1 == undefined && song_in_user2 == undefined) {
                return null; // skip if neither user has the song
            }
            if (song_in_user1 == undefined) {
                const song = song_in_user2;
                song.user = [song.user];
                song.img = [song.img];
                return song;
            }
            else if (song_in_user2 == undefined) {
                const song = song_in_user1;
                song.user = [song.user];
                song.img = [song.img];
                return song;
            }
            else { //both are defined
                const song = song_in_user1; 

                // based on the blend logic, if a song is here, it's probably decently high up in both the user's top tracks 
                //console.log(song);
                //console.log("user 1 index ", song_in_user1_index);
                //console.log("user 2 index ", song_in_user2_index);

                const songUsers = [song_in_user1.user, song_in_user2.user];
                let songPfps = [song_in_user1.img, song_in_user2.img];

                if (song_in_user1_index < song_in_user2_index) {
                    songPfps = [song_in_user2.img, song_in_user1.img];
                }

                song.user = songUsers;
                song.img = songPfps;

                return song;
            }
            //const song = user1TopTracks.concat(user2TopTracks).find(s => s.name === name && s.artist === artist);
            
            return song;
        }).filter(song => song !== null);
        console.log("blended songs ", blendedSongs);
        console.log("first element ", blendedSongs[0]);

        // Shuffle the blend to make it a lil more random
        const shuffledSongs = blendedSongs
            .map(value => ({ value, sort: Math.random() }))
            .sort((a, b) => a.sort - b.sort)
            .map(({ value }) => value)

        return shuffledSongs;

    } catch (error) {
        console.error('Error creating blend playlist:', error);
    }
};

module.exports = {
    blendPlaylist
};
