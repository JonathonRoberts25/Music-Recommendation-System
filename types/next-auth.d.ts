// File: types/next-auth.d.ts

import 'next-auth';

declare module 'next-auth' {
  interface Session {
    accessToken?: string;
    userId?: string;
    userMarket?: string; // Add the new property
  }
}