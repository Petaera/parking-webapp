"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, CheckCircle } from "lucide-react"
import { useFirebase } from "@/contexts/firebase-context"

export default function ProfileForm() {
  const { userData, updateUserProfile, updateUserEmail, updateUserPassword } = useFirebase()

  // Profile update state
  const [displayName, setDisplayName] = useState(userData?.displayName || "")
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [profileError, setProfileError] = useState("")
  const [profileSuccess, setProfileSuccess] = useState(false)

  // Email update state
  const [newEmail, setNewEmail] = useState(userData?.email || "")
  const [emailPassword, setEmailPassword] = useState("")
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false)
  const [emailError, setEmailError] = useState("")
  const [emailSuccess, setEmailSuccess] = useState(false)

  // Password update state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false)
  const [passwordError, setPasswordError] = useState("")
  const [passwordSuccess, setPasswordSuccess] = useState(false)

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingProfile(true)
    setProfileError("")
    setProfileSuccess(false)

    try {
      await updateUserProfile({ displayName })
      setProfileSuccess(true)
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err: any) {
      console.error(err)
      setProfileError(err.message || "Failed to update profile")
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingEmail(true)
    setEmailError("")
    setEmailSuccess(false)

    if (newEmail === userData?.email) {
      setEmailError("New email is the same as current email")
      setIsUpdatingEmail(false)
      return
    }

    try {
      await updateUserEmail(newEmail, emailPassword)
      setEmailSuccess(true)
      setEmailPassword("")
      setTimeout(() => setEmailSuccess(false), 3000)
    } catch (err: any) {
      console.error(err)
      if (err.code === "auth/wrong-password") {
        setEmailError("Incorrect password")
      } else if (err.code === "auth/email-already-in-use") {
        setEmailError("Email is already in use")
      } else {
        setEmailError(err.message || "Failed to update email")
      }
    } finally {
      setIsUpdatingEmail(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingPassword(true)
    setPasswordError("")
    setPasswordSuccess(false)

    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match")
      setIsUpdatingPassword(false)
      return
    }

    if (newPassword.length < 6) {
      setPasswordError("Password must be at least 6 characters")
      setIsUpdatingPassword(false)
      return
    }

    try {
      await updateUserPassword(currentPassword, newPassword)
      setPasswordSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err: any) {
      console.error(err)
      if (err.code === "auth/wrong-password") {
        setPasswordError("Incorrect current password")
      } else {
        setPasswordError(err.message || "Failed to update password")
      }
    } finally {
      setIsUpdatingPassword(false)
    }
  }

  if (!userData) return null

  return (
    <div className="space-y-6">
      {/* Profile Information */}
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <form onSubmit={handleProfileUpdate}>
          <CardContent className="space-y-4">
            {profileError && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <p>{profileError}</p>
              </div>
            )}
            {profileSuccess && (
              <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <p>Profile updated successfully</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="display-name">Full Name</Label>
              <Input id="display-name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Input id="role" value={userData.role} disabled />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isUpdatingProfile}>
              {isUpdatingProfile ? "Updating..." : "Update Profile"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Email Update */}
      <Card>
        <CardHeader>
          <CardTitle>Update Email</CardTitle>
        </CardHeader>
        <form onSubmit={handleEmailUpdate}>
          <CardContent className="space-y-4">
            {emailError && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <p>{emailError}</p>
              </div>
            )}
            {emailSuccess && (
              <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <p>Email updated successfully</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="current-email">Current Email</Label>
              <Input id="current-email" value={userData.email || ""} disabled />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-email">New Email</Label>
              <Input
                id="new-email"
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email-password">Current Password</Label>
              <Input
                id="email-password"
                type="password"
                value={emailPassword}
                onChange={(e) => setEmailPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isUpdatingEmail}>
              {isUpdatingEmail ? "Updating..." : "Update Email"}
            </Button>
          </CardFooter>
        </form>
      </Card>

      {/* Password Update */}
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <form onSubmit={handlePasswordUpdate}>
          <CardContent className="space-y-4">
            {passwordError && (
              <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <p>{passwordError}</p>
              </div>
            )}
            {passwordSuccess && (
              <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                <p>Password updated successfully</p>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button type="submit" disabled={isUpdatingPassword}>
              {isUpdatingPassword ? "Updating..." : "Update Password"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

