export enum TripStatus {
  Upcoming = 'Upcoming',
  Full = 'Full',
  Cancelled = 'Cancelled',
  Concluded = 'Concluded',
}

export interface Review {
  id: string;
  authorId: string;
  tripId: string;
  author: User; // Author details will be nested
  rating: number;
  comment: string;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  mantra: string;
  bioPhoto: string;
}

// Type for a list of participants, often simplified
export interface Participant extends User {}

export interface Trip {
  id: string;
  title: string;
  description: string;
  coverPhoto: string;
  destination: string;
  startDate: string;
  endDate: string;
  participants: Participant[]; // Simplified from the old structure
  participantCount: number;
  minParticipants: number;
  maxParticipants: number;
  host: User;
  status: TripStatus;
  reviews: Review[];
}
