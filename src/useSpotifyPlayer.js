import { useState, useEffect } from 'react';

const useSpotifyPlayer = (token) => {
  const [player, setPlayer] = useState(null);
  const [deviceId, setDeviceId] = useState(null);

  useEffect(() => {
    if (!token) return;

    const loadSpotifySdk = () => {
      return new Promise((resolve, reject) => {
        if (!document.getElementById('spotify-sdk')) {
          const script = document.createElement('script');
          script.id = 'spotify-sdk';
          script.src = 'https://sdk.scdn.co/spotify-player.js';
          script.async = true;
          script.onload = () => {
            console.log('Spotify SDK script loaded');
            resolve();
          };
          script.onerror = () => {
            console.error('Failed to load Spotify SDK script');
            reject(new Error('Failed to load Spotify SDK script'));
          };
          document.body.appendChild(script);
        } else {
          console.log('Spotify SDK script already loaded');
          resolve();
        }
      });
    };

    const initializeSpotifyPlayer = () => {
      window.onSpotifyWebPlaybackSDKReady = () => {
        console.log('Spotify SDK ready');
        const player = new window.Spotify.Player({
          name: 'Web Playback SDK',
          getOAuthToken: cb => { 
            console.log('Getting OAuth token');
            cb(token); 
          },
          volume: 0.5
        });

        player.addListener('initialization_error', ({ message }) => {
          console.error('Initialization error:', message);
        });

        player.addListener('authentication_error', ({ message }) => {
          console.error('Authentication error:', message);
        });

        player.addListener('account_error', ({ message }) => {
          console.error('Account error:', message);
        });

        player.addListener('playback_error', ({ message }) => {
          console.error('Playback error:', message);
        });

        player.addListener('player_state_changed', (state) => {
          console.log('Player state changed:', state);
        });

        player.addListener('ready', ({ device_id }) => {
          console.log('Ready with Device ID', device_id);
          setDeviceId(device_id);
        });

        player.addListener('not_ready', ({ device_id }) => {
          console.log('Device ID has gone offline', device_id);
        });

        player.connect().then(success => {
          if (success) {
            console.log('The Web Playback SDK successfully connected to Spotify!');
          } else {
            console.log('The Web Playback SDK could not connect to Spotify.');
          }
        });
        
        setPlayer(player);
      };
    };

    loadSpotifySdk()
      .then(() => {
        console.log('Initializing Spotify Player');
        initializeSpotifyPlayer();
      })
      .catch(error => {
        console.error('Error loading or initializing Spotify SDK:', error);
      });
  }, [token]);

  return { player, deviceId };
};

export default useSpotifyPlayer;
