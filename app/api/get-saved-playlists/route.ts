import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';

import { PrismaClient } from '@prisma/client';

import { authOptions } from "@/lib/auth";
const prisma = new PrismaClient();

export async function GET() {
  const session: any = await getServerSession(authOptions);
  if (!session || !session.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const playlists = await prisma.playlist.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      // --- THIS IS THE FIX ---
      select: { id: true, name: true, spotifyPlaylistUrl: true }, // Correct field
      // --- END OF FIX ---
    });
    return NextResponse.json({ playlists });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch playlists.' }, { status: 500 });
  }
}