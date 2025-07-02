'use client';

import { useState, useEffect } from 'react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay } from 'date-fns';
import { Calendar, Clock, User, Mail, Phone, FileText, CheckCircle } from 'lucide-react';
import { submitBooking, BookingData } from '@/lib/api';

interface BookingFormProps {
  linkToken?: string;
  eventId?: string;
}

export default function BookingForm({ linkToken, eventId }: BookingFormProps) {
  const [step, setStep] = useState<'date' | 'time' | 'details' | 'confirmation'>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [bookingId, setBookingId] = useState<string>('');

  // Form data
  const [formData, setFormData] = useState({
    vendor_name: '',
    vendor_email: '',
    vendor_phone: '',
    service_type: '',
    service_description: '',
  });

  // Generate calendar dates (next 4 weeks)
  const today = new Date();
  const startDate = startOfWeek(today);
  const endDate = endOfWeek(addDays(today, 28));
  const calendarDates = eachDayOfInterval({ start: startDate, end: endDate });

  // Available time slots (placeholder - replace with API call)
  const timeSlots = [
    '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
    '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM',
    '01:00 PM', '01:30 PM', '02:00 PM', '02:30 PM',
    '03:00 PM', '03:30 PM', '04:00 PM', '04:30 PM',
    '05:00 PM', '05:30 PM', '06:00 PM', '06:30 PM',
  ];

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    setStep('time');
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep('details');
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bookingData: BookingData = {
        ...formData,
        proposed_date: selectedDate ? format(selectedDate, 'yyyy-MM-dd') : '',
        proposed_time: selectedTime,
        event_id: eventId,
        booking_link_id: linkToken,
      };

      const response = await submitBooking(bookingData);

      if (response.success) {
        setBookingId(response.booking_id || '');
        setStep('confirmation');
      } else {
        alert(response.error || 'Booking failed. Please try again.');
      }
    } catch (error) {
      console.error('Booking error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resetBooking = () => {
    setStep('date');
    setSelectedDate(null);
    setSelectedTime('');
    setFormData({
      vendor_name: '',
      vendor_email: '',
      vendor_phone: '',
      service_type: '',
      service_description: '',
    });
  };

  if (step === 'confirmation') {
    return (
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking Confirmed!</h2>
          <p className="text-gray-600 mb-4">
            Your booking has been successfully submitted. We'll get back to you soon.
          </p>
          {bookingId && (
            <p className="text-sm text-gray-500 mb-6">
              Booking ID: <span className="font-mono">{bookingId}</span>
            </p>
          )}
          <button
            onClick={resetBooking}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Book Another Appointment
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-6">
        <h1 className="text-2xl font-bold">Schedule Your Appointment</h1>
        <p className="text-blue-100 mt-1">Choose a date and time that works for you</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center p-4 bg-gray-50">
        <div className="flex items-center space-x-4">
          {['date', 'time', 'details'].map((stepName, index) => (
            <div key={stepName} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step === stepName
                    ? 'bg-blue-600 text-white'
                    : step === 'details' && index < 2
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-300 text-gray-600'
                }`}
              >
                {index + 1}
              </div>
              {index < 2 && (
                <div
                  className={`w-12 h-0.5 mx-2 ${
                    step === 'details' ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        {step === 'date' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Select a Date</h2>
            <div className="grid grid-cols-7 gap-2">
              {/* Day headers */}
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                  {day}
                </div>
              ))}
              
              {/* Calendar dates */}
              {calendarDates.map((date) => {
                const isToday = isSameDay(date, today);
                const isPast = date < today;
                const isSelected = selectedDate && isSameDay(date, selectedDate);
                
                return (
                  <button
                    key={date.toISOString()}
                    onClick={() => !isPast && handleDateSelect(date)}
                    disabled={isPast}
                    className={`
                      p-3 rounded-lg text-sm font-medium transition-colors
                      ${isPast
                        ? 'text-gray-300 cursor-not-allowed'
                        : isSelected
                        ? 'bg-blue-600 text-white'
                        : isToday
                        ? 'bg-blue-100 text-blue-600 hover:bg-blue-200'
                        : 'text-gray-700 hover:bg-gray-100'
                      }
                    `}
                  >
                    {format(date, 'd')}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {step === 'time' && (
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Select a Time for {selectedDate && format(selectedDate, 'EEEE, MMMM d')}
            </h2>
            <div className="grid grid-cols-4 gap-3">
              {timeSlots.map((time) => (
                <button
                  key={time}
                  onClick={() => handleTimeSelect(time)}
                  className="p-3 border border-gray-200 rounded-lg text-sm font-medium hover:border-blue-500 hover:bg-blue-50 transition-colors"
                >
                  {time}
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep('date')}
              className="mt-4 text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              ← Back to date selection
            </button>
          </div>
        )}

        {step === 'details' && (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Details</h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Full Name *
              </label>
              <input
                type="text"
                required
                value={formData.vendor_name}
                onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your full name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email Address *
              </label>
              <input
                type="email"
                required
                value={formData.vendor_email}
                onChange={(e) => setFormData({ ...formData, vendor_email: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Phone Number
              </label>
              <input
                type="tel"
                value={formData.vendor_phone}
                onChange={(e) => setFormData({ ...formData, vendor_phone: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your phone number"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Service Type *
              </label>
              <select
                required
                value={formData.service_type}
                onChange={(e) => setFormData({ ...formData, service_type: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a service type</option>
                <option value="catering">Catering</option>
                <option value="photography">Photography</option>
                <option value="music">Music/Entertainment</option>
                <option value="decor">Decorations</option>
                <option value="transportation">Transportation</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <FileText className="w-4 h-4 inline mr-2" />
                Additional Details
              </label>
              <textarea
                value={formData.service_description}
                onChange={(e) => setFormData({ ...formData, service_description: e.target.value })}
                rows={3}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Tell us more about your requirements..."
              />
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-900 mb-2">Booking Summary</h3>
              <div className="text-sm text-gray-600 space-y-1">
                <p><strong>Date:</strong> {selectedDate && format(selectedDate, 'EEEE, MMMM d, yyyy')}</p>
                <p><strong>Time:</strong> {selectedTime}</p>
                <p><strong>Service:</strong> {formData.service_type || 'Not selected'}</p>
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep('time')}
                className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ← Back
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Submitting...' : 'Confirm Booking'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
} 