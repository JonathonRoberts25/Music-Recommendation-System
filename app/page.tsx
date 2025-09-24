"use client";

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from "@/components/theme-toggle";
import Image from 'next/image';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
// --- NEW IMPORTS ---
import { useSession, signIn, signOut } from 'next-auth/react';
// --- END OF NEW IMPORTS ---

const moods = ['Happy', 'Sad', 'Angry', 'Energetic', 'Calm', 'Focus', 'Romantic', 'Nostalgic', 'Confident'] as const;
type Mood = typeof moods[number];

export default function Home() {
  const router = useRouter();
  // --- NEW: Get the user's session data ---
  const { data: session } = useSession();
  // --- END OF NEW ---

  const handleMoodSelect = (mood: Mood) => {
    router.push(`/genres/${mood.toLowerCase()}`);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center">
          <div className="mr-4 flex items-center">
            <Image src="/logo.gif" alt="Logo" width={32} height={32} className="mr-2" />
            <span className="font-bold">Mood Music</span>
          </div>
          <div className="flex flex-1 items-center justify-end space-x-4">
            {/* --- THIS IS THE NEW LOGIC FOR THE HEADER --- */}
            {session ? (
              // If the user is logged in, show their name and a Sign Out button
              <>
                <span className="text-sm font-medium text-muted-foreground">
                  Welcome, {session.user?.name}
                </span>
                <Button variant="outline" onClick={() => signOut()}>Sign Out</Button>
              </>
            ) : (
              // If the user is not logged in, show the Sign In button
              <Button onClick={() => signIn('spotify')}>Sign in with Spotify</Button>
            )}
            {/* --- END OF NEW LOGIC --- */}
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <div className="container py-12 lg:py-24">
          <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-4 text-center">
            <h1 className="text-3xl font-bold leading-tight tracking-tighter md:text-5xl lg:leading-[1.1]">
              Discover Music for Any Mood
            </h1>
            <p className="max-w-[750px] text-lg text-muted-foreground sm:text-xl">
              Select a mood to begin building your perfect playlist.
            </p>
          </div>

          <div className="flex flex-col items-center gap-8 pt-12">
            <Select onValueChange={(value: Mood) => handleMoodSelect(value)}>
              <SelectTrigger className="w-[320px] text-lg py-8">
                <SelectValue placeholder="Select a mood to begin..." />
              </SelectTrigger>
              <SelectContent>
                {moods.map((mood) => (
                  <SelectItem key={mood} value={mood} className="text-lg capitalize">
                    {mood}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </main>

      
    </div>
  );
}