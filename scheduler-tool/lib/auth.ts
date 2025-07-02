// JWT Authentication utilities for the scheduler tool

export interface JWTPayload {
  sub: string; // user id
  email: string;
  name?: string;
  role: string;
  exp: number;
  iat: number;
}

/**
 * Check if user is authenticated by validating JWT token
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  
  const token = getToken();
  if (!token) return false;
  
  try {
    const payload = parseJWT(token);
    const now = Math.floor(Date.now() / 1000);
    
    // Check if token is expired
    if (payload.exp < now) {
      removeToken();
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Token validation error:', error);
    removeToken();
    return false;
  }
}

/**
 * Get JWT token from localStorage or URL params
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  
  // First try localStorage
  const localToken = localStorage.getItem('scheduler_token');
  if (localToken) return localToken;
  
  // Then try URL params
  const urlParams = new URLSearchParams(window.location.search);
  const urlToken = urlParams.get('token');
  if (urlToken) {
    // Store in localStorage for future use
    localStorage.setItem('scheduler_token', urlToken);
    return urlToken;
  }
  
  return null;
}

/**
 * Store JWT token in localStorage
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('scheduler_token', token);
}

/**
 * Remove JWT token from localStorage
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('scheduler_token');
}

/**
 * Parse JWT token and return payload
 */
export function parseJWT(token: string): JWTPayload {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    throw new Error('Invalid JWT token');
  }
}

/**
 * Get user info from JWT token
 */
export function getUserInfo(): JWTPayload | null {
  const token = getToken();
  if (!token) return null;
  
  try {
    return parseJWT(token);
  } catch (error) {
    return null;
  }
}

/**
 * Make authenticated API request
 */
export async function authenticatedFetch(
  url: string, 
  options: RequestInit = {}
): Promise<Response> {
  const token = getToken();
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(url, {
    ...options,
    headers,
  });
} 