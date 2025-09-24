"use client";

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';

// --- THIS IS THE FINAL, GUARANTEED FIX ---
// We REMOVE the entire 'declare global' block.
// The types from the '@types/spotify-web-playback-sdk' package
// will now be automatically used by TypeScript.
// --- END OF FIX ---

export const useSpotifyPlayer = () => {
    const { data: session } = useSession();
    const [deviceId, setDeviceId] = useState<string | null>(null);
    const [player, setPlayer] = useState<Spotify.Player | null>(null); // State to hold the player instance

    useEffect(() => {
        if (!session || !session.accessToken) {
            return;
        }
        const accessToken = session.accessToken;

        const scriptId = 'spotify-player-sdk';
        // Check if the script is already loaded
        if (document.getElementById(scriptId)) {
            return;
        }

        const script = document.createElement("script");
        script.id = scriptId;
        script.src = "https://sdk.scdn.co/spotify-player.js";
        script.async = true;
        document.body.appendChild(script);

        window.onSpotifyWebPlaybackSDKReady = () => {
            const spotifyPlayer = new window.Spotify.Player({
                name: 'Mood Music Recommender',
                getOAuthToken: (cb) => {
                    cb(accessToken);
                },
                volume: 0.5
            });

            setPlayer(spotifyPlayer); // Save the player instance

            spotifyPlayer.addListener('ready', ({ device_id }) => {
                console.log('Spotify Player is ready with Device ID', device_id);
                setDeviceId(device_id);
            });

            spotifyPlayer.addListener('not_ready', ({ device_id }) => {
                console.log('Device ID has gone offline', device_id);
            });

            spotifyPlayer.addListener('authentication_error', ({ message }) => {
                console.error('Authentication Error:', message);
            });

            spotifyPlayer.addListener('account_error', ({ message }) => {
                console.error('Account Error:', message, '(Note: Playback requires a Spotify Premium account)');
            });

            spotifyPlayer.connect();
        };

        // Cleanup function to disconnect the player when the component unmounts
        return () => {
            player?.disconnect();
        }

    }, [session, player]); // Added 'player' to the dependency array

    const play = async (trackUri: string) => {
        if (!deviceId || !session?.accessToken) {
            alert("Spotify Player is not ready. Please ensure you have a Spotify Premium account and the player is active in another tab or on your desktop.");
            return;
        }

        try {
            await fetch(`https://api.spotify.com/v1/me/player/play?device_id=${deviceId}`, {
                method: 'PUT',
                body: JSON.stringify({ uris: [trackUri] }),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.accessToken}`
                },
            });
        } catch (error) {
            console.error("Error playing track:", error);
        }
    };

    return { play };
};