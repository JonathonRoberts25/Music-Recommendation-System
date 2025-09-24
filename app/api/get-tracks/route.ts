import { NextResponse } from 'next/server';
import SpotifyWebApi from 'spotify-web-api-node';

// This route does not require a user session, it can use the app's credentials
const getAccessToken = async () => {
  const client_id = process.env.SPOTIFY_CLIENT_ID;
  const client_secret = process.env.SPOTIFY_CLIENT_SECRET;
  const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
  const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;

  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  if (!response.ok) { throw new Error('Failed to get access token.'); }
  const data = await response.json();
  return data.access_token;
};

export async function POST(request: Request) {
    try {
        const { trackIds } = await request.json();
        if (!trackIds || !Array.isArray(trackIds)) {
            return NextResponse.json({ error: 'Track IDs are required.' }, { status: 400 });
        }
        
        const accessToken = await getAccessToken();
        const spotifyApi = new SpotifyWebApi({ accessToken });

        // Spotify's Get Several Tracks endpoint is perfect for this
        const { body } = await spotifyApi.getTracks(trackIds);

        const tracks = body.tracks.map(track => ({
            id: track.id,
            name: track.name,
            artist: track.artists.map(a => a.name).join(', '),
            albumArt: track.album.images[0]?.url,
        }));

        return NextResponse.json({ tracks });
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch track details.' }, { status: 500 });
    }
}