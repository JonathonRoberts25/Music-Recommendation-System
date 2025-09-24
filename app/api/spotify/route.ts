import { NextResponse } from 'next/server';

const client_id = process.env.SPOTIFY_CLIENT_ID;
const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
const lastfm_api_key = process.env.LASTFM_API_KEY;
const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

const getAccessToken = async () => {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!response.ok) { throw new Error('Failed to get access token from Spotify.'); }
  const data = await response.json();
  return data.access_token;
};

// --- THIS IS THE NEW SHUFFLE FUNCTION ---
// A simple function to randomly shuffle an array (Fisher-Yates algorithm)
const shuffleArray = (array: any[]) => {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}
// --- END OF NEW FUNCTION ---

export async function POST(request: Request) {
  try {
    const { genres } = await request.json();
    if (!genres || !Array.isArray(genres) || genres.length === 0) {
      return NextResponse.json({ error: 'At least one genre is required' }, { status: 400 });
    }
    
    // --- STEP 1: Discover a LARGE pool of Song Ideas from Last.fm ---
    console.log(`Searching Last.fm for top tracks in genres:`, genres);
    const lastfmPromises = genres.map(genre => {
      // Ask for a larger limit to get more songs to choose from
      const LASTFM_ENDPOINT = `https://ws.audioscrobbler.com/2.0/?method=tag.gettoptracks&tag=${genre}&api_key=${lastfm_api_key}&format=json&limit=50`;
      return fetch(LASTFM_ENDPOINT).then(res => res.json());
    });

    const lastfmResults = await Promise.all(lastfmPromises);

    const uniqueLastfmTracks = Array.from(
      lastfmResults
        .flatMap(result => result.tracks?.track || [])
        .reduce((map, track) => {
          const key = `${track.name.toLowerCase()}_${track.artist.name.toLowerCase()}`;
          if (!map.has(key)) map.set(key, track);
          return map;
        }, new Map())
        .values()
    );

    if (uniqueLastfmTracks.length === 0) {
      throw new Error("Could not find any track ideas on Last.fm for the selected genres.");
    }

    // --- STEP 2: SHUFFLE the pool and take a random sample ---
    const shuffledTracks = shuffleArray(uniqueLastfmTracks);
    // Take a sample of up to 40 tracks to search on Spotify
    const trackSample = shuffledTracks.slice(0, 40);
    console.log(`Found ${uniqueLastfmTracks.length} unique ideas, taking a random sample of ${trackSample.length} to search Spotify...`);
    
    // --- STEP 3: Find those specific songs on Spotify ---
    const accessToken = await getAccessToken();
    const spotifySearchPromises = trackSample.map((track: any) => {
      const searchQuery = encodeURIComponent(`track:"${track.name}" artist:"${track.artist.name}"`);
      return fetch(`https://api.spotify.com/v1/search?q=${searchQuery}&type=track&limit=1`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      }).then(res => res.json());
    });

    const spotifySearchResults = await Promise.all(spotifySearchPromises);

    // --- STEP 4: Format the final list ---
    const tracks = spotifySearchResults
      .map((result: any) => {
        const track = result.tracks?.items?.[0];
        if (!track || !track.id) return null;
        return {
          id: track.id,
          name: track.name,
          artist: track.artists.map((artist: any) => artist.name).join(', '),
          albumArt: track.album?.images?.[0]?.url,
        };
      })
      .filter(Boolean)
      .slice(0, 30); // Ensure we return a max of 30 songs

    if (tracks.length === 0) {
      throw new Error("Could not find any of the discovered songs on Spotify.");
    }

    return NextResponse.json({ tracks });

  } catch (error: any) {
    console.error('Error in POST handler:', error.message);
    return NextResponse.json({ error: `Failed to fetch data. Reason: ${error.message}` }, { status: 500 });
  }
}