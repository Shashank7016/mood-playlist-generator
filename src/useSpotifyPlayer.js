import { useState, useEffect } from 'react';

const useSpotifyPlayer = (token) => {
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);

  useEffect(() => {
    if (!token) return;

    const loadSpotifySdk = () => {
      return new Promise((resolve) => {
        if (!document.getElementById('spotify-sdk')) {
          const script = document.createElement('script');
          script.id = 'spotify-sdk';
          script.src = 'https://sdk.scdn.co/spotify-player.js';
          script.async = true;
          script.onload = () => resolve();
          document.body.appendChild(script);
        } else {
          resolve();
        }
      });
    };

    const initializeSpotifyPlayer = () => {
      window.onSpotifyWebPlaybackSDKReady = () => {
        const player = new window.Spotify.Player({
          name: 'Web Playback SDK',
          getOAuthToken: cb => { cb(token); },
          volume: 0.5
        });

        player.addListener('ready', ({ device_id }) => {
          console.log('Ready with Device ID', device_id);
          setDeviceId(device_id);
        });

        player.addListener('not_ready', ({ device_id }) => {
          console.log('Device ID has gone offline', device_id);
        });

        player.connect();
        setPlayer(player);
      };
    };

    loadSpotifySdk().then(initializeSpotifyPlayer);
  }, [token]);

  return { player, deviceId };
};

export default useSpotifyPlayer;
