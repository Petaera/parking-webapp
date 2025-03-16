"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  sendPasswordResetEmail,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth"
import { doc, getDoc, setDoc, serverTimestamp, updateDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"

interface UserData {
  uid: string
  email: string | null
  displayName: string | null
  role: string
  assignedLots?: string[]
  createdAt?: any
  lastLogin?: any
}

interface FirebaseContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<UserData>
  signUp: (email: string, password: string, displayName: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  updateUserProfile: (data: Partial<UserData>) => Promise<void>
  updateUserEmail: (newEmail: string, password: string) => Promise<void>
  updateUserPassword: (currentPassword: string, newPassword: string) => Promise<void>
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined)

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user)

      if (user) {
        // Get the ID token
        const token = await user.getIdToken()

        // Set the cookie (in a real app, you'd use a secure HTTP-only cookie)
        document.cookie = `firebase-auth-token=${token}; path=/; max-age=3600; SameSite=Strict`

        try {
          const userDocRef = doc(db, "users", user.uid)
          const userDoc = await getDoc(userDocRef)

          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<UserData, "uid">
            setUserData({
              uid: user.uid,
              ...userData,
            })

            // Update last login timestamp
            await updateDoc(userDocRef, {
              lastLogin: serverTimestamp(),
            })
          } else {
            console.error("User document does not exist")
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      } else {
        // Clear the cookie when user signs out
        document.cookie = "firebase-auth-token=; path=/; max-age=0"
        setUserData(null)
      }

      setLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const signIn = async (email: string, password: string): Promise<UserData> => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update last login timestamp
      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, { lastLogin: serverTimestamp() })

      // Fetch user data
      const userDoc = await getDoc(userDocRef)
      if (!userDoc.exists()) {
        throw new Error("User document does not exist")
      }

      const userData = userDoc.data() as Omit<UserData, "uid">
      return {
        uid: user.uid,
        ...userData,
      }
    } catch (error: any) {
      console.error("Error signing in:", error)
      throw error
    }
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    const role = "manager"
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      const user = userCredential.user

      // Update profile
      await updateProfile(user, { displayName })

      // Create user document
      const userDocRef = doc(db, "users", user.uid)
      await setDoc(userDocRef, {
        email,
        displayName,
        role,
        assignedLots: [],
        createdAt: serverTimestamp(),
        lastLogin: serverTimestamp(),
      })
    } catch (error: any) {
      console.error("Error signing up:", error)
      throw error
    }
  }

  const signOut = async () => {
    try {
      await firebaseSignOut(auth)
    } catch (error: any) {
      console.error("Error signing out:", error)
      throw error
    }
  }

  const resetPassword = async (email: string) => {
    try {
      await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
      console.error("Error resetting password:", error)
      throw error
    }
  }

  const updateUserProfile = async (data: Partial<UserData>) => {
    if (!user) throw new Error("No user is signed in")

    try {
      const userDocRef = doc(db, "users", user.uid)

      // Update displayName in Auth if provided
      if (data.displayName) {
        await updateProfile(user, { displayName: data.displayName })
      }

      // Update user document in Firestore
      await updateDoc(userDocRef, {
        ...data,
        updatedAt: serverTimestamp(),
      })

      // Update local userData state
      if (userData) {
        setUserData({
          ...userData,
          ...data,
        })
      }
    } catch (error: any) {
      console.error("Error updating user profile:", error)
      throw error
    }
  }

  const updateUserEmail = async (newEmail: string, password: string) => {
    if (!user) throw new Error("No user is signed in")
    if (!user.email) throw new Error("User has no email to update")

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, password)
      await reauthenticateWithCredential(user, credential)

      // Update email in Auth
      await updateEmail(user, newEmail)

      // Update email in Firestore
      const userDocRef = doc(db, "users", user.uid)
      await updateDoc(userDocRef, {
        email: newEmail,
        updatedAt: serverTimestamp(),
      })

      // Update local userData state
      if (userData) {
        setUserData({
          ...userData,
          email: newEmail,
        })
      }
    } catch (error: any) {
      console.error("Error updating user email:", error)
      throw error
    }
  }

  const updateUserPassword = async (currentPassword: string, newPassword: string) => {
    if (!user) throw new Error("No user is signed in")
    if (!user.email) throw new Error("User has no email for authentication")

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)

      // Update password
      await updatePassword(user, newPassword)
    } catch (error: any) {
      console.error("Error updating user password:", error)
      throw error
    }
  }

  const value = {
    user,
    userData,
    loading,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
  }

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>
}

export function useFirebase() {
  const context = useContext(FirebaseContext)
  if (context === undefined) {
    throw new Error("useFirebase must be used within a FirebaseProvider")
  }
  return context
}

