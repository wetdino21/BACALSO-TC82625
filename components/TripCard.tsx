import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { Trip } from '../lib/types';
import { TripStatus } from '../lib/types';
import { UserGroupIcon } from './icons/UserGroupIcon';
import { CalendarIcon } from './icons/CalendarIcon';
import { LocationMarkerIcon } from './icons/LocationMarkerIcon';
import { FiUser } from "react-icons/fi";

interface TripCardProps {
  trip: Trip;
}

const statusStyles: { [key in TripStatus]: string } = {
  [TripStatus.Upcoming]: 'bg-green-100 text-green-800',
  [TripStatus.Full]: 'bg-yellow-100 text-yellow-800',
  [TripStatus.Cancelled]: 'bg-red-100 text-red-800',
  [TripStatus.Concluded]: 'bg-gray-100 text-gray-800',
};

function randomColorBg(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const color = `hsl(${hash % 360}, 60%, 70%)`; // pastel-ish color
  return color;
}

export const TripCard: React.FC<TripCardProps> = ({ trip }) => {
  const formattedStartDate = new Date(trip.startDate).toLocaleDateString();
  const formattedEndDate = new Date(trip.endDate).toLocaleDateString();

  return (
    <Link href={`/trip/${trip.id}`} className="block group">
      <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 h-full flex flex-col">
        <div className="relative">
          {trip.coverPhoto ? (
            <Image
              className="h-48 w-full object-cover"
              src={trip.coverPhoto}
              alt={trip.title}
              width={400}
              height={192}
            />
          ) : (
            <div className="h-48 w-full flex items-center justify-center bg-gray-200 text-gray-500">
              <span>No cover photo</span>
            </div>
          )}
          <div
            className={`absolute top-2 right-2 px-2 py-1 text-xs font-semibold rounded-full ${statusStyles[trip.status]}`}
          >
            {trip.status}
          </div>
        </div>

        <div className="p-6 flex-grow flex flex-col">
          <h3 className="text-xl font-bold text-gray-900 group-hover:text-brand-primary transition-colors">{trip.title}</h3>
          <div className="flex items-center text-sm text-gray-500 mt-2">
            <LocationMarkerIcon className="h-4 w-4 mr-1" />
            <span>{trip.destination}</span>
          </div>
          <div className="flex items-center text-sm text-gray-500 mt-2">
            <CalendarIcon className="h-4 w-4 mr-1" />
            <span>{formattedStartDate} - {formattedEndDate}</span>
          </div>
          <div className="mt-4 text-sm text-gray-600 flex-grow">
            <p className="line-clamp-2">{trip.description}</p>
          </div>
          <div className="mt-6 pt-4 border-t border-gray-200 flex justify-between items-center">
            <div className="flex items-center">
              {trip.host.bioPhoto ? (
                <Image
                  className="h-8 w-8 rounded-full object-cover mr-3"
                  src={trip.host.bioPhoto}
                  alt={trip.host.username}
                  width={32}
                  height={32}
                />
              ) : (
                <div
                  className="h-8 w-8 rounded-full mr-3 flex items-center justify-center text-xs text-gray-800 font-bold"
                  style={{ backgroundColor: randomColorBg(trip.host.username) }}
                >
                  {trip.host.username.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-gray-900">Hosted by</p>
                <p className="text-sm text-gray-500">{trip.host.username}</p>
              </div>
            </div>

            <div className="flex items-center text-sm text-gray-500">
              <UserGroupIcon className="h-5 w-5 mr-1" />
              <span>{trip.participantCount} / {trip.maxParticipants}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};
