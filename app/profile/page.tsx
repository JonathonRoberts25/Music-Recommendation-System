"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react"; // Import the trash icon
import { useParams, useRouter } from 'next/navigation';

interface SavedPlaylist {
  id: string;
  name: string;
  spotifyPlaylistUrl: string;
}

// Helper function to fetch the user's saved playlists from our database
async function fetchSavedPlaylists() {
  const res = await fetch('/api/get-saved-playlists');
  if (!res.ok) {
    throw new Error("Failed to fetch saved playlists");
  }
  const data = await res.json();
  return data.playlists || [];
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      setIsLoading(true);
      fetchSavedPlaylists()
        .then(setSavedPlaylists)
        .catch(err => setError(err.message))
        .finally(() => setIsLoading(false));
    }
  }, [session]);

  // --- THIS IS THE NEW DELETE FUNCTION ---
  const handleDeletePlaylist = async (playlistId: string) => {
    // Optimistically remove the playlist from the UI immediately
    setSavedPlaylists(currentPlaylists => currentPlaylists.filter(p => p.id !== playlistId));

    try {
      const response = await fetch('/api/delete-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ playlistId }),
      });

      if (!response.ok) {
        // If the API call fails, add the playlist back to the UI and show an error
        setError('Failed to delete playlist. Please refresh the page.');
        // Re-fetch to get the true state
        fetchSavedPlaylists().then(setSavedPlaylists);
      }
    } catch (err: any) {
      setError(err.message);
      fetchSavedPlaylists().then(setSavedPlaylists);
    }
  };
  // --- END OF NEW FUNCTION ---

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center"> 
          <Button
            onClick={() => router.push("/")}
            size="sm"
            className="bg-primary text-primary-foreground hover:bg-primary/80"
          >
            Home
          </Button>    
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-6 lg:py-12">
            <h1 className="text-3xl font-bold mb-8">My Saved Playlists</h1>
            {isLoading && <p>Loading your playlists...</p>}
            {error && <p className="text-center text-destructive mb-4">{error}</p>}
            {savedPlaylists.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {savedPlaylists.map(playlist => (
                        <div key={playlist.id}>
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-xl font-semibold">{playlist.name}</h2>
                                {/* --- THIS IS THE NEW DELETE BUTTON --- */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => handleDeletePlaylist(playlist.id)}
                                >
                                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                                </Button>
                                {/* --- END OF NEW BUTTON --- */}
                            </div>
                            <iframe
                                style={{ borderRadius: '12px' }}
                                src={playlist.spotifyPlaylistUrl.replace('/playlist/', '/embed/playlist/')}
                                width="100%"
                                height="380"
                                frameBorder="0"
                                allow="encrypted-media"
                                loading="lazy"
                            ></iframe>
                        </div>
                    ))}
                </div>
            ) : (
                !isLoading && <p className="text-lg text-muted-foreground">You haven't saved any playlists yet. Go create one!</p>
            )}
        </div>
      </main>
    </div>
  );
}