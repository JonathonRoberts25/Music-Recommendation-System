"use client";

import { useSongPoolStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";
import { Music2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Song {
  id: string;
  name: string;
  artist: string;
  albumArt?: string;
  genres: string[];
}

export default function GenreFilterPage({ mood }: { mood: string }) {
  // Read the state from our shared global store
  const { songPool, isLoading, error, clearSongPool } = useSongPoolStore();
  
  const [availableGenres, setAvailableGenres] = useState<string[]>([]);
  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [filteredSongs, setFilteredSongs] = useState<Song[]>([]);

  // When the component unmounts (user navigates away), clear the song pool
  useEffect(() => {
    return () => {
      clearSongPool();
    }
  }, [clearSongPool]);

  // When the song pool data arrives from the API, process it to find unique genres
  useEffect(() => {
    if (songPool.length > 0) {
      const allGenres = new Set<string>();
      songPool.forEach(song => {
        if (Array.isArray(song.genres)) {
          song.genres.forEach((genre: string) => allGenres.add(genre));
        }
      });
      setAvailableGenres(Array.from(allGenres).sort());
    }
  }, [songPool]);

  const handleGenreToggle = (genre: string) => {
    setSelectedGenres(prev => {
      const newSet = new Set(prev);
      if (newSet.has(genre)) {
        newSet.delete(genre);
      } else {
        newSet.add(genre);
      }
      return newSet;
    });
  };
  
  const generatePlaylist = () => {
    if (selectedGenres.size === 0) {
        // If no genre is selected, show a mix of the top songs from the pool
        setFilteredSongs(songPool.slice(0, 30));
        return;
    }
    // Filter the song pool based on the user's selected genres
    const filtered = songPool.filter(song => 
        song.genres?.some((genre: string) => selectedGenres.has(genre))
    );
    setFilteredSongs(filtered.slice(0, 30));
  };

  if (isLoading) {
    return <GenrePageSkeleton />;
  }

  if (error) {
    return <div className="container py-12 text-center text-destructive">Error: {error}</div>;
  }

  return (
    <div className="container py-6 lg:py-12">
      <h1 className="text-3xl font-bold capitalize mb-4">
        Filter Playlist for: {mood}
      </h1>
      <div className="mb-8">
        <h2 className="text-xl font-semibold mb-3">Select Genres:</h2>
        {availableGenres.length > 0 ? (
          <div className="flex flex-wrap gap-2">
              {availableGenres.map(genre => (
                  <Button 
                      key={genre} 
                      variant={selectedGenres.has(genre) ? "default" : "outline"}
                      onClick={() => handleGenreToggle(genre)}
                      className="capitalize"
                  >
                      {genre}
                  </Button>
              ))}
          </div>
        ) : (
          <p className="text-muted-foreground">No specific genres found for this mood.</p>
        )}
      </div>

      <Button onClick={generatePlaylist} size="lg" className="mb-8 text-lg py-6 px-8">
        Generate Playlist
      </Button>

      {/* Display the final generated playlist */}
      {filteredSongs.length > 0 && (
         <Card className="w-full animate-in fade-in-50">
            <CardHeader><CardTitle className="text-2xl">Your Curated Playlist</CardTitle></CardHeader>
            <CardContent>
                <ul className="space-y-4">
                    {filteredSongs.map(song => (
                         <li key={song.id} className="flex items-center gap-4 p-2 rounded-md transition-colors hover:bg-accent">
                            {song.albumArt ? (
                                <Image src={song.albumArt} alt={`Album art for ${song.name}`} width={48} height={48} className="rounded-md" />
                            ) : (
                                <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center"><Music2 className="text-muted-foreground" /></div>
                            )}
                            <div>
                                <p className="font-semibold">{song.name}</p>
                                <p className="text-sm text-muted-foreground">{song.artist}</p>
                            </div>
                         </li>
                    ))}
                </ul>
            </CardContent>
         </Card>
      )}
    </div>
  );
}

// A simple skeleton component to show while the song pool is loading.
const GenrePageSkeleton = () => (
    <div className="container py-6 lg:py-12 animate-pulse">
        <Skeleton className="h-9 w-1/3 mb-4" />
        <div className="mb-8">
            <Skeleton className="h-7 w-1/4 mb-3" />
            <div className="flex flex-wrap gap-2">
                {[...Array(10)].map((_, i) => <Skeleton key={i} className="h-10 w-28" />)}
            </div>
        </div>
        <Skeleton className="h-12 w-48 mb-8" />
    </div>
);