"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useParams, useRouter } from 'next/navigation';
// --- THIS IS THE ONLY NEW IMPORT ---
import Link from "next/link";
// --- END OF NEW IMPORT ---
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const allAvailableGenres = Array.from(new Set(['pop', 'dance', 'indie', 'funk', 'disco', 'summer', 'rock', 'alternative', 'indie-rock', 'hard-rock', 'metal', 'emo', 'punk', 'hip-hop', 'r-n-b', 'soul', 'electronic', 'techno', 'house', 'trance', 'drum-and-bass', 'idm', 'ambient', 'chill', 'acoustic', 'folk', 'singer-songwriter', 'classical', 'piano', 'instrumental', 'blues', 'jazz', 'reggae']));

interface Song {
  id: string;
  name: string;
  artist: string;
  albumArt?: string;
}

export default function GenrePage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const moodParam = Array.isArray(params.mood) ? params.mood[0] : params.mood;
  
  if (!moodParam) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
          <p className="text-xl">Mood not found.</p>
          <Button onClick={() => router.push('/')}>Go Home</Button>
      </div>
    )
  }
  const mood = moodParam;
  
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenreToggle = (genre: string) => { setSelectedGenres(prev => { const newSet = new Set(prev); if (newSet.has(genre)) { newSet.delete(genre); } else { newSet.add(genre); } return newSet; }); };

  const generatePlaylist = async () => {
    if (!session) { setError("Please sign in to create a playlist."); return; }
    if (selectedGenres.size === 0) { setError("Please select at least one genre."); return; }
    
    setIsLoading(true);
    setError(null);
    setPlaylistUrl(null);
    
    try {
      const songsResponse = await fetch('/api/spotify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genres: Array.from(selectedGenres) }),
      });
      if (!songsResponse.ok) throw new Error('Failed to get song recommendations.');
      const songsData = await songsResponse.json();
      const trackUris = songsData.tracks.map((track: any) => `spotify:track:${track.id}`);

      const createResponse = await fetch('/api/create-playlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              playlistName: `${mood.charAt(0).toUpperCase() + mood.slice(1)} Mix`,
              trackUris: trackUris
          }),
      });
      if (!createResponse.ok) throw new Error('Failed to create the Spotify playlist.');
      const playlistData = await createResponse.json();
      setPlaylistUrl(playlistData.playlistUrl);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!session) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
          <p className="text-xl">Please sign in to create a playlist.</p>
          <Button onClick={() => signIn('spotify')}>Sign in with Spotify</Button>
      </div>
    )
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          {/* --- THIS IS THE ONLY CHANGE: WRAPPING THE LOGO IN A LINK --- */}
          <Link href="/" className="flex items-center mr-6">
            <Image src="/logo.gif" alt="Logo" width={32} height={32} className="mr-2" />
            <span className="font-bold">Mood Music</span>
          </Link>
          {/* --- END OF CHANGE --- */}
          <div className="flex flex-1 items-center justify-end"><ThemeToggle /></div>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-6 lg:py-12">
          <h1 className="text-3xl font-bold capitalize mb-4">Create a {mood} Playlist</h1>
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Select one or more genres to include:</h2>
            <div className="flex flex-wrap gap-2">
              {allAvailableGenres.map((genre: string) => (
                <Button key={genre} variant={selectedGenres.has(genre) ? "default" : "outline"} onClick={() => handleGenreToggle(genre)} className="capitalize">
                  {genre}
                </Button>
              ))}
            </div>
          </div>
          <Button onClick={generatePlaylist} size="lg" className="mb-8 text-lg py-6 px-8">Generate Playlist</Button>

          {isLoading && <PlaylistSkeleton />}
          {error && <p className="text-center text-destructive mt-4">{error}</p>}
          
          {playlistUrl && (
            <div className="mt-8 animate-in fade-in-50">
                <h2 className="text-2xl font-bold mb-4">Your playlist is ready!</h2>
                <iframe
                    style={{ borderRadius: '12px' }}
                    src={`https://open.spotify.com/embed/playlist/${playlistUrl.split('/').pop()}`}
                    width="100%"
                    height="380"
                    frameBorder="0"
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy"
                ></iframe>
            </div>
          )}
        </div>
      </main>
      <footer className="py-6 md:py-8">
        <div className="container flex items-center justify-center">
            <p className="text-center text-sm text-muted-foreground">Powered by Spotify and Last.fm APIs.</p>
        </div>
      </footer>
    </div>
  );
}

const PlaylistSkeleton = () => (
    <div className="w-full mt-8 animate-pulse">
        <Skeleton className="h-24 w-1/2 mb-4" />
        <Skeleton className="h-[380px] w-full rounded-xl" />
    </div>
);