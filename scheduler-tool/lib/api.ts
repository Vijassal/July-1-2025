// API utilities for connecting to the main app's API

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.mycompany.com';

export interface BookingData {
  id?: string;
  vendor_name: string;
  vendor_email: string;
  vendor_phone?: string;
  service_type: string;
  service_description?: string;
  proposed_date: string;
  proposed_time: string;
  event_id?: string;
  booking_link_id?: string;
}

export interface BookingResponse {
  success: boolean;
  booking_id?: string;
  message?: string;
  error?: string;
}

export interface AvailableSlotsResponse {
  success: boolean;
  slots?: Array<{
    date: string;
    times: string[];
  }>;
  error?: string;
}

/**
 * Get available booking slots for a specific date range
 */
export async function getAvailableSlots(
  startDate: string,
  endDate: string,
  eventId?: string
): Promise<AvailableSlotsResponse> {
  try {
    const params = new URLSearchParams({
      start_date: startDate,
      end_date: endDate,
    });
    
    if (eventId) {
      params.append('event_id', eventId);
    }
    
    const response = await fetch(`${API_BASE_URL}/api/scheduler/slots?${params}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching available slots:', error);
    return {
      success: false,
      error: 'Failed to fetch available slots',
    };
  }
}

/**
 * Submit a booking request
 */
export async function submitBooking(bookingData: BookingData): Promise<BookingResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scheduler/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bookingData),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error submitting booking:', error);
    return {
      success: false,
      error: 'Failed to submit booking',
    };
  }
}

/**
 * Get booking link details
 */
export async function getBookingLinkDetails(linkToken: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/scheduler/link/${linkToken}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error fetching booking link details:', error);
    return null;
  }
}

/**
 * Validate booking link token
 */
export async function validateBookingLink(linkToken: string): Promise<boolean> {
  try {
    const details = await getBookingLinkDetails(linkToken);
    return details && details.success;
  } catch (error) {
    return false;
  }
} 