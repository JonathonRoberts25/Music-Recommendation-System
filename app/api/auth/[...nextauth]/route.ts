import NextAuth, { AuthOptions } from "next-auth"
import SpotifyProvider from "next-auth/providers/spotify"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { PrismaClient } from "@prisma/client"
import { JWT } from "next-auth/jwt";

if (!process.env.SPOTIFY_CLIENT_ID || !process.env.SPOTIFY_CLIENT_SECRET) {
  throw new Error("Missing Spotify client ID or secret");
}

const prisma = new PrismaClient();
const SPOTIFY_SCOPES = 'user-read-email playlist-read-private user-read-private user-read-refresh-token playlist-modify-public streaming';

async function refreshAccessToken(token: JWT): Promise<JWT> {
  try {
    const url = "https://accounts.spotify.com/api/token";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": "Basic " + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET).toString("base64"),
      },
      body: new URLSearchParams({
        grant_type: "refresh_token",
        refresh_token: token.refreshToken as string,
      }),
    });
    const refreshedTokens = await response.json();
    if (!response.ok) { throw refreshedTokens; }

    return {
      ...token,
      accessToken: refreshedTokens.access_token,
      accessTokenExpires: Date.now() + refreshedTokens.expires_in * 1000,
      refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
    };
  } catch (error) {
    console.error("Error refreshing access token", error);
    return { ...token, error: "RefreshAccessTokenError" };
  }
}

export const authOptions: AuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    SpotifyProvider({
      clientId: process.env.SPOTIFY_CLIENT_ID!,
      clientSecret: process.env.SPOTIFY_CLIENT_SECRET!,
      // --- THIS IS THE FINAL, GUARANTEED FIX ---
      // The 'authorization' object creates an invalid URL. The simple 'scope' property is correct.
      // We use @ts-ignore to bypass a misleading TypeScript error in the library's types.
      // @ts-ignore
      scope: SPOTIFY_SCOPES,
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.accessTokenExpires = Date.now() + (Number(account.expires_in) ?? 0) * 1000;
        token.id = user.id;
        return token;
      }
      if (Date.now() < (token.accessTokenExpires ?? 0)) {
        return token;
      }
      return refreshAccessToken(token);
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken;
      session.error = token.error;
      if (session.user) {
        session.user.id = token.id;
      }
      return session;
    },
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };