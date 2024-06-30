import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useSpotifyPlayer from './useSpotifyPlayer';

function App() {
  const [moodText, setMoodText] = useState('');
  const [playlist, setPlaylist] = useState(null);
  const [token, setToken] = useState(null);

  useEffect(() => {
    axios.get('/token').then(response => {
      const token = response.data.accessToken;
      setToken(token);
      console.log(`Access token obtained: ${token}`);
    });
  }, []);

  const { player, deviceId } = useSpotifyPlayer(token);

  const handleSubmit = async () => {
    try {
      console.log(`Sending mood text to backend: ${moodText}`);
      const response = await axios.post('/analyze-mood', { text: moodText });
      const mood = response.data.mood;
      console.log(`Received mood from backend: ${mood}`);

      const playlistResponse = await axios.get(`/playlist?mood=${mood}`);
      console.log(`Received playlist from backend:`, playlistResponse.data.playlist);
      setPlaylist(playlistResponse.data.playlist);
    } catch (error) {
      console.error('Error fetching playlist:', error);
      alert('Error fetching playlist: ' + error.message);
    }
  };

  const playSong = (uri) => {
    if (player && deviceId) {
      player._options.getOAuthToken(accessToken => {
        fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
          method: 'PUT',
          body: JSON.stringify({ uris: [uri] }),
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${accessToken}`
          },
        });
      });
    }
  };

  return (
    <div>
      <h1>Mood-Based Playlist Generator</h1>
      <textarea
        value={moodText}
        onChange={(e) => setMoodText(e.target.value)}
        placeholder="Describe your mood..."
      />
      <button onClick={handleSubmit}>Generate Playlist</button>
      <div>
        {playlist ? (
          <div>
            <h2>{playlist.name}</h2>
            <ul>
              {playlist.tracks.map((track, index) => (
                <li key={index}>
                  {track.name} by {track.artist}
                  <button onClick={() => playSong(track.uri)}>Play</button>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p>No playlist available</p>
        )}
      </div>
    </div>
  );
}

export default App;
