/**
 * Demo Mode Utilities
 * Provides seamless demo access for recruiters and evaluators
 */

import { getAuth, signInWithEmailAndPassword, type User } from 'firebase/auth';

// Demo account credentials
const DEMO_EMAIL = 'demo@deadline.demo';
const DEMO_PASSWORD = process.env.NEXT_PUBLIC_DEMO_PASSWORD || 'DeadlineDemo2025!'; // Fallback for dev

/**
 * Authenticate as demo user
 * Provides instant access for recruiters without signup friction
 */
export async function loginAsDemoUser(): Promise<void> {
  const auth = getAuth();

  try {
    await signInWithEmailAndPassword(auth, DEMO_EMAIL, DEMO_PASSWORD);
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
