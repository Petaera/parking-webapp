"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus } from "lucide-react"
import Header from "@/components/header"
import RateConfiguration from "@/components/rate-configuration"
import Loading from "@/components/loading"
import { useFirebase } from "@/contexts/firebase-context"
import ProfileForm from "@/components/profile-form"
import UserManagement from "@/components/user-management"

export default function Settings() {
  const { userData, loading } = useFirebase()


  if (loading) return <Loading />

  if (!userData) return null

  return (
    <div className="flex min-h-screen flex-col">
      <Header title="Settings" />

      <div className="flex-1 p-4 pt-6 md:p-6">
        <Tabs defaultValue="profile">
          <TabsList className="mb-6 flex w-full flex-wrap overflow-x-auto">
            <TabsTrigger value="profile" className="flex-shrink-0">
              Profile
            </TabsTrigger>
            {userData.role === "owner" && (
              <>
                <TabsTrigger value="payment" className="flex-shrink-0">
                  Payment Settings
                </TabsTrigger>
                <TabsTrigger value="users" className="flex-shrink-0">
                  User Management
                </TabsTrigger>
              </>
            )}
          </TabsList>

          <TabsContent value="profile" className="space-y-6">
            <ProfileForm />

          </TabsContent>

          {userData.role === "owner" && (
            <TabsContent value="payment" className="space-y-6">
              {/* Replace the old table with our new Rate Configuration component */}
              <RateConfiguration />

            </TabsContent>
          )}

          {userData.role === "owner" && (
            <TabsContent value="users" className="space-y-6">
              <UserManagement />
              </TabsContent>
          )}

        </Tabs>
      </div>
    </div>
  )
}

