'use client';

import React from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { TripCard } from '@/components/TripCard';
import { useAuth } from '@/hooks/useAuth';
import apiFetch from '@/lib/api';
import type { Trip } from '@/lib/types';

const fetcher = (url: string, token: string) => apiFetch(url, { token });

export default function MyTripsPage() {
  const { currentUser, token, isAuthLoading } = useAuth();

  const { data: myTrips, error } = useSWR<Trip[]>(
    currentUser && token ? ['/users/my-trips', token] : null,
    ([url, token]: [string, string]) => fetcher(url, token)
  );

  const dataLoading = isAuthLoading || (!myTrips && !error);

  if (dataLoading) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-gray-700">Loading your trips...</h2>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-gray-700">Please log in</h2>
        <p className="text-gray-500 mt-2">Log in to see the trips you've joined or created.</p>
        <Link href="/login" className="mt-4 inline-block px-6 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-md hover:bg-brand-dark transition-colors">Login</Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-red-500">
        <h2 className="text-xl font-semibold">Failed to load your trips.</h2>
        <p>{error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-brand-dark mb-6">My Trips</h1>
      {myTrips && myTrips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {myTrips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-lg shadow-sm">
          <h2 className="text-xl font-semibold text-gray-700">You haven't joined or created any trips yet.</h2>
          <p className="text-gray-500 mt-2 mb-6">Time to start a new adventure!</p>
          <Link
            href="/"
            className="px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg shadow-md hover:bg-brand-dark transition-colors"
          >
            Discover Trips
          </Link>
        </div>
      )}
    </div>
  );
};
