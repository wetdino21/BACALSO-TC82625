
export enum TripStatus {
  Upcoming = 'Upcoming',
  Full = 'Full',
  Cancelled = 'Cancelled',
  Concluded = 'Concluded',
}

export interface User {
  id: string;
  username: string;
  mantra: string;
  bioPhoto: string;
}

export interface Trip {
  id: string;
  title: string;
  description: string;
  coverPhoto: string;
  destination: string;
  startDate: string;
  endDate: string;
  participants: {
    min: number;
    max: number;
    current: User[];
  };
  host: User;
  status: TripStatus;
}
