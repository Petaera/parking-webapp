"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { AlertCircle, CheckCircle } from "lucide-react"
import { useFirebase } from "@/contexts/firebase-context"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

export default function LoginForm() {
  const router = useRouter()
  const { signIn, resetPassword } = useFirebase()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // For password reset
  const [resetEmail, setResetEmail] = useState("")
  const [isResetting, setIsResetting] = useState(false)
  const [resetSuccess, setResetSuccess] = useState(false)
  const [resetError, setResetError] = useState("")
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      await signIn(email, password)
      router.push("/dashboard")
    } catch (err: any) {
      console.error(err)
      if (err.code === "auth/invalid-credential") {
        setError("Invalid email or password")
      } else if (err.code === "auth/user-not-found") {
        setError("No account found with this email")
      } else if (err.code === "auth/wrong-password") {
        setError("Incorrect password")
      } else {
        setError(err.message || "Failed to sign in")
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsResetting(true)
    setResetError("")
    setResetSuccess(false)

    try {
      await resetPassword(resetEmail)
      setResetSuccess(true)
      // Keep dialog open to show success message
    } catch (err: any) {
      console.error(err)
      if (err.code === "auth/user-not-found") {
        setResetError("No account found with this email")
      } else {
        setResetError(err.message || "Failed to reset password")
      }
    } finally {
      setIsResetting(false)
    }
  }

  const closeResetDialog = () => {
    setIsResetDialogOpen(false)
    // Reset the state after dialog closes
    setTimeout(() => {
      setResetEmail("")
      setResetSuccess(false)
      setResetError("")
    }, 300)
  }

  return (
    <Card className="w-full">
      <CardHeader className="space-y-1">
        <h2 className="text-2xl font-semibold">Login</h2>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {error && (
            <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <p>{error}</p>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="your@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Dialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="link" className="h-auto p-0 text-xs">
                    Forgot Password?
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Reset Password</DialogTitle>
                    <DialogDescription>
                      Enter your email address and we'll send you a link to reset your password.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleResetPassword}>
                    <div className="space-y-4 py-4">
                      {resetSuccess ? (
                        <div className="flex items-center gap-2 rounded-md bg-green-50 p-3 text-sm text-green-600">
                          <CheckCircle className="h-4 w-4" />
                          <p>Password reset email sent. Check your inbox.</p>
                        </div>
                      ) : resetError ? (
                        <div className="flex items-center gap-2 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                          <AlertCircle className="h-4 w-4" />
                          <p>{resetError}</p>
                        </div>
                      ) : null}
                      <div className="space-y-2">
                        <Label htmlFor="reset-email">Email</Label>
                        <Input
                          id="reset-email"
                          type="email"
                          value={resetEmail}
                          onChange={(e) => setResetEmail(e.target.value)}
                          placeholder="your@email.com"
                          required
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={closeResetDialog}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isResetting}>
                        {isResetting ? "Sending..." : "Send Reset Link"}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>
          <div className="text-center text-sm">
            Don't have an account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Register
            </Link>
          </div>
        </CardFooter>
      </form>
    </Card>
  )
}

