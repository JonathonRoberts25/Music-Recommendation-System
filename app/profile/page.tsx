"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Music2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface SavedPlaylist {
  id: string;
  name: string;
  trackIds: string[];
}

interface Song {
  id: string;
  name: string;
  artist: string;
  albumArt?: string;
}

// Helper function to fetch the user's saved playlists from our database
async function fetchSavedPlaylists() {
  const res = await fetch('/api/get-saved-playlists');
  if (!res.ok) throw new Error("Failed to fetch saved playlists");
  return res.json();
}

// Helper function to get full track details for a list of IDs from Spotify
async function fetchPlaylistTracks(trackIds: string[]) {
  const res = await fetch('/api/get-tracks', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ trackIds }),
  });
  if (!res.ok) throw new Error("Failed to fetch tracks");
  return res.json();
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [savedPlaylists, setSavedPlaylists] = useState<SavedPlaylist[]>([]);
  const [activePlaylist, setActivePlaylist] = useState<Song[] | null>(null);
  const [activePlaylistName, setActivePlaylistName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      fetchSavedPlaylists()
        .then(data => setSavedPlaylists(data.playlists))
        .catch(err => setError(err.message))
        .finally(() => setIsLoading(false));
    }
  }, [session]);

  const handlePlaylistClick = async (playlist: SavedPlaylist) => {
    setIsLoading(true);
    setActivePlaylist(null);
    setError(null);
    setActivePlaylistName(playlist.name);
    try {
      const data = await fetchPlaylistTracks(playlist.trackIds);
      setActivePlaylist(data.tracks);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
    
  const playSong = (trackId: string) => {
    alert(`Playback functionality requires the Spotify Web Playback SDK and a Premium account. Playing track: ${trackId}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
            <Link href="/" className="flex items-center mr-6">
                <Image src="/logo.gif" alt="Logo" width={32} height={32} className="mr-2" />
                <span className="font-bold">Mood Music</span>
            </Link>
            <div className="flex-1"></div>
            <nav className="flex items-center gap-4">
              <Link href="/profile" className="text-sm font-medium transition-colors hover:text-primary">My Playlists</Link>
              <ThemeToggle />
            </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-6 lg:py-12">
          <h1 className="text-3xl font-bold mb-8">My Saved Playlists</h1>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Column for saved playlist names */}
            <div className="md:col-span-1">
              <h2 className="text-xl font-semibold mb-4">Click to Load a Playlist</h2>
              {savedPlaylists.length > 0 ? (
                <div className="space-y-2">
                  {savedPlaylists.map(playlist => (
                    <Button key={playlist.id} variant="ghost" onClick={() => handlePlaylistClick(playlist)} className="w-full justify-start text-left h-auto py-2">
                      {playlist.name}
                    </Button>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">You haven't saved any playlists yet.</p>
              )}
            </div>

            {/* Column to display the active playlist */}
            <div className="md:col-span-2">
              {isLoading && <PlaylistSkeleton />}
              {error && <p className="text-center text-destructive">{error}</p>}
              {!isLoading && !error && activePlaylist ? (
                <Card className="w-full">
                  <CardHeader><CardTitle>{activePlaylistName}</CardTitle></CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {activePlaylist.map(song => (
                        <li key={song.id} className="flex items-center gap-4 p-2 rounded-md hover:bg-accent group">
                          <div className="relative">
                            <Image src={song.albumArt || '/logo.gif'} alt={song.name} width={48} height={48} className="rounded-md" />
                            <Button variant="ghost" size="icon" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100" onClick={() => playSong(song.id)}>
                              <Play className="h-6 w-6 text-white" />
                            </Button>
                          </div>
                          <div>
                            <p className="font-semibold">{song.name}</p>
                            <p className="text-sm text-muted-foreground">{song.artist}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ) : (
                !isLoading && !error && <p className="text-muted-foreground mt-4">Select a playlist on the left to view its songs.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

const PlaylistSkeleton = () => (
    <div className="w-full animate-pulse">
        <Card>
            <CardHeader><Skeleton className="h-7 w-1/2" /></CardHeader>
            <CardContent className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-4">
                        <Skeleton className="h-12 w-12 rounded-md" />
                        <div className="space-y-2">
                            <Skeleton className="h-4 w-[250px]" />
                            <Skeleton className="h-4 w-[200px]" />
                        </div>
                    </div>
                ))}
            </CardContent>
        </Card>
    </div>
);