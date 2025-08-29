import { Request } from 'express';

// FIX: Changed from interface extending Request to an intersection type. This can help resolve issues in environments where type extension is not correctly processed by the TypeScript checker.
export type AuthenticatedRequest = Request & {
  user?: {
    id: string;
    username: string;
  };
};
