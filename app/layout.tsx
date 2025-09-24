import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "../app/globals.css";
import { ThemeProvider } from "@/components/theme-provider";
// --- THIS IS THE CRITICAL IMPORT ---
import SessionProvider from "@/components/SessionProvider";
// --- END OF IMPORT ---

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Music Recommendation System",
  description: "Get music recommendations by mood",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        {/* --- THIS IS THE CRITICAL FIX --- */}
        {/* We wrap everything in the SessionProvider */}
        <SessionProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            {children}
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}