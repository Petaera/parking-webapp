"use client"

import type React from "react"
import { createContext, useContext, useEffect, useState } from "react"
import {
  type User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
} from "firebase/auth"
import { doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore"
import { auth, db } from "@/lib/firebase"
import { UserData } from "@/lib/firestore-service"



interface FirebaseContextType {
  user: User | null
  userData: UserData | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<UserData>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined)

export function FirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  console.log("user", user?.getIdTokenResult())
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
          console.log("getting user")
          if (userDoc.exists()) {
            const userData = userDoc.data() as Omit<UserData, "uid">
            setUserData({
              uid: user.uid,
              ...userData,
            })

           
          } else {
            await signOut()
            console.error("User document does not exist")
          }
        } catch (error) {
          console.error("Error fetching user data:", error)
        }
      } else {
        // Clear the cookie when user signs out
        document.cookie = "firebase-auth-token=; path=/; max-age=0"
        setUserData(null)
        await signOut()
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

      // Fetch user data
      const userDoc = await getDoc(userDocRef)
      if (!userDoc.exists()) {
        throw new Error("User does not exist")
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

  // const updateUserProfile = async (data: Partial<UserData>) => {
  //   if (!user) throw new Error("No user is signed in")

  //   try {
  //     const userDocRef = doc(db, "users", user.uid)

  //     // Update displayName in Auth if provided
  //     if (data.displayName) {
  //       await updateProfile(user, { displayName: data.displayName })
  //     }

  //     // Update user document in Firestore
  //     await updateDoc(userDocRef, {
  //       ...data,
  //       updatedAt: serverTimestamp(),
  //     })

  //     // Update local userData state
  //     if (userData) {
  //       setUserData({
  //         ...userData,
  //         ...data,
  //       })
  //     }
  //   } catch (error: any) {
  //     console.error("Error updating user profile:", error)
  //     throw error
  //   }
  // }


  const value = {
    user,
    userData,
    loading,
    signIn,
    signOut,
    resetPassword,
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

