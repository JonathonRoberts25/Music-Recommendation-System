// File: app/api/auth/[...nextauth]/route.ts

import NextAuth, { AuthOptions } from 'next-auth';
import SpotifyProvider from 'next-auth/providers/spotify';

const scopes = [
  'user-read-private',
  'user-read-email',
  'user-top-read',
  'playlist-modify-public',
  'playlist-modify-private',
  'user-read-playback-state', // New scope
].join(' ');

export const authOptions: AuthOptions = {
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID as string,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET as string,
      authorization: `https://accounts.spotify.com/authorize?scope=${scopes}`,
    }),
  ],
  secret: process.env.NEXTAUTH_SECRET,
  callbacks: {
    async jwt({ token, account }) {
      // Persist the OAuth access_token and other details to the token right after signin
      if (account) {
        token.accessToken = account.access_token;
        token.id = account.providerAccountId;

        // --- START: THE FINAL FIX ---
        // Fetch the user's market (country) manually with the new access token
        try {
          console.log("Fetching user profile to get market...");
          const response = await fetch('https://api.spotify.com/v1/me', {
            headers: {
              Authorization: `Bearer ${account.access_token}`,
            },
          });
          
          if (!response.ok) {
            throw new Error(`Failed to fetch user profile, status: ${response.status}`);
          }

          const userProfile = await response.json();
          token.userMarket = userProfile.country;
          console.log("SUCCESS: User market found and set:", userProfile.country);

        } catch (error) {
          console.error("Error fetching user market:", error);
          // Set a default market or handle the error as needed
          token.userMarket = 'US'; // Fallback to 'US' if the fetch fails
        }
        // --- END: THE FINAL FIX ---
      }
      return token;
    },
    
    async session({ session, token }) {
      session.accessToken = token.accessToken as string;
      session.userId = token.id as string;
      session.userMarket = token.userMarket as string;
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
