"use client"
import ProfileForm from "@/components/profile-form"
import Header from "@/components/header"
import { useFirebase } from "@/contexts/firebase-context"

export default function ProfileSettings() {
  const { userData, loading } = useFirebase()

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header title="Profile Settings" />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    )
  }

  if (!userData) {
    return null
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header title="Profile Settings" />
      <div className="flex-1 p-4 pt-6 md:p-6">
        <ProfileForm />
      </div>
    </div>
  )
}

