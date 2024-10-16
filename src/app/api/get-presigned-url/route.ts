import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getPresignedUrl } from '@/lib/s3';

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { fileName } = await req.json();
    const { presignedUrl, fileKey } = await getPresignedUrl(fileName, userId);
    return NextResponse.json({ presignedUrl, fileKey });
  } catch (error) {
    console.error('Error generating pre-signed URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}