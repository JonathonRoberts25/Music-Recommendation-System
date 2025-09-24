import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const session: any = await getServerSession(authOptions);

  // 1. Check if the user is logged in
  // We need to get the user's ID to know who to save the playlist for.
  // The session object from NextAuth contains a user object with an ID.
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { playlistUrl } = await request.json();

  if (!playlistUrl) {
    return NextResponse.json({ error: 'Playlist URL is required' }, { status: 400 });
  }

  try {
    // 2. Create a new entry in our 'Playlist' table in the database
    await prisma.playlist.create({
      data: {
        spotifyPlaylistUrl: playlistUrl,
        // Associate this new playlist with the currently logged-in user
        userId: session.user.id,
      },
    });

    return NextResponse.json({ success: true, message: 'Playlist saved!' });
  } catch (error) {
    console.error('Error saving playlist to database:', error);
    return NextResponse.json({ error: 'Failed to save playlist.' }, { status: 500 });
  }
}