import { NextRequest, NextResponse } from 'next/server';
import { createClientSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const eventId = searchParams.get('event_id');

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'start_date and end_date are required' },
        { status: 400 }
      );
    }

    const supabase = createClientSupabase();

    // Get available time slots for the date range
    // This is a placeholder implementation - you can customize based on your business logic
    const slots = generateAvailableSlots(startDate, endDate, eventId);

    return NextResponse.json({
      success: true,
      slots: slots
    });

  } catch (error) {
    console.error('Error fetching available slots:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch available slots' },
      { status: 500 }
    );
  }
}

function generateAvailableSlots(startDate: string, endDate: string, eventId?: string | null) {
  const slots = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Generate slots for each day in the range
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dateStr = date.toISOString().split('T')[0];
    
    // Skip weekends (optional - customize based on your business hours)
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) continue; // Skip Sunday and Saturday
    
    // Generate time slots for this day (9 AM to 6 PM, 30-minute intervals)
    const times = [];
    for (let hour = 9; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
        const displayTime = `${displayHour}:${minute.toString().padStart(2, '0')} ${ampm}`;
        
        times.push(displayTime);
      }
    }
    
    if (times.length > 0) {
      slots.push({
        date: dateStr,
        times: times
      });
    }
  }
  
  return slots;
} 