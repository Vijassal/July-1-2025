import type React from "react"
import type { Metadata, Viewport } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import ClientLayout from "./components/ClientLayout"
import { Toaster } from "sonner"
import { AccountProvider } from "@/lib/account-context"
import { FeatureFlagsProvider } from "@/lib/feature-flags"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

export const metadata: Metadata = {
  title: {
    default: "Events Planning",
    template: "%s | Events Planning",
  },
  description: "Create and manage your events with ease. Plan, budget, invite, and track everything in one place.",
  keywords: ["events", "planning", "management", "budget", "RSVP", "vendors"],
  authors: [{ name: "Events Planning Team" }],
  creator: "Events Planning",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://your-domain.com",
    title: "Events Planning",
    description: "Create and manage your events with ease",
    siteName: "Events Planning",
  },
  twitter: {
    card: "summary_large_image",
    title: "Events Planning",
    description: "Create and manage your events with ease",
  },
  robots: {
    index: true,
    follow: true,
  },
    generator: 'v0.dev'
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable} suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        <AccountProvider>
          <FeatureFlagsProvider>
            <ClientLayout>{children}</ClientLayout>
          </FeatureFlagsProvider>
        </AccountProvider>
        <Toaster position="top-right" expand={false} richColors closeButton />
      </body>
    </html>
  )
}
