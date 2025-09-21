// File: app/api/create-playlist/route.ts

import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import SpotifyWebApi from 'spotify-web-api-node';
import { NextResponse } from 'next/server';

// --- START: THE CRITICAL FIX ---
// The interface now correctly expects an array of strings called 'queries'.
interface MoodSearch {
  playlistName: string;
  queries: string[];
}
// --- END: THE CRITICAL FIX ---

const moodSearches: { [key: string]: MoodSearch } = {
  rainy: {
    playlistName: 'Rainy Day Chill',
    queries: ['genre:acoustic', 'genre:chill', 'genre:sad', 'genre:ambient'],
  },
  summer: {
    playlistName: 'Summer Party Vibe',
    queries: ['genre:pop', 'genre:dance', 'genre:summer', 'genre:happy'],
  },
  winter: {
    playlistName: 'Winter Focus Lo-fi',
    queries: ['genre:"lo-fi"', 'genre:ambient', 'genre:study'],
  },
  spring: {
    playlistName: 'Spring Awakening',
    queries: ['genre:indie-pop', 'genre:"folk-pop"', 'genre:singer-songwriter'],
  },
  workout: {
    playlistName: 'High-Energy Workout',
    queries: ['genre:work-out', 'genre:edm', 'genre:techno', 'genre:pop'],
  },
  party: {
    playlistName: 'Ultimate Party Mix',
    queries: ['genre:party', 'genre:dance', 'genre:pop', 'genre:disco'],
  },
  focus: {
    playlistName: 'Deep Focus Instrumentals',
    queries: ['genre:focus', 'genre:ambient', 'genre:classical', 'genre:study'],
  },
};

const getWeatherBasedMood = (weatherMain: string): string => {
  const weather = weatherMain.toLowerCase();
  if (weather.includes('rain') || weather.includes('drizzle')) return 'rainy';
  if (weather.includes('clear')) return 'summer';
  if (weather.includes('snow')) return 'winter';
  if (weather.includes('clouds')) return 'spring';
  return 'summer';
};

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken || !session?.userId || !session.userMarket) {
    return NextResponse.json({ error: 'Not authenticated or user market missing' }, { status: 401 });
  }

  let { mood, latitude, longitude } = await req.json();

  if (mood === 'weather') {
    try {
      const weatherResponse = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${process.env.OPENWEATHER_API_KEY}`);
      if (!weatherResponse.ok) throw new Error('Failed to fetch weather data');
      const weatherData = await weatherResponse.json();
      mood = getWeatherBasedMood(weatherData.weather[0].main);
    } catch (error) {
       console.error("Weather API Error:", error);
       return NextResponse.json({ error: 'Failed to get weather data.' }, { status: 500 });
    }
  }

  const searchDetails = moodSearches[mood];
  if (!searchDetails) {
    return NextResponse.json({ error: 'Invalid mood specified' }, { status: 400 });
  }

  const spotifyApi = new SpotifyWebApi({ accessToken: session.accessToken });

  try {
    const searchPromises = searchDetails.queries.map(query =>
      spotifyApi.searchTracks(query, {
        market: session.userMarket,
        limit: 50,
      })
    );
    
    const searchResults = await Promise.all(searchPromises);

    const allTracks = searchResults.flatMap(result => result.body.tracks?.items || []);

    const uniqueTrackUris = [...new Set(allTracks.map(track => track.uri))];

    for (let i = uniqueTrackUris.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [uniqueTrackUris[i], uniqueTrackUris[j]] = [uniqueTrackUris[j], uniqueTrackUris[i]];
    }

    const trackUris = uniqueTrackUris.slice(0, 30);

    if (trackUris.length === 0) {
      return NextResponse.json({ error: "Could not find any tracks matching this mood." }, { status: 404 });
    }

    const playlist = await spotifyApi.createPlaylist(searchDetails.playlistName, {
      description: `A playlist for a ${mood} mood, generated via search.`,
      public: true,
    });

    await spotifyApi.addTracksToPlaylist(playlist.body.id, trackUris);

    return NextResponse.json({ playlistUrl: playlist.body.external_urls.spotify });

  } catch (error: any) {
    console.error("\n--- SPOTIFY API ERROR ---", error);
    const errorMessage = error.body?.error?.message || 'An unexpected Spotify API error occurred.';
    const errorStatus = error.body?.error?.status || 500;
    return NextResponse.json({ error: errorMessage }, { status: errorStatus });
  }
}