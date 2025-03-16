"use client"

import type React from "react"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import Sidebar from "@/components/sidebar"
import { useFirebase } from "@/contexts/firebase-context"

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const router = useRouter()
  const { user, userData, loading } = useFirebase()

  useEffect(() => {
    // Redirect if not logged in
    if (!loading && !user) {
      router.push("/")
    }
  }, [loading, user, router])

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  if (!user || !userData) {
    return null
  }

  return (
    <div className="flex min-h-screen w-full flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 w-full overflow-auto bg-slate-50">{children}</main>
    </div>
  )
}

