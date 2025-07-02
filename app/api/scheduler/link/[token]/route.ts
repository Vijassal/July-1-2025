import { NextRequest, NextResponse } from 'next/server';
import { createClientSupabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  try {
    const { token } = params;

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Token is required' },
        { status: 400 }
      );
    }

    const supabase = createClientSupabase();

    // Find the booking link by token
    const { data: bookingLink, error } = await supabase
      .from('vendor_booking_links')
      .select(`
        *,
        event:events (
          id,
          name,
          date,
          location,
          description
        )
      `)
      .eq('link_token', token)
      .eq('is_active', true)
      .single();

    if (error || !bookingLink) {
      return NextResponse.json(
        { success: false, error: 'Invalid or expired booking link' },
        { status: 404 }
      );
    }

    // Check if the link has expired
    if (bookingLink.expires_at && new Date(bookingLink.expires_at) < new Date()) {
      return NextResponse.json(
        { success: false, error: 'This booking link has expired' },
        { status: 410 }
      );
    }

    return NextResponse.json({
      success: true,
      link: {
        id: bookingLink.id,
        title: bookingLink.title,
        description: bookingLink.description,
        event_id: bookingLink.event_id,
        expires_at: bookingLink.expires_at,
        event: bookingLink.event
      }
    });

  } catch (error) {
    console.error('Error validating booking link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to validate booking link' },
      { status: 500 }
    );
  }
} 