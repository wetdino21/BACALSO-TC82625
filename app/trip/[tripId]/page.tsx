'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import useSWR, { mutate } from 'swr';
import { useAuth } from '@/hooks/useAuth';
// import { askAIAboutDestination } from '@/app/actions';
import { Modal } from '@/components/Modal';
import { CalendarIcon } from '@/components/icons/CalendarIcon';
import { LocationMarkerIcon } from '@/components/icons/LocationMarkerIcon';
import { UserGroupIcon } from '@/components/icons/UserGroupIcon';
import { SparklesIcon } from '@/components/icons/SparklesIcon';
import type { Trip } from '@/lib/types';
import { TripStatus } from '@/lib/types';
import apiFetch from '@/lib/api';
import ReactMarkdown from "react-markdown";

const fetcher = (url: string) => apiFetch(url);

export default function TripDetailPage({ params }: { params: { tripId: string } }) {
  const { tripId } = params;
  const { currentUser, token } = useAuth();
  const tripUrl = `/trips/${tripId}`;

  const { data: trip, error, isLoading } = useSWR<Trip>(tripUrl, fetcher);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [aiResponse, setAiResponse] = useState('');
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');

  // const handleAskAi = async () => {
  //   if (!trip) return;
  //   setIsModalOpen(true);
  //   setIsLoadingAi(true);
  //   const response = await askAIAboutDestination(trip.destination);
  //   setAiResponse(response);
  //   setIsLoadingAi(false);
  // };

  const handleAskAi = async () => {
    if (!trip) return;
    setIsModalOpen(true);
    setIsLoadingAi(true);

    try {
      const res = await fetch('/api/ai/destination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination: trip.destination }),
      });

      const data = await res.json();
      if (data.error) {
        setAiResponse(data.error);
      } else {
        setAiResponse(data.text);
      }
    } catch (err) {
      console.error(err);
      setAiResponse("Failed to fetch AI response. Try again later.");
    } finally {
      setIsLoadingAi(false);
    }
  };

  const handleTripAction = async (action: 'join' | 'leave' | 'cancel' | 'conclude' | 'remove', payload?: any) => {
    if (!token) return;
    try {
      let endpoint = '';
      let method: 'POST' | 'PUT' | 'DELETE' = 'POST';

      switch (action) {
        case 'join':
          endpoint = `${tripUrl}/join`;
          method = 'POST';
          break;
        case 'leave':
          endpoint = `${tripUrl}/leave`;
          method = 'POST';
          break;
        case 'cancel':
          endpoint = `${tripUrl}/cancel`;  // NEW endpoint
          method = 'PUT';
          break;
        case 'conclude':
          endpoint = `${tripUrl}/conclude`;  // NEW endpoint
          method = 'PUT';
          break;
        case 'remove':
          endpoint = `${tripUrl}/participants/${payload.userId}`;
          method = 'DELETE';
          break;
      }

      const updatedTrip = await apiFetch(endpoint, {
        method,
        token,
        body: payload && method !== 'DELETE' ? JSON.stringify(payload) : undefined
      });

      mutate(tripUrl);// Re-fetch data
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'An unknown error occurred.'}`);
    }
  };


  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser || !token) return;
    try {
      const newReview = { rating: reviewRating, comment: reviewComment };
      const updatedTrip = await apiFetch(`${tripUrl}/reviews`, {
        method: 'POST',
        token,
        body: JSON.stringify(newReview)
      });
      await mutate(tripUrl);
      setReviewComment('');
      setReviewRating(5);
    } catch (err) {
      alert(`Error: ${err instanceof Error ? err.message : 'Failed to submit review.'}`);
    }
  };

  if (isLoading) return <div className="text-center py-10">Loading trip details...</div>;
  if (error) return <div className="text-center py-10 text-red-500">Error: {error.message}</div>;
  if (!trip) return <div className="text-center py-10">Trip not found.</div>;

  const isHost = currentUser?.id === trip.host?.id;
  const isJoiner = trip.participants?.some(p => p.id === currentUser?.id);
  const isFull = trip.participantCount >= trip.maxParticipants;
  const canJoin = currentUser && !isHost && !isJoiner && !isFull && trip.status === TripStatus.Upcoming;
  const canLeave = currentUser && !isHost && isJoiner && trip.status === TripStatus.Upcoming;
  const canReview = isJoiner && trip.status === TripStatus.Concluded && !trip.reviews.some(r => r.author.id === currentUser?.id);

  function randomColorBg(str: string) {
    if (!str || str.length === 0) return '#ccc';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `hsl(${hash % 360}, 60%, 70%)`; // pastel-ish color
    return color;
  }

  if (!trip.host) {
    return <div className="text-center py-10">Trip host information is missing.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="relative">

          <div className="relative">
            <img
              className="h-64 w-full object-cover"
              src={trip.coverPhoto || '/images/default-cover.png'}
              alt={trip.title}
            />
          </div>

          <div className={`absolute top-4 left-4 px-3 py-1 text-sm font-bold rounded-full text-white ${trip.status === TripStatus.Upcoming ? 'bg-green-500' :
            trip.status === TripStatus.Full ? 'bg-yellow-500' :
              trip.status === TripStatus.Cancelled ? 'bg-red-500' : 'bg-gray-500'
            }`}>
            {trip.status}
          </div>
        </div>
        <div className="p-8">
          <h1 className="text-4xl font-extrabold text-brand-dark tracking-tight">{trip.title}</h1>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-gray-500 mt-4">
            <div className="flex items-center"><LocationMarkerIcon className="h-5 w-5 mr-2 text-brand-secondary" /> {trip.destination}</div>
            <div className="flex items-center"><CalendarIcon className="h-5 w-5 mr-2 text-brand-secondary" /> {new Date(trip.startDate).toDateString()} - {new Date(trip.endDate).toDateString()}</div>
            <div className="flex items-center"><UserGroupIcon className="h-5 w-5 mr-2 text-brand-secondary" /> {trip.participantCount} / {trip.maxParticipants} participants</div>
          </div>

          <div className="mt-8 prose max-w-none text-gray-700">
            <p>{trip.description}</p>
          </div>

          <div className="mt-8 flex flex-col md:flex-row gap-4 items-center">
            {currentUser ? (
              <>
                {isHost ? (
                  <span className="font-semibold text-brand-dark">You are the host</span>
                ) : isJoiner && canLeave ? (
                  <button
                    onClick={() => handleTripAction('leave')}
                    className="w-full md:w-auto px-6 py-3 bg-red-500 text-white font-semibold rounded-lg shadow-md hover:bg-red-600 transition-all"
                  >
                    Leave Trip
                  </button>
                ) : canJoin ? (
                  <button
                    onClick={() => handleTripAction('join')}
                    className="w-full md:w-auto px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg shadow-md hover:bg-brand-dark transition-all"
                  >
                    Join Trip
                  </button>
                ) : (
                  <span className="font-semibold text-gray-500">
                    {trip.status !== TripStatus.Upcoming ? `Trip is ${trip.status}` : 'Trip is full'}
                  </span>
                )}
              </>
            ) : (
              <Link href="/login" className="w-full md:w-auto px-6 py-3 bg-brand-primary text-white font-semibold rounded-lg shadow-md hover:bg-brand-dark transition-all">Login to Join</Link>
            )}
            {!isHost && (
              <button
                onClick={handleAskAi}
                disabled={isLoadingAi}
                className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-brand-accent text-brand-dark font-semibold rounded-lg shadow-md hover:bg-brand-secondary hover:text-white transition-all duration-300 disabled:opacity-70"
              >
                <SparklesIcon className="h-5 w-5" />
                {isLoadingAi ? 'Thinking...' : `Ask AI about ${trip.destination}`}
              </button>
            )}
          </div>
          {isHost && trip.status === TripStatus.Upcoming && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
              <h3 className="font-bold text-lg mb-2">Host Controls</h3>
              <div className="flex flex-wrap gap-2">
                <Link href={`/trip/${trip.id}/edit`} className="px-4 py-2 bg-yellow-500 text-white text-sm font-semibold rounded-lg hover:bg-yellow-600 transition-colors">Edit Trip</Link>
                <button onClick={() => handleTripAction('cancel')} className="px-4 py-2 bg-red-500 text-white text-sm font-semibold rounded-lg hover:bg-red-600 transition-colors">Cancel Trip</button>
                <button onClick={() => handleTripAction('conclude')} className="px-4 py-2 bg-blue-500 text-white text-sm font-semibold rounded-lg hover:bg-blue-600 transition-colors">Mark as Concluded</button>
              </div>
            </div>
          )}
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-4">Host</h2>
            {/* Host */}
            <div className="flex items-center bg-gray-50 p-4 rounded-lg">
              {trip.host?.bioPhoto ? (
                <Image
                  src={trip.host?.bioPhoto}
                  alt={trip.host?.username}
                  className="h-16 w-16 rounded-full object-cover"
                  width={64}
                  height={64}
                />
              ) : (
                <div
                  className="flex items-center justify-center rounded-full text-white font-bold shadow-md"
                  style={{
                    backgroundColor: randomColorBg(trip.host?.username),
                    width: '64px',
                    height: '64px',
                    fontSize: '24px',
                  }}
                >
                  {trip.host?.username.charAt(0).toUpperCase()}
                </div>

              )}
              <div className="ml-4">
                <p className="font-bold text-lg text-gray-900">{trip.host?.username}</p>
                <p className="text-gray-600 italic">"{trip.host?.mantra}"</p>
              </div>
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-4">Joiners ({trip.participantCount})</h2>
            {/* Participants */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {trip.participants.map(user => (
                <div key={user.id} className="text-center relative group">
                  {user.bioPhoto ? (
                    <Image
                      src={user.bioPhoto}
                      alt={user.username}
                      className="h-20 w-20 rounded-full object-cover mx-auto shadow-md"
                      width={80}
                      height={80}
                    />
                  ) : (
                    <div
                      className="mx-auto flex items-center justify-center rounded-full text-white font-bold shadow-md"
                      style={{
                        backgroundColor: randomColorBg(user.username),
                        width: '80px',
                        height: '80px',
                        fontSize: '32px',
                      }}
                    >
                      {user.username.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <p className="mt-2 font-semibold text-gray-700">{user.username}</p>
                  {isHost &&
                    user.id !== trip.host?.id &&
                    trip.status !== TripStatus.Concluded &&
                    trip.status !== TripStatus.Cancelled && (
                      <button
                        onClick={() => handleTripAction('remove', { userId: user.id })}
                        className="absolute top-0 right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      >
                        &times;
                      </button>
                    )}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-2 mb-4">
              Reviews ({trip.reviews.length})
            </h2>

            <div className="flex flex-col gap-6">
              {trip.reviews.length > 0 ? (
                trip.reviews.map((review) => {
                  const AVATAR_SIZE = 48;
                  return (
                    <div key={review.id} className="flex items-start gap-4">
                      {/* Avatar */}
                      {review.author.bioPhoto ? (
                        <Image
                          src={review.author.bioPhoto}
                          alt={review.author.username}
                          width={AVATAR_SIZE}
                          height={AVATAR_SIZE}
                          className="h-12 w-12 rounded-full object-cover"
                        />
                      ) : (
                        <div
                          className="flex items-center justify-center rounded-full text-white font-bold shadow-md"
                          style={{
                            backgroundColor: randomColorBg(review.author.username),
                            width: `${AVATAR_SIZE}px`,
                            height: `${AVATAR_SIZE}px`,
                            fontSize: `${AVATAR_SIZE / 2}px`,
                          }}
                        >
                          {review.author.username.charAt(0).toUpperCase()}
                        </div>
                      )}

                      {/* Review content */}
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-gray-900">{review.author.username}</span>
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={i}
                                className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                        <p className="text-gray-600 mt-1 italic break-words">{review.comment}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-gray-500 italic">No reviews for this trip yet.</p>
              )}
            </div>
          </div>


          {/* Review form for joiners who can review */}
          {canReview && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg border">
              <h3 className="font-bold text-lg mb-2">Leave a Review</h3>
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                <div>
                  <label className="block font-semibold mb-1">Rating:</label>
                  <select
                    value={reviewRating}
                    onChange={(e) => setReviewRating(parseInt(e.target.value))}
                    className="border rounded px-2 py-1"
                  >
                    {[1, 2, 3, 4, 5].map((r) => (
                      <option key={r} value={r}>{r} ⭐</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold mb-1">Comment:</label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    rows={3}
                    className="w-full border rounded px-2 py-1"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Submit Review
                </button>
              </form>
            </div>
          )}

        </div>
      </div>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={`About ${trip.destination}`}>
        {isLoadingAi ? (
          <div className="flex justify-center items-center h-48">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-brand-primary"></div>
          </div>
        ) : (
          <div className="prose prose-sm sm:prose-base max-w-none whitespace-pre-wrap">{<ReactMarkdown>{aiResponse}</ReactMarkdown>}</div>
        )}
      </Modal>
    </div>
  );
};
