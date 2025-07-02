import { NextRequest, NextResponse } from 'next/server';
import { createClientSupabase } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      vendor_name,
      vendor_email,
      vendor_phone,
      service_type,
      service_description,
      proposed_date,
      proposed_time,
      event_id,
      booking_link_id
    } = body;

    // Validate required fields
    if (!vendor_name || !vendor_email || !service_type || !proposed_date || !proposed_time) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = createClientSupabase();

    // Insert the booking into the database
    const { data, error } = await supabase
      .from('vendor_bookings')
      .insert({
        booking_link_id: booking_link_id || null,
        event_id: event_id || null,
        vendor_name,
        vendor_email,
        vendor_phone: vendor_phone || null,
        service_type,
        service_description: service_description || null,
        proposed_date,
        proposed_time,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json(
        { success: false, error: 'Failed to create booking' },
        { status: 500 }
      );
    }

    // Generate a booking ID (you can customize this format)
    const bookingId = `BK-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    return NextResponse.json({
      success: true,
      booking_id: bookingId,
      message: 'Booking submitted successfully',
      data: data
    });

  } catch (error) {
    console.error('Error submitting booking:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit booking' },
      { status: 500 }
    );
  }
} 