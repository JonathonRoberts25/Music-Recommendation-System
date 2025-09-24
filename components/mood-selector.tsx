"use client";
import { useRouter } from 'next/navigation';
import { useSongPoolStore } from '@/lib/store';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const moods = ['Happy', 'Sad', 'Energetic', 'Calm', 'Focus', 'Workout'] as const;
type Mood = typeof moods[number];

export function MoodSelector() {
  const router = useRouter();
  const fetchSongPool = useSongPoolStore((state) => state.fetchSongPool);

  const handleMoodSelect = (mood: Mood) => {
    // 1. Start the API call in the background
    fetchSongPool(mood);
    // 2. Immediately navigate the user
    router.push(`/genres/${mood.toLowerCase()}`);
  };

  return (
    <Select onValueChange={handleMoodSelect}>
      <SelectTrigger className="w-[280px] text-lg py-6">
        <SelectValue placeholder="Select a mood..." />
      </SelectTrigger>
      <SelectContent>
        {moods.map((mood) => (
          <SelectItem key={mood} value={mood} className="text-lg">
            {mood}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}