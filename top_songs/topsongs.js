const apiKey = '80036787eac16b24d14eba32990f4f82'; // Replace 'YOUR_API_KEY' with your actual Last.fm API key
const username1 = 'kisslandxo'; 
const username2 = 'sadhiika'; 
const period = 'overall'; // You can change this to '7day', '1month', '3month', '6month', or '12month' as per your requirement

const apiUrl1 = `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${username1}&period=${period}&api_key=${apiKey}&format=json`;
const apiUrl2 = `https://ws.audioscrobbler.com/2.0/?method=user.gettoptracks&user=${username2}&period=${period}&api_key=${apiKey}&format=json`;

fetch(apiUrl1)
  .then(response => response.json())
  .then(data => {
    // Check if the response contains top tracks
    if (data && data.toptracks && data.toptracks.track) {
      // Loop through the tracks and format the output
      data.toptracks.track.forEach((track, index) => {
        console.log(`${index + 1}."${track.name}" by "${track.artist.name}" (${track.playcount})`);
      });
    } else {
      console.log('No top tracks found for the user.');
    }
  })
  .catch(error => console.error('Error fetching data:', error));
  fetch(apiUrl2)
  .then(response => response.json())
  .then(data => {
    // Check if the response contains top tracks
    if (data && data.toptracks && data.toptracks.track) {
      // Loop through the tracks and format the output
      data.toptracks.track.forEach((track, index) => {
        console.log(`${index + 1}."${track.name}" by "${track.artist.name}" (${track.playcount})`);
      });
    } else {
      console.log('No top tracks found for the user.');
    }
  })
  .catch(error => console.error('Error fetching data:', error));
