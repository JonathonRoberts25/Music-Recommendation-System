import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]/route';
import { PrismaClient } from '@prisma/client';

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
      select: { id: true, name: true, trackIds: true }, // Select only needed fields
    });
    return NextResponse.json({ playlists });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch playlists.' }, { status: 500 });
  }
}