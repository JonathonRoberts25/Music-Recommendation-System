import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from "@/lib/auth"; // This path is correct
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    // Step 1: Securely get the user's session.
    // This is the most likely point of failure in previous attempts.
    const session: any = await getServerSession(authOptions);

    // Step 2: Validate the session. If no user is logged in, or the user ID is missing, deny access.
    if (!session || !session.user?.id) {
      console.error("Save attempt failed: User not authenticated or session is missing user ID.");
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.log(`Save request received for user ID: ${session.user.id}`);

    // Step 3: Parse the incoming data from the frontend.
    const { playlistName, playlistUrl } = await request.json();

    // Step 4: Validate the incoming data.
    if (!playlistName || !playlistUrl) {
      console.error("Save attempt failed: Missing playlistName or playlistUrl in request body.");
      return NextResponse.json({ error: 'Playlist name and URL are required' }, { status: 400 });
    }

    // Step 5: Save the data to the database using Prisma.
    // This will create a new row in your "Playlist" table.
    console.log(`Attempting to save playlist "${playlistName}" to the database.`);
    const newPlaylist = await prisma.playlist.create({
      data: {
        name: playlistName,
        spotifyPlaylistUrl: playlistUrl, // This matches your correct schema
        userId: session.user.id,        // This links it to the logged-in user
      },
    });

    console.log(`Successfully saved playlist with ID: ${newPlaylist.id}`);
    
    // Step 6: Return a success response.
    return NextResponse.json({ success: true, message: 'Playlist saved!' });

  } catch (error) {
    // If anything in the 'try' block fails, this will catch the error.
    console.error('CRITICAL ERROR in /api/save-playlist:', error);
    // Return a generic 500 error to the frontend.
    return NextResponse.json({ error: 'Failed to save playlist due to a server error.' }, { status: 500 });
  }
}