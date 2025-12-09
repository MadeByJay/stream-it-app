import * as express from 'express';

export {};

declare global {
  namespace Express {
    export interface Request {
      userId?: number;
      userEmail?: string;
      isAdmin?: boolean;
    }
  }
}
