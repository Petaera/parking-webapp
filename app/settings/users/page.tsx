"use client"
import UserManagement from "@/components/user-management"
import Header from "@/components/header"
import { useFirebase } from "@/contexts/firebase-context"
import { Card, CardContent } from "@/components/ui/card"

export default function UserSettings() {
  const { userData, loading } = useFirebase()

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header title="User Management" />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    )
  }

  if (!userData || userData.role !== "owner") {
    return (
      <div className="flex min-h-screen flex-col">
        <Header title="User Management" />
        <div className="flex-1 p-4 pt-6 md:p-6">
          <Card>
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold">Access Denied</h2>
              <p className="mt-2 text-muted-foreground">You don't have permission to access this page.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header title="User Management" />
      <div className="flex-1 p-4 pt-6 md:p-6">
        <UserManagement />
      </div>
    </div>
  )
}

