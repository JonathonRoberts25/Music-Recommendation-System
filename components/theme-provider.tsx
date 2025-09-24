// File: components/theme-provider.tsx
"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"

// This is the only part that's changed. It's a slightly more robust way to get the types.
type ThemeProviderProps = React.ComponentProps<typeof NextThemesProvider>;

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}