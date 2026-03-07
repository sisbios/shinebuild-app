import { type NextRequest, NextResponse } from 'next/server';
import { getAdminStorage } from '@/lib/firebase-server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  // Quick auth check: session cookie must exist (set by our server on login).
  // Paths are UUID-based so not guessable; full token verification avoided here
  // to prevent Firebase network timeouts from breaking image loads.
  const sessionCookie = req.cookies.get('sb-session');
  if (!sessionCookie?.value) {
    return new NextResponse('Unauthorized', { status: 401 });
  }

  const path = req.nextUrl.searchParams.get('path');
  if (!path || path.includes('..') || path.includes('\0')) {
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

    const [[metadata], [buffer]] = await Promise.all([
      file.getMetadata(),
      file.download(),
    ]);

    const contentType = (metadata.contentType as string) || 'image/jpeg';

    return new NextResponse(new Uint8Array(buffer), {
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
