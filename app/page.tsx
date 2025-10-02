"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSession, signIn, signOut } from "next-auth/react";

const moods = [
  "Happy",
  "Sad",
  "Angry",
  "Energetic",
  "Calm",
  "Focus",
  "Romantic",
  "Nostalgic",
  "Confident",
] as const;
type Mood = (typeof moods)[number];

export default function Home() {
  const router = useRouter();
  const { data: session } = useSession();

  const handleMoodSelect = (mood: Mood) => {
    router.push(`/genres/${mood.toLowerCase()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground overflow-x-hidden">
      {/* --- HEADER --- */}
      <header className="w-full bg-background border-b border-border pb-4">
  <div className="flex items-center justify-between px-8 pt-4">
    {/* Left: Home button */}
    <Button
      onClick={() => router.push("/")}
      size="sm"
      className="bg-primary text-primary-foreground hover:bg-primary/80"
    >
      Home
    </Button>

    {/* Center: Title */}
    <h1 className="text-2xl font-bold tracking-wide">Mood Music</h1>

    {/* Right: Sign In / Out */}
    <div>
      {session ? (
        <Button
          onClick={() => signOut()}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/80"
        >
          Sign Out
        </Button>
      ) : (
        <Button
          onClick={() => signIn("spotify")}
          size="sm"
          className="bg-primary text-primary-foreground hover:bg-primary/80"
        >
          Sign In
        </Button>
      )}
    </div>
  </div>
</header>



      {/* --- MAIN CONTENT --- */}
      <main className="flex flex-col flex-1 items-center justify-center text-center gap-6 px-4">
        <h2 className="text-4xl font-bold tracking-tighter sm:text-5xl md:text-6xl">
          Music for Every Mood
        </h2>
        <p className="max-w-[700px] text-muted-foreground md:text-xl">
          Select a mood to begin your journey.
        </p>

        {session ? (
          <div className="mt-6">
            <Select onValueChange={(value: Mood) => handleMoodSelect(value)}>
              <SelectTrigger className="w-[320px] text-lg py-6 h-16 bg-primary text-primary-foreground rounded-lg shadow-lg border border-border hover:bg-primary/80">
                <SelectValue placeholder="Select a mood to begin..." />
              </SelectTrigger>

              <SelectContent
                position="popper"
                sideOffset={8}
                className="rounded-lg border border-border bg-card text-card-foreground shadow-lg"
              >
                {moods.map((mood) => (
                  <SelectItem
                    key={mood}
                    value={mood}
                    className="text-lg capitalize rounded-md px-3 py-2 hover:bg-primary hover:text-primary-foreground"
                  >
                    {mood}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div className="mt-8">
            <Button
              onClick={() => signIn("spotify")}
              size="lg"
              className="text-lg py-6 px-10 bg-primary text-primary-foreground hover:bg-primary/80"
            >
              Sign in with Spotify to Start
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
