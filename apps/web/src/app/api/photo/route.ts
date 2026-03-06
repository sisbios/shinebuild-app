import { NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase-server';
import { getServerSession } from '@/lib/session';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Require authenticated session
  const session = await getServerSession();
  if (!session) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const path = req.nextUrl.searchParams.get('path');
  if (!path || path.includes('..')) {
    return new NextResponse('Bad Request', { status: 400 });
  }

  try {
    const bucketName =
      process.env.FIREBASE_STORAGE_BUCKET ||
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const bucket = getAdminStorage().bucket(bucketName);
    const file = bucket.file(path);

    const [exists] = await file.exists();
    if (!exists) {
      return new NextResponse('Not Found', { status: 404 });
    }

    const [metadata] = await file.getMetadata();
    const contentType = (metadata.contentType as string) || 'image/jpeg';

    const [buffer] = await file.download();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'private, max-age=3600',
      },
    });
  } catch (err) {
    console.error('Photo proxy error:', err);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
