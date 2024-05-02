const apiKey = '80036787eac16b24d14eba32990f4f82'; // Replace 'YOUR_API_KEY' with your actual Last.fm API key
const username = 'kisslandxo'; 
const period = 'overall'; // You can change this to '7day', '1month', '3month', '6month', or '12month' as per your requirement

const apiUrl = `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${username}&period=${period}&api_key=${apiKey}&format=json`;

fetch(apiUrl)
  .then(response => response.json())
  .then(data => {
    // Check if the response contains top tracks
    if (data && data.toptracks && data.toptracks.track) {
      // Loop through the tracks and format the output
      data.toptracks.track.forEach((track, index) => {
        console.log(`"${track.name}" by "${track.artist.name}" (${track.playcount})`);
      });
    } else {
      console.log('No top tracks found for the user.');
    }
  })
  .catch(error => console.error('Error fetching data:', error));
