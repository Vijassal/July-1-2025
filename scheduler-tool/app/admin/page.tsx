'use client';

import { useState, useEffect } from 'react';
import { isAuthenticated, getUserInfo } from '@/lib/auth';
import { Clock, Calendar, User, Mail, Phone, CheckCircle, XCircle } from 'lucide-react';

interface Booking {
  id: string;
  vendor_name: string;
  vendor_email: string;
  vendor_phone?: string;
  service_type: string;
  service_description?: string;
  proposed_date: string;
  proposed_time: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

export default function AdminPage() {
  const [loading, setLoading] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);

  useEffect(() => {
    const initializeAdmin = async () => {
      try {
        // Check if user is authenticated
        const isAuth = isAuthenticated();
        setAuthenticated(isAuth);

        if (isAuth) {
          const user = getUserInfo();
          setUserInfo(user);
          
          // Load bookings (placeholder - replace with API call)
          // For now, we'll use mock data
          setBookings([
            {
              id: '1',
              vendor_name: 'John Doe',
              vendor_email: 'john@example.com',
              vendor_phone: '+1-555-0123',
              service_type: 'catering',
              service_description: 'Wedding catering for 100 guests',
              proposed_date: '2024-02-15',
              proposed_time: '10:00 AM',
              status: 'pending',
              created_at: '2024-01-15T10:30:00Z',
            },
            {
              id: '2',
              vendor_name: 'Jane Smith',
              vendor_email: 'jane@example.com',
              service_type: 'photography',
              service_description: 'Event photography services',
              proposed_date: '2024-02-20',
              proposed_time: '02:00 PM',
              status: 'approved',
              created_at: '2024-01-14T15:45:00Z',
            },
          ]);
        }
      } catch (error) {
        console.error('Admin initialization error:', error);
        setAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    initializeAdmin();
  }, []);

  const handleStatusUpdate = async (bookingId: string, status: 'approved' | 'rejected') => {
    try {
      // Placeholder API call
      console.log(`Updating booking ${bookingId} to ${status}`);
      
      // Update local state
      setBookings(prev => prev.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status }
          : booking
      ));
    } catch (error) {
      console.error('Error updating booking status:', error);
      alert('Failed to update booking status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin panel...</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-600">
            You need admin privileges to access this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Booking Management</h1>
              <p className="text-gray-600">Manage vendor booking requests</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Welcome, {userInfo?.name || userInfo?.email}</p>
              <p className="text-xs text-gray-400">Admin Panel</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Recent Bookings</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Vendor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {bookings.map((booking) => (
                  <tr key={booking.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {booking.vendor_name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {booking.vendor_email}
                        </div>
                        {booking.vendor_phone && (
                          <div className="text-sm text-gray-500">
                            {booking.vendor_phone}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900 capitalize">
                          {booking.service_type}
                        </div>
                        {booking.service_description && (
                          <div className="text-sm text-gray-500 truncate max-w-xs">
                            {booking.service_description}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(booking.proposed_date).toLocaleDateString()}
                      </div>
                      <div className="text-sm text-gray-500">
                        {booking.proposed_time}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        booking.status === 'approved'
                          ? 'bg-green-100 text-green-800'
                          : booking.status === 'rejected'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {booking.status === 'pending' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'approved')}
                            className="text-green-600 hover:text-green-900 flex items-center"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </button>
                          <button
                            onClick={() => handleStatusUpdate(booking.id, 'rejected')}
                            className="text-red-600 hover:text-red-900 flex items-center"
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {bookings.length === 0 && (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No bookings yet</h3>
              <p className="text-gray-500">Bookings will appear here once vendors submit requests.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 