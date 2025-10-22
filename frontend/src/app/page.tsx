'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/stores/authStore';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, isLoading, initialize } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-gray-50 to-gray-100">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">GitHub Clone</h1>
          <p className="text-xl text-gray-600 mb-8">
            A full-stack GitHub clone built with Next.js, Node.js, and PostgreSQL
          </p>
          <p className="text-lg text-gray-500 mb-12">
            Manage repositories, issues, pull requests, discussions, and organizations in one place.
          </p>

          <div className="flex gap-4 justify-center items-center flex-wrap">
            <Button asChild size="lg">
              <Link href="/register">Get Started</Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <Link href="/login">Sign In</Link>
            </Button>
          </div>

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Repositories</h3>
              <p className="text-gray-600">
                Create and manage Git repositories with full version control
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Collaboration</h3>
              <p className="text-gray-600">
                Work together with issues, pull requests, and discussions
              </p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Organizations</h3>
              <p className="text-gray-600">
                Organize teams and projects with organization management
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
