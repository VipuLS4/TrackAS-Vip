import { useState } from 'react';
import { useRouter } from 'next/router';

export default function Home() {
  const [trackingId, setTrackingId] = useState('');
  const router = useRouter();

  const handleTrack = (e) => {
    e.preventDefault();
    if (trackingId.trim()) {
      router.push(`/track/${trackingId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">TrackAS</h1>
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="/company/login" className="text-gray-600 hover:text-gray-900">Company Login</a>
              <a href="/driver/login" className="text-gray-600 hover:text-gray-900">Driver Login</a>
              <a href="/admin/login" className="text-gray-600 hover:text-gray-900">Admin Login</a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 sm:text-5xl md:text-6xl">
            Track Your Shipments
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Real-time tracking, secure delivery, and seamless logistics management
          </p>
        </div>

        {/* Tracking Form */}
        <div className="mt-10 max-w-md mx-auto">
          <form onSubmit={handleTrack} className="space-y-4">
            <div>
              <label htmlFor="trackingId" className="sr-only">
                Tracking ID
              </label>
              <input
                id="trackingId"
                name="trackingId"
                type="text"
                required
                className="appearance-none rounded-md relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Enter your tracking ID"
                value={trackingId}
                onChange={(e) => setTrackingId(e.target.value)}
              />
            </div>
            <div>
              <button
                type="submit"
                className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Track Shipment
              </button>
            </div>
          </form>
        </div>

        {/* Features */}
        <div className="mt-20">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Real-time Tracking</h3>
              <p className="mt-2 text-base text-gray-500">
                Track your shipments in real-time with live location updates
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Secure Delivery</h3>
              <p className="mt-2 text-base text-gray-500">
                Secure escrow payments and proof of delivery for every shipment
              </p>
            </div>

            <div className="text-center">
              <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="mt-4 text-lg font-medium text-gray-900">Fast & Reliable</h3>
              <p className="mt-2 text-base text-gray-500">
                Optimized routes and reliable drivers for faster deliveries
              </p>
            </div>
          </div>
        </div>

        {/* Demo Links */}
        <div className="mt-20 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Demo Access</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <a
              href="/company/login"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              Company Dashboard
            </a>
            <a
              href="/driver/login"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              Driver Dashboard
            </a>
            <a
              href="/admin/login"
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700"
            >
              Admin Panel
            </a>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-20">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-base text-gray-400">
              &copy; 2024 TrackAS. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
