"use client";

import { useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { useParams, useRouter } from 'next/navigation';
import Link from "next/link";
import Image from "next/image";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Save, Check } from "lucide-react";

const allAvailableGenres = Array.from(new Set(['pop', 'dance', 'indie', 'funk', 'disco', 'rock', 'alternative', 'hard-rock', 'metal', 'emo', 'punk', 'hip-hop', 'r-n-b', 'soul', 'electronic', 'techno', 'house', 'trance', 'idm', 'ambient', 'chill', 'acoustic', 'folk', 'classical', 'piano', 'instrumental', 'blues', 'jazz', 'reggae']));

export default function GenrePage() {
  const { data: session } = useSession();
  const params = useParams();
  const router = useRouter();
  const moodParam = Array.isArray(params.mood) ? params.mood[0] : params.mood;
  
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [playlistUrl, setPlaylistUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // If the mood is missing from the URL, show an error and a way home.
  if (!moodParam) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <p className="text-xl">Mood not found in URL.</p>
        <Button onClick={() => router.push('/')}>Go Home</Button>
      </div>
    );
  }
  const mood = moodParam;

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev => {
      const newSet = new Set(prev);
      if (newSet.has(genre)) { newSet.delete(genre); }
      else { newSet.add(genre); }
      return newSet;
    });
  };

  const generatePlaylist = async () => {
    if (!session) { setError("Please sign in to create a playlist."); return; }
    if (selectedGenres.size === 0) { setError("Please select at least one genre."); return; }
    
    setIsLoading(true);
    setError(null);
    setPlaylistUrl(null);
    setIsSaved(false);
    
    try {
      // Step 1: Get the list of song ideas
      const songsResponse = await fetch('/api/spotify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ genres: Array.from(selectedGenres) }),
      });
      if (!songsResponse.ok) throw new Error('Try again');
      const songsData = await songsResponse.json();
      const trackUris = songsData.tracks.map((track: any) => `spotify:track:${track.id}`);

      // Step 2: Ask our API to create the playlist on the user's Spotify account
      const createResponse = await fetch('/api/create-playlist', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              playlistName: `${mood.charAt(0).toUpperCase() + mood.slice(1)} Mix - ${Array.from(selectedGenres).join(', ')}`,
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

  const savePlaylist = async () => {
    if (!playlistUrl) return;
    setIsSaving(true);
    setError(null);
    try {
      const response = await fetch('/api/save-playlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          playlistName: `${mood.charAt(0).toUpperCase() + mood.slice(1)} - ${Array.from(selectedGenres).join(', ')}`,
          playlistUrl: playlistUrl
        }),
      });
      if (!response.ok) throw new Error('Failed to save the playlist to your profile.');
      setIsSaved(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // If the user is not logged in, prompt them to sign in.
  if (!session) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <p className="text-xl">Please sign in to create and save playlists.</p>
        <Button onClick={() => signIn('spotify')}>Sign in with Spotify</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <Button
          onClick={() => router.push("/")}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/80"
        >
          Home
        </Button>
          <div className="flex-1"></div>
          <nav className="flex items-center gap-4">
            <Button
          onClick={() => router.push("/profile")}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/80"
        >
          My Playlists
        </Button>
          </nav>
        </div>
      </header>
      <main className="flex-1">
        <div className="container py-6 lg:py-12">
          <h1 className="text-3xl font-bold capitalize mb-4">Create a {mood} Playlist</h1>
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-3">Select one or more genres to include:</h2>
            
            {/* THIS IS THE CORRECTED, STYLED CHECKBOX GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-x-4 gap-y-2">
              {allAvailableGenres.map((genre: string) => (
                <div key={genre} className="flex items-center space-x-2 p-2 rounded-md transition-colors hover:bg-accent">
                  <Checkbox 
                    id={genre} 
                    onCheckedChange={() => handleGenreToggle(genre)}
                    checked={selectedGenres.has(genre)}
                  />
                  <Label 
                    htmlFor={genre} 
                    className="capitalize text-base font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {genre}
                  </Label>
                </div>
              ))}
            </div>
            {/* END OF THE CHECKBOX GRID */}

          </div>
          <Button onClick={generatePlaylist} size="lg" className="mb-8 text-lg py-6 px-8">Generate Playlist</Button>

          {isLoading && <PlaylistSkeleton />}
          {error && <p className="text-center text-destructive mt-4">{error}</p>}
          
          {playlistUrl && (
            <div className="mt-8 animate-in fade-in-50">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Your playlist is ready!</h2>
                <Button onClick={savePlaylist} disabled={isSaving || isSaved}>
                  {isSaved ? <Check className="mr-2 h-4 w-4" /> : <Save className="mr-2 h-4 w-4" />}
                  {isSaving ? "Saving..." : isSaved ? "Saved!" : "Save to My Playlists"}
                </Button>
              </div>
              <iframe
                  style={{ borderRadius: '12px' }}
                  src={playlistUrl.replace('/playlist/', '/embed/playlist/')}
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
      
    </div>
  );
}

const PlaylistSkeleton = () => (
    <div className="w-full mt-8 animate-pulse">
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