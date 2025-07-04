import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get('sb-oskhkfnhikxveddjgodz-auth-token');
  if (!authCookie) {
    return NextResponse.json({ error: 'No auth cookie' }, { status: 401 });
  }
  const token = authCookie.value;
  try {
    const [header, payload, signature] = token.split('.');
    const decodedPayload = JSON.parse(Buffer.from(payload, 'base64').toString('utf-8'));
    return NextResponse.json({ payload: decodedPayload });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to decode JWT', details: String(err) }, { status: 400 });
  }
} 