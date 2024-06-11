const express = require('express');
const axios = require('axios');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();

const app = express();
const port = 3000;

// Easier way to get files compared to what we did originally
app.use(express.static(path.join(__dirname, 'public')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

const clientId = "15b25050bac14194961cceac08c00a3f";
const clientSecret = "8e527048844146c5a1524ace1a93ee30";
const redirectUri = 'http://localhost:3000/callback';
const algo = require('./script.js');

const generateRandomString = length => {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
};

// Route for the home page since I organized the files differently
app.get('/home-page', (req, res) => {
    res.sendFile(path.join(__dirname, 'public/home.html'));
});

app.get('/login', (req, res) => {
    const state = generateRandomString(16);
    const scope = 'playlist-modify-public';

    const queryParams = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        scope: scope,
        redirect_uri: redirectUri,
        state: state,
    });

    res.redirect(`https://accounts.spotify.com/authorize?${queryParams.toString()}`);
});

app.get('/callback', async (req, res) => {
    const code = req.query.code || null;
    const state = req.query.state || null;

    try {
        const tokenResponse = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
            code: code,
            redirect_uri: redirectUri,
            grant_type: 'authorization_code',
        }).toString(), {
            headers: {
                'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const accessToken = tokenResponse.data.access_token;
        res.redirect(`/home-page?access_token=${accessToken}`);
    } catch (error) {
        res.send('Error retrieving access token');
    }
});

/**
 * This might be a bit hefty, so if anyone wants to clean this up, go ahead. It works though.
 * Took me a while, but pretty much what I did here was:
 * - Put the track URIs in the new playlist
 * - Rendered the 'playlist' template with the playlist URL, song details, and access token
 **/
app.get('/create-playlist', async (req, res) => {
    const accessToken = req.query.access_token;
    const username1 = req.query.user1;
    const username2 = req.query.user2;
    const userIdResponse = await axios.get('https://api.spotify.com/v1/me', {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
        },
    });
    const userId = userIdResponse.data.id;
    const playlistResponse = await axios.post(`https://api.spotify.com/v1/users/${userId}/playlists`, {
        name: `${username1} and ${username2}'s Blend`,
        public: true,
    }, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });
    const playlistId = playlistResponse.data.id;
    const tracks = await algo.blendPlaylist(username1, username2);
    const trackUris = await Promise.all(tracks.map(async (track) => {
        const searchResponse = await axios.get(`https://api.spotify.com/v1/search`, {
            params: {
                q: `${track.name} ${track.artist}`,
                type: 'track',
                limit: 1,
            },
            headers: {
                'Authorization': `Bearer ${accessToken}`,
            },
        });
        
        // console.log('track', track);
        // console.log(track.name);
        // console.log(track.artist);
        
        return {
            uri: searchResponse.data.tracks.items[0].uri,
            name: track.name,
            artist: track.artist,
            users: track.user,
            profiles: track.img

        };
    }));
    await axios.post(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
        uris: trackUris.map(track => track.uri),
    }, {
        headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
        },
    });
    res.render('playlist', {
        playlistUrl: `https://open.spotify.com/embed/playlist/${playlistId}`,
        blendedSongs: trackUris,
        accessToken: accessToken, 
        user1: username1,
        user2: username2
    });
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
