import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { FirebaseProvider } from "@/contexts/firebase-context"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Parking Management System",
  description: "A comprehensive solution for parking lot management",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <FirebaseProvider>{children}</FirebaseProvider>
      </body>
    </html>
  )
}



import './globals.css'