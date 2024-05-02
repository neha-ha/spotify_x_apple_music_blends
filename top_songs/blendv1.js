const apiKey = '80036787eac16b24d14eba32990f4f82'; // Replace 'YOUR_API_KEY' with your actual Last.fm API key
const users = ['kisslandxo', 'sadhiika']; // Replace 'username1' and 'username2' with the usernames for which you want to fetch top tracks
const period = 'overall'; // You can change this to '7day', '1month', '3month', '6month', or '12month' as per your requirement
const limit = 1000; // Number of top tracks to fetch for each user

const getUserTopTracks = async (username) => {
    const apiUrl = `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${username}&period=${period}&limit=${limit}&api_key=${apiKey}&format=json`;

    try {
        const response = await fetch(apiUrl);
        const data = await response.json();
        return data.toptracks.track.map(track => `${track.name} by ${track.artist.name}`);
    } catch (error) {
        console.error(`Error fetching top tracks for user ${username}:`, error);
        return [];
    }
};

const blendPlaylist = async () => {
    try {
        // Fetch top tracks for both users
        const [user1TopTracks, user2TopTracks] = await Promise.all(users.map(getUserTopTracks));

        // Find shared songs
        const sharedSongs = user1TopTracks.filter(song => user2TopTracks.includes(song));

        // Print the blend playlist
        console.log("Shared Songs:");
        sharedSongs.forEach((song, index) => {
            console.log(`${index + 1}. ${song}`);
        });
    } catch (error) {
        console.error('Error creating blend playlist:', error);
    }
};

blendPlaylist();