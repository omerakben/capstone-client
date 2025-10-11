"use client";
import { useAuth } from "@/contexts/AuthContext";
import { isDemoMode } from "@/lib/demo";

export function DemoBanner() {
  const { user } = useAuth();

  if (!isDemoMode(user)) return null;

  return (
    <div className="bg-yellow-50 border-b border-yellow-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center gap-2 text-sm">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4 text-yellow-600"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
          <line x1="12" y1="9" x2="12" y2="13"></line>
          <line x1="12" y1="17" x2="12.01" y2="17"></line>
        </svg>
        <span className="font-medium text-yellow-900">🎯 Demo Mode</span>
        <span className="text-yellow-700">
          You&apos;re using the demo account. Changes are shared with all demo
          users and reset daily.
        </span>
        <a
          href="/login"
          className="ml-auto text-yellow-900 underline hover:text-yellow-700"
        >
          Create Account
        </a>
      </div>
    </div>
  );
}
