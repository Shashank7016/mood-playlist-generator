const express = require('express');
const querystring = require('querystring');
const cookieParser = require('cookie-parser');
const SpotifyWebApi = require('spotify-web-api-node');
const { exec } = require('child_process');
const path = require('path');
const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cookieParser());

const spotifyApi = new SpotifyWebApi({
  clientId: '037f6ad87f434da1a3346be89fc47fa6',
  clientSecret: '7dead38f11a347b48577a5fa0df0b612',
  redirectUri: 'http://localhost:5000/callback'
});

const stateKey = 'spotify_auth_state';

function generateRandomString(length) {
  let text = '';
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (let i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}

// Serve static files from the React app
app.use(express.static(path.join(__dirname, '../build'))); // Adjust the path

app.get('/login', (req, res) => {
  const state = generateRandomString(16);
  res.cookie(stateKey, state);

  const scope = 'user-read-private user-read-email playlist-modify-public user-top-read';
  const redirectUri = spotifyApi.getRedirectURI();

  res.redirect('https://accounts.spotify.com/authorize?' +
    querystring.stringify({
      response_type: 'code',
      client_id: spotifyApi.getClientId(),
      scope: scope,
      redirect_uri: redirectUri,
      state: state
    }));
});

app.get('/callback', (req, res) => {
  const code = req.query.code || null;
  const state = req.query.state || null;
  const storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    spotifyApi.authorizationCodeGrant(code).then(
      function(data) {
        const accessToken = data.body['access_token'];
        const refreshToken = data.body['refresh_token'];

        spotifyApi.setAccessToken(accessToken);
        spotifyApi.setRefreshToken(refreshToken);

        res.redirect('/#' +
          querystring.stringify({
            access_token: accessToken,
            refresh_token: refreshToken
          }));
      },
      function(err) {
        console.log('Something went wrong!', err);
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    );
  }
});

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
  if (!spotifyApi.getAccessToken()) {
    return res.status(401).send('Unauthorized: Please log in to Spotify');
  }

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
  
  try {
    // Fetch user's top tracks and combine with mood-based playlist
    const topTracksData = await spotifyApi.getMyTopTracks({ limit: 10 });
    console.log('Top Tracks Data:', topTracksData.body.items);

    const moodPlaylistData = await spotifyApi.searchPlaylists(playlistName);
    console.log('Mood Playlist Data:', moodPlaylistData.body.playlists.items);

    if (!moodPlaylistData.body.playlists.items.length) {
      throw new Error('No playlists found for the given mood');
    }

    const topTracks = topTracksData.body.items.map(track => ({
      name: track.name,
      artist: track.artists[0].name,
      url: track.external_urls.spotify
    }));
    
    const moodPlaylist = moodPlaylistData.body.playlists.items[0];
    console.log('Selected Mood Playlist:', moodPlaylist);

    return {
      name: moodPlaylist.name,
      tracks: topTracks // Removed the moodPlaylist.tracks.href as it was incorrect
    };
  } catch (error) {
    console.error('Error in getPlaylistFromSpotify:', error);
    throw error;
  }
}

// Catch-all handler to serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../build/index.html')); // Adjust the path
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
