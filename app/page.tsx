'use client';

import React, { useState } from 'react';
import useSWR from 'swr';
import { TripCard } from '@/components/TripCard';
import type { Trip } from '@/lib/types';
import { TripStatus } from '@/lib/types';
import apiFetch from '@/lib/api';


const fetcher = (url: string) => apiFetch(url);

export default function HomePage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TripStatus | 'All'>('All');
  const [participantFilter, setParticipantFilter] = useState<string>('Any');

  // Build query params for the API request
  const queryParams = new URLSearchParams();
  if (searchTerm) queryParams.set('search', searchTerm);
  if (statusFilter !== 'All') queryParams.set('status', statusFilter);
  if (participantFilter === 'Available') queryParams.set('hasSlots', 'true');

  const { data: trips, error, isLoading } = useSWR<Trip[]>(`/trips?${queryParams.toString()}`, fetcher);

  return (
    <div>
      <div className="bg-white p-6 rounded-lg shadow-sm mb-8">
        <h1 className="text-3xl font-bold text-brand-dark mb-2">Find Your Next Adventure</h1>
        <p className="text-gray-600">Browse trips created by fellow travelers or start your own journey.</p>
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <input
            type="text"
            placeholder="Search by destination or keyword..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="md:col-span-3 p-3 border border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary"
            aria-label="Search trips"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as TripStatus | 'All')}
            className="p-3 border border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary bg-white"
            aria-label="Filter by status"
          >
            <option value="All">All Statuses</option>
            {Object.values(TripStatus).map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <select
            value={participantFilter}
            onChange={(e) => setParticipantFilter(e.target.value)}
            className="p-3 border border-gray-300 rounded-md focus:ring-brand-primary focus:border-brand-primary bg-white"
            aria-label="Filter by participant slots"
          >
            <option value="Any">All Trips</option>
            <option value="Available">Has Available Slots</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-gray-700">Loading trips...</h2>
        </div>
      ) : error ? (
        <div className="text-center py-16 text-red-500">
          <h2 className="text-xl font-semibold">Failed to load trips.</h2>
          <p>{error.message}</p>
        </div>
      ) : trips && trips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {trips.map((trip) => (
            <TripCard key={trip.id} trip={trip} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-gray-700">No Trips Found</h2>
          <p className="text-gray-500 mt-2">Try adjusting your search or filters.</p>
        </div>
      )}
    </div>
  );
};
