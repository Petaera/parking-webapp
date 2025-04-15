"use client"
import Loading from "@/components/loading"
import LoginForm from "@/components/login-form"
import { useFirebase } from "@/contexts/firebase-context"
import { useEffect } from "react"
import { useRouter } from 'next/router';

export default function Home() {
  const { user, loading } = useFirebase()
  const router = useRouter();
  useEffect(() => {
    if (!loading && user)
      router.replace('/dashboard')

  }, [loading])
  if (loading)
    return <Loading />


  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-slate-900">Parking Management</h1>
          <p className="mt-2 text-slate-600">Sign in to access your dashboard</p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}

