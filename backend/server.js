const express = require('express');
const { exec } = require('child_process');
const path = require('path');
const SpotifyWebApi = require('spotify-web-api-node');
const app = express();
const PORT = 5000;

app.use(express.json());

const spotifyApi = new SpotifyWebApi({
  clientId: '037f6ad87f434da1a3346be89fc47fa6',
  clientSecret: '7dead38f11a347b48577a5fa0df0b612',
  redirectUri: 'http://localhost:3000/callback'
});

// Get Spotify access token
let accessToken;

spotifyApi.clientCredentialsGrant().then(
  function(data) {
    console.log('Access token retrieved');
    accessToken = data.body['access_token'];
    spotifyApi.setAccessToken(accessToken);
  },
  function(err) {
    console.log('Something went wrong when retrieving an access token', err);
  }
);

app.post('/analyze-mood', (req, res) => {
  const { text } = req.body;
  console.log(`Received text for mood analysis: ${text}`);
  const scriptPath = path.join(__dirname, 'sentiment_analysis.py');

  exec(`python "${scriptPath}" "${text}"`, (error, stdout) => {
    if (error) {
      console.error('Error executing script:', error);
      return res.status(500).send('Error analyzing mood');
    }
    const mood = stdout.trim();
    console.log(`Mood analysis result: ${mood}`);
    res.json({ mood });
  });
});

app.get('/playlist', async (req, res) => {
  const { mood } = req.query;
  console.log(`Fetching playlist for mood: ${mood}`);
  try {
    const playlist = await getPlaylistFromSpotify(mood);
    res.json({ playlist });
  } catch (error) {
    console.error('Error fetching playlist:', error);
    res.status(500).send('Error fetching playlist');
  }
});

async function getPlaylistFromSpotify(mood) {
  let playlistName;
  switch (mood) {
    case 'happy':
      playlistName = 'Happy Hits';
      break;
    case 'sad':
      playlistName = 'Sad Songs';
      break;
    case 'neutral':
      playlistName = 'Chill Hits';
      break;
    default:
      playlistName = 'Top Hits';
  }
  console.log(`Searching Spotify for playlist: ${playlistName}`);
  const data = await spotifyApi.searchPlaylists(playlistName);
  const playlist = data.body.playlists.items[0];
  console.log(`Found playlist: ${playlist.name}`);
  return {
    name: playlist.name,
    tracks: playlist.external_urls.spotify,
  };
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
