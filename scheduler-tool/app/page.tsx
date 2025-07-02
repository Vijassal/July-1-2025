'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { isAuthenticated, getToken } from '@/lib/auth';
import { validateBookingLink } from '@/lib/api';
import BookingForm from '@/components/BookingForm';
import Unauthorized from '@/components/Unauthorized';

export default function SchedulerPage() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [linkValid, setLinkValid] = useState(false);
  const [linkToken, setLinkToken] = useState<string>('');
  const [eventId, setEventId] = useState<string>('');

  const searchParams = useSearchParams();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check if user is authenticated
        const isAuth = isAuthenticated();
        setAuthenticated(isAuth);

        // Get token from URL params or localStorage
        const token = getToken();
        if (token) {
          setLinkToken(token);
          
          // Validate the booking link token
          const isValid = await validateBookingLink(token);
          setLinkValid(isValid);
        }

        // Get event ID from URL params if available
        const eventIdParam = searchParams.get('event_id');
        if (eventIdParam) {
          setEventId(eventIdParam);
        }

      } catch (error) {
        console.error('Auth initialization error:', error);
        setAuthenticated(false);
        setLinkValid(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading scheduler...</p>
        </div>
      </div>
    );
  }

  // Show unauthorized page if not authenticated or link is invalid
  if (!authenticated || !linkValid) {
    return <Unauthorized />;
  }

  // Show the booking form
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <BookingForm linkToken={linkToken} eventId={eventId} />
      </div>
    </div>
  );
} 