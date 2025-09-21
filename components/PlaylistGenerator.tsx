// File: components/PlaylistGenerator.tsx

'use client';

import { useState } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
}

const Button = ({ children, onClick, disabled = false, className = '' }: ButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-6 py-3 font-semibold text-white rounded-full transition-colors duration-300 ${
      disabled 
        ? 'bg-gray-500 cursor-not-allowed' 
        : 'bg-green-600 hover:bg-green-700'
    } ${className}`}
  >
    {children}
  </button>
);

export default function PlaylistGenerator() {
  const { data: session } = useSession();
  const [status, setStatus] = useState<{ loading: boolean; error: string | null; playlistUrl: string | null }>({ loading: false, error: null, playlistUrl: null });
  
  // --- START: NEW STATE FOR REMIX FEATURE ---
  const [lastMood, setLastMood] = useState<string | null>(null);
  // --- END: NEW STATE FOR REMIX FEATURE ---


  const handleCreatePlaylist = async (mood: string) => {
    // --- START: UPDATE STATE ON CLICK ---
    setLastMood(mood); // Remember the mood we are generating
    // --- END: UPDATE STATE ON CLICK ---

    setStatus({ loading: true, error: null, playlistUrl: null });
    let body: { mood: string; latitude?: number; longitude?: number } = { mood };
    if (mood === 'weather') {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => navigator.geolocation.getCurrentPosition(resolve, reject));
        body.latitude = position.coords.latitude;
        body.longitude = position.coords.longitude;
      } catch (geoError) {
        setStatus({ loading: false, error: 'Could not get location. Please enable it.', playlistUrl: null });
        return;
      }
    }
    try {
      const res = await fetch('/api/create-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Something went wrong.');
      setStatus({ loading: false, error: null, playlistUrl: data.playlistUrl });
    } catch (error: any) {
      setStatus({ loading: false, error: error.message, playlistUrl: null });
    }
  };

  if (!session) {
    // ... (This section remains the same)
    return (
      <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white text-center">
        <h1 className="text-5xl font-bold mb-4">Mood Playlist Generator</h1>
        <p className="mb-8 text-lg text-gray-400">Sign in to create Spotify playlists based on your mood.</p>
        <Button onClick={() => signIn('spotify')}>Sign in with Spotify</Button>
      </main>
    );
  }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white text-center p-4">
      <div className="absolute top-4 right-4 flex items-center gap-4">
        <p>Signed in as {session.user?.name}</p>
        <Button onClick={() => signOut()} className="bg-red-600 hover:bg-red-700">
          Sign Out
        </Button>
      </div>

      <h1 className="text-5xl font-bold mb-4">Select a Mood</h1>
      <p className="mb-8 text-lg text-gray-400">We'll generate a personalized playlist from popular music.</p>
      
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Button onClick={() => handleCreatePlaylist('weather')} disabled={status.loading}>🌦️ By Weather</Button>
        <Button onClick={() => handleCreatePlaylist('rainy')} disabled={status.loading}>💧 Rainy Day</Button>
        <Button onClick={() => handleCreatePlaylist('summer')} disabled={status.loading}>☀️ Summer Vibe</Button>
        <Button onClick={() => handleCreatePlaylist('winter')} disabled={status.loading}>❄️ Winter Chill</Button>
        <Button onClick={() => handleCreatePlaylist('spring')} disabled={status.loading}>🌸 Spring Day</Button>
        <Button onClick={() => handleCreatePlaylist('workout')} disabled={status.loading}>💪 Workout</Button>
        <Button onClick={() => handleCreatePlaylist('party')} disabled={status.loading}>🎉 Party</Button>
        <Button onClick={() => handleCreatePlaylist('focus')} disabled={status.loading}>🎧 Focus</Button>
      </div>

      <div className="mt-8 h-24 flex items-center justify-center">
        {status.loading && <p className="text-xl animate-pulse">Creating your playlist...</p>}
        {status.error && <p className="text-xl text-red-400">Error: {status.error}</p>}
        {status.playlistUrl && (
          <div className="text-center">
            <p className="text-xl text-green-400">✅ Success! Your playlist is ready.</p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <a href={status.playlistUrl} target="_blank" rel="noopener noreferrer" className="px-6 py-3 font-semibold bg-white text-gray-900 rounded-full hover:scale-105 transition-transform">
                Open in Spotify
              </a>
              {/* --- START: NEW REMIX BUTTON --- */}
              <Button 
                onClick={() => handleCreatePlaylist(lastMood!)} // The '!' is safe because this only renders when lastMood is set
                disabled={status.loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Remix Playlist 🔀
              </Button>
              {/* --- END: NEW REMIX BUTTON --- */}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}