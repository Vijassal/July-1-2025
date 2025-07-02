import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key-change-in-production';

export interface JWTPayload {
  sub: string; // booking link id
  event_id?: string;
  type: 'booking_link';
  exp: number;
  iat: number;
}

/**
 * Generate a JWT token for a booking link
 */
export function generateBookingToken(bookingLinkId: string, eventId?: string): string {
  const payload: Omit<JWTPayload, 'exp' | 'iat'> = {
    sub: bookingLinkId,
    event_id: eventId,
    type: 'booking_link'
  };

  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: '24h' // Token expires in 24 hours
  });
}

/**
 * Verify and decode a JWT token
 */
export function verifyBookingToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Check if a JWT token is valid
 */
export function isTokenValid(token: string): boolean {
  try {
    jwt.verify(token, JWT_SECRET);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get token expiration time
 */
export function getTokenExpiration(token: string): Date | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload;
    return new Date(decoded.exp * 1000);
  } catch (error) {
    return null;
  }
} 