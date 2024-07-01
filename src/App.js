import React, { useState, useEffect } from 'react';
import axios from 'axios';
import useSpotifyPlayer from './useSpotifyPlayer';
import 'react-h5-audio-player/lib/styles.css';
import AudioPlayer from 'react-h5-audio-player';

function App() {
  const [moodText, setMoodText] = useState('');
  const [playlist, setPlaylist] = useState(null);
  const [currentTrack, setCurrentTrack] = useState(null);
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
      setCurrentTrack(playlistResponse.data.playlist.tracks[0]);
    } catch (error) {
      console.error('Error fetching playlist:', error);
      alert('Error fetching playlist: ' + error.message);
    }
  };

  const playNextTrack = () => {
    const currentTrackIndex = playlist.tracks.findIndex(track => track.uri === currentTrack.uri);
    const nextTrack = playlist.tracks[currentTrackIndex + 1];
    if (nextTrack) {
      setCurrentTrack(nextTrack);
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
      {playlist ? (
        <div>
          <h2>{playlist.name}</h2>
          {currentTrack && (
            <AudioPlayer
              autoPlay
              src={currentTrack.uri}
              onEnded={playNextTrack}
              showSkipControls={true}
              showJumpControls={false}
              customAdditionalControls={[]}
              header={`Now Playing: ${currentTrack.name} by ${currentTrack.artist}`}
            />
          )}
        </div>
      ) : (
        <p>No playlist available</p>
      )}
    </div>
  );
}

export default App;
