import React, { useState } from 'react';
import axios from 'axios';

function App() {
  const [moodText, setMoodText] = useState('');
  const [playlist, setPlaylist] = useState(null);

  const handleLogin = () => {
    window.location.href = 'http://localhost:5000/login';
  };

  const handleSubmit = async () => {
    try {
      console.log(`Sending mood text to backend: ${moodText}`);
      const response = await axios.post('/analyze-mood', { text: moodText });
      const mood = response.data.mood;
      console.log(`Received mood from backend: ${mood}`);

      const playlistResponse = await axios.get(`/playlist?mood=${mood}`);
      console.log(`Received playlist from backend: ${playlistResponse.data.playlist}`);
      setPlaylist(playlistResponse.data.playlist);
    } catch (error) {
      if (error.response && error.response.status === 401) {
        alert('Please log in to Spotify to generate a playlist.');
      } else {
        console.error('Error fetching playlist:', error);
      }
    }
  };

  return (
    <div>
      <h1>Mood-Based Playlist Generator</h1>
      <button onClick={handleLogin}>Login with Spotify</button>
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
                <li key={index}><a href={track.url}>{track.name} by {track.artist}</a></li>
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
