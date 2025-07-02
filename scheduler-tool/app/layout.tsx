import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Scheduler - Book Your Appointment',
  description: 'Simple and modern scheduling tool for booking appointments',
  keywords: 'scheduling, booking, appointments, calendar',
  authors: [{ name: 'Your Company' }],
  robots: 'noindex, nofollow', // Since this is a subdomain tool
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#3b82f6" />
      </head>
      <body className="min-h-screen bg-gray-50">
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  )
} 