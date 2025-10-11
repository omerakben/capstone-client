/**
 * Demo Mode Utilities
 * Provides seamless demo access for recruiters and evaluators
 */

import { type User } from 'firebase/auth';

// Demo account credentials
const DEMO_EMAIL = 'demo@deadline.demo';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

/**
 * Authenticate as demo user
 * Provides instant access for recruiters without signup friction
 * Uses backend session-based authentication in demo mode
 */
export async function loginAsDemoUser(): Promise<void> {
  try {
    const response = await fetch(`${API_URL}/api/v1/auth/demo/login/`, {
      method: 'POST',
      credentials: 'include', // Important for session cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Demo login failed: ${response.statusText}`);
    }

    const data = await response.json();
    console.log('Demo login successful:', data);

    // Redirect to dashboard after successful login
    window.location.href = '/dashboard';
  } catch (error) {
    console.error('Demo login failed:', error);
    throw new Error('Unable to access demo mode. Please try again or create an account.');
  }
}

/**
 * Check if current user is in demo mode
 * Used to show demo banner and apply demo-specific UX
 */
export function isDemoMode(user: User | null): boolean {
  return user?.email === DEMO_EMAIL;
}

/**
 * Get demo mode display info
 */
export function getDemoInfo() {
  return {
    email: DEMO_EMAIL,
    workspaces: [
      {
        name: 'E-commerce Platform',
        description: 'Production environment variables and documentation for online store'
      },
      {
        name: 'Mobile App Backend',
        description: 'API configurations, authentication setup, and deployment guides'
      }
    ],
    notice: 'Demo data is shared with all demo users and reset daily at midnight UTC'
  };
}
