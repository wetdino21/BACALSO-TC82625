'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useSWR from 'swr';
import { useAuth } from '@/hooks/useAuth';
import apiFetch from '@/lib/api';
import type { Trip, Review, User } from '@/lib/types';
import { FiUser } from "react-icons/fi";

interface ProfileData {
  user: User;
  hostedTrips: Trip[];
  joinedTrips: Trip[];
  hostedReviews: (Review & { trip: { id: string; title: string } })[];
}

const fetcher = (url: string, token: string) => apiFetch(url, { token });

export default function ProfilePage() {
  const { currentUser, token, isAuthLoading } = useAuth();

  const { data, error, isLoading } = useSWR<ProfileData>(
    currentUser ? [`/users/${currentUser.id}/profile`, token] : null,
    ([url, token]) => fetcher(url, token as string)
  );

  const dataLoading = isLoading || isAuthLoading;

  if (dataLoading) {
    return <div className="text-center py-16 text-xl font-semibold text-gray-700">Loading profile...</div>;
  }

  if (!currentUser) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-semibold text-gray-700">Please log in to view your profile.</h2>
        <Link href="/login" className="mt-4 inline-block px-6 py-2 bg-brand-primary text-white font-semibold rounded-lg shadow-md hover:bg-brand-dark transition-colors">Login</Link>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-16 text-red-500">
        <h2 className="text-xl font-semibold">Failed to load profile.</h2>
        <p>{error.message}</p>
      </div>
    );
  }

  if (!data) {
    return <div className="text-center py-16">Could not load profile data.</div>
  }

  const { user, hostedTrips, joinedTrips, hostedReviews } = data;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white p-8 rounded-lg shadow-md mb-8">
        <div className="flex flex-col sm:flex-row items-center">
         {/* For user profile */}
          {user.bioPhoto ? (
            <Image
              src={user.bioPhoto}
              alt={user.username}
              className="w-32 h-32 rounded-full object-cover border-4 border-brand-secondary shadow-lg"
              width={128}
              height={128}
            />
          ) : (
            <div className="w-32 h-32 rounded-full border-4 border-brand-secondary shadow-lg flex items-center justify-center bg-gray-200 text-gray-500">
              <FiUser className="w-16 h-16" />
            </div>
          )}
          <div className="mt-4 sm:mt-0 sm:ml-6 text-center sm:text-left flex-grow">
            <h1 className="text-3xl font-bold text-brand-dark">{user.username}</h1>
            <p className="text-gray-600 mt-1 italic">"{user.mantra}"</p>
          </div>
          <Link href="/profile/edit" className="mt-4 sm:mt-0 px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 transition-colors">
            Edit Profile
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div>
            <h3 className="text-xl font-semibold text-brand-primary mb-2">Hosted Trips ({hostedTrips.length})</h3>
            {hostedTrips.length > 0 ? (
              <ul className="bg-white p-4 rounded-lg shadow-sm space-y-3">
                {hostedTrips.map(trip => (
                  <li key={trip.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md">
                    <Link href={`/trip/${trip.id}`} className="font-medium text-gray-700 hover:text-brand-dark">{trip.title}</Link>
                    <span className="text-sm text-gray-500">{trip.status}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-gray-500 italic bg-white p-4 rounded-lg shadow-sm">You haven't hosted any trips yet.</p>}
          </div>
          <div>
            <h3 className="text-xl font-semibold text-brand-primary mb-2">Joined Trips ({joinedTrips.length})</h3>
            {joinedTrips.length > 0 ? (
              <ul className="bg-white p-4 rounded-lg shadow-sm space-y-3">
                {joinedTrips.map(trip => (
                  <li key={trip.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-md">
                    <Link href={`/trip/${trip.id}`} className="font-medium text-gray-700 hover:text-brand-dark">{trip.title}</Link>
                    <span className="text-sm text-gray-500">{trip.status}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-gray-500 italic bg-white p-4 rounded-lg shadow-sm">You haven't joined any trips yet.</p>}
          </div>
        </div>
        <div>
          <h3 className="text-xl font-semibold text-brand-primary mb-2">Reviews as Host ({hostedReviews.length})</h3>
          {hostedReviews.length > 0 ? (
            <div className="bg-white p-4 rounded-lg shadow-sm space-y-4 max-h-96 overflow-y-auto">
              {hostedReviews.map(review => (
                <div key={review.id} className="border-b pb-3 last:border-b-0">
                  <div className="flex items-center mb-2">
                    {/* For review author */}
                    {review.author.bioPhoto ? (
                      <Image
                        src={review.author.bioPhoto}
                        alt={review.author.username}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        <FiUser className="w-6 h-6" />
                      </div>
                    )}
                    <div className="ml-3">
                      <p className="font-semibold text-gray-800">{review.author.username}</p>
                      <p className="text-xs text-gray-500">For trip: <Link href={`/trip/${review.trip.id}`} className="hover:underline">{review.trip.title}</Link></p>
                    </div>
                  </div>
                  <div className="flex items-center my-1">{[...Array(5)].map((_, i) => <svg key={i} className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>)}</div>
                  <p className="text-gray-600 text-sm italic">"{review.comment}"</p>
                </div>
              ))}
            </div>
          ) : <p className="text-gray-500 italic bg-white p-4 rounded-lg shadow-sm">No reviews yet.</p>}
        </div>
      </div>
    </div>
  );
};
