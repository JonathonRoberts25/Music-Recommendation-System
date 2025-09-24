// File: types/next-auth.d.ts

import NextAuth, { DefaultSession } from "next-auth"
import { JWT } from "next-auth/jwt"

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    accessToken?: string;
    error?: string;
    user?: {
      id: string;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  /** Returned by the `jwt` callback and `getToken`, when using JWT sessions */
  interface JWT {
    /** OpenID ID Token */
    id: string;
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    error?: string;
    user?: any; // You can define a more specific user type if you want
  }
}