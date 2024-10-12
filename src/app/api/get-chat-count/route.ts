// app/api/get-chat-count/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { chats } from '@/lib/db/schema';
import { eq, count } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log("Fetching chat count for user:", userId);

  try {
    const result = await db
      .select({ count: count(chats.id) })
      .from(chats)
      .where(eq(chats.userId, userId));

    console.log("Query result:", result);

    return NextResponse.json({ count: result[0].count });
  } catch (error) {
    console.error('Error fetching chat count:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}