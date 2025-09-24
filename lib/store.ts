import { create } from 'zustand';

// Define the shape of a single song object, including the new genres array
interface Song {
  id: string;
  name: string;
  artist: string;
  albumArt?: string;
  genres: string[];
}

// Define the shape of our global state and the actions we can perform on it
interface SongPoolState {
  songPool: Song[];
  isLoading: boolean;
  error: string | null;
  fetchSongPool: (mood: string) => Promise<void>;
  clearSongPool: () => void;
}

export const useSongPoolStore = create<SongPoolState>((set) => ({
  songPool: [],
  isLoading: false,
  error: null,
  
  // This is the main action that fetches the entire song pool from our API
  fetchSongPool: async (mood) => {
    set({ isLoading: true, error: null, songPool: [] }); // Set loading state to true
    try {
      const response = await fetch('/api/spotify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mood }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch the song pool.');
      }

      const data = await response.json();
      set({ songPool: data.tracks, isLoading: false }); // On success, store the data and stop loading
    } catch (err: any) {
      set({ error: err.message, isLoading: false }); // On error, store the error message and stop loading
    }
  },

  // An action to clear the pool, useful for when the user navigates away
  clearSongPool: () => set({ songPool: [], error: null }),
}));