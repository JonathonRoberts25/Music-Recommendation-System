import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: Request) {
  const session: any = await getServerSession(authOptions);

  // 1. Check if the user is logged in
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { playlistId } = await request.json();

  if (!playlistId) {
    return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 });
  }

  try {
    // 2. Find the playlist to ensure it belongs to the logged-in user
    const playlist = await prisma.playlist.findUnique({
      where: { id: playlistId },
    });

    if (!playlist || playlist.userId !== session.user.id) {
      // If the playlist doesn't exist or doesn't belong to this user, deny access
      return NextResponse.json({ error: 'Playlist not found or you do not have permission to delete it.' }, { status: 404 });
    }

    // 3. If the check passes, delete the playlist
    await prisma.playlist.delete({
      where: { id: playlistId },
    });

    return NextResponse.json({ success: true, message: 'Playlist deleted!' });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    return NextResponse.json({ error: 'Failed to delete playlist.' }, { status: 500 });
  }
}