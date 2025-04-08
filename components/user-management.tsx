"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Pencil, Trash2, UserPlus } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { useFirebase } from "@/contexts/firebase-context"
import { collection, getDocs, doc, updateDoc, deleteDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { getLots } from "@/lib/firestore-service"

interface User {
  id: string
  email: string
  displayName: string
  role: string
  assignedLots: string[]
  createdAt: any
  lastLogin: any
}

interface Lot {
  id: string
  name: string
}

export default function UserManagement() {
  const { userData, signUp } = useFirebase()
  const [users, setUsers] = useState<User[]>([])
  const [lots, setLots] = useState<Lot[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  // Form state for adding a new user
  const [newUserName, setNewUserName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [newUserPassword, setNewUserPassword] = useState("")
  const [newUserRole, setNewUserRole] = useState("manager")
  const [newUserLots, setNewUserLots] = useState<string[]>([])
  const [isAddingUser, setIsAddingUser] = useState(false)
  const [addUserError, setAddUserError] = useState("")

  // Form state for editing a user
  const [editUserName, setEditUserName] = useState("")
  const [editUserRole, setEditUserRole] = useState("")
  const [editUserLots, setEditUserLots] = useState<string[]>([])
  const [isEditingUser, setIsEditingUser] = useState(false)
  const [editUserError, setEditUserError] = useState("")

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        // Only fetch users if current user is an owner
        if (userData?.role !== "owner") return

        const usersRef = collection(db, "users")
        const snapshot = await getDocs(usersRef)
        const usersData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as User[]

        setUsers(usersData)

        // Fetch lots
        const lotsData = await getLots()
        setLots(lotsData)
      } catch (error) {
        console.error("Error fetching users:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchUsers()
  }, [userData])

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsAddingUser(true)
    setAddUserError("")

    try {
      // Create user in Firebase Auth and Firestore
      await signUp(newUserEmail, newUserPassword, newUserName)

      // Fetch users again to update the list
      const usersRef = collection(db, "users")
      const snapshot = await getDocs(usersRef)
      const usersData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as User[]

      setUsers(usersData)

      // Reset form
      setNewUserName("")
      setNewUserEmail("")
      setNewUserPassword("")
      setNewUserRole("manager")
      setNewUserLots([])

      // Close dialog
      setIsAddDialogOpen(false)
    } catch (err: any) {
      console.error(err)
      if (err.code === "auth/email-already-in-use") {
        setAddUserError("Email is already in use")
      } else {
        setAddUserError(err.message || "Failed to create user")
      }
    } finally {
      setIsAddingUser(false)
    }
  }

  const openEditDialog = (user: User) => {
    setCurrentUser(user)
    setEditUserName(user.displayName)
    setEditUserRole(user.role)
    setEditUserLots(user.assignedLots || [])
    setIsEditDialogOpen(true)
  }

  const handleEditUser = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentUser) return

    setIsEditingUser(true)
    setEditUserError("")

    try {
      // Update user in Firestore
      const userRef = doc(db, "users", currentUser.id)
      await updateDoc(userRef, {
        displayName: editUserName,
        role: editUserRole,
        assignedLots: editUserLots,
        updatedAt: new Date(),
      })

      // Update local state
      setUsers(
        users.map((user) =>
          user.id === currentUser.id
            ? {
                ...user,
                displayName: editUserName,
                role: editUserRole,
                assignedLots: editUserLots,
              }
            : user,
        ),
      )

      // Close dialog
      setIsEditDialogOpen(false)
    } catch (err: any) {
      console.error(err)
      setEditUserError(err.message || "Failed to update user")
    } finally {
      setIsEditingUser(false)
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user?")) return

    try {
      // Delete user from Firestore
      const userRef = doc(db, "users", userId)
      await deleteDoc(userRef)

      // Update local state
      setUsers(users.filter((user) => user.id !== userId))
    } catch (err: any) {
      console.error(err)
      alert("Failed to delete user: " + err.message)
    }
  }

  const handleLotSelection = (lotId: string) => {
    if (newUserLots.includes(lotId)) {
      setNewUserLots(newUserLots.filter((id) => id !== lotId))
    } else {
      setNewUserLots([...newUserLots, lotId])
    }
  }

  const handleEditLotSelection = (lotId: string) => {
    if (editUserLots.includes(lotId)) {
      setEditUserLots(editUserLots.filter((id) => id !== lotId))
    } else {
      setEditUserLots([...editUserLots, lotId])
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    )
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>User Management</CardTitle>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New User</DialogTitle>
              <DialogDescription>Create a new user account</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleAddUser}>
              <div className="space-y-4 py-4">
                {addUserError && (
                  <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{addUserError}</div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input id="name" value={newUserName} onChange={(e) => setNewUserName(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={newUserRole} onValueChange={setNewUserRole}>
                    <SelectTrigger id="role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newUserRole === "manager" && lots.length > 0 && (
                  <div className="space-y-2">
                    <Label>Assigned Parking Lots</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {lots.map((lot) => (
                        <div key={lot.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`lot-${lot.id}`}
                            checked={newUserLots.includes(lot.id)}
                            onChange={() => handleLotSelection(lot.id)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <Label htmlFor={`lot-${lot.id}`}>{lot.name}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isAddingUser}>
                  {isAddingUser ? "Creating..." : "Create User"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Last Login</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.displayName}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell className="capitalize">{user.role}</TableCell>
                    <TableCell>
                      {user.lastLogin ? new Date(user.lastLogin.seconds * 1000).toLocaleString() : "Never"}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(user)}>
                          <Pencil className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => handleDeleteUser(user.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="sr-only">Delete</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Edit User Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit User</DialogTitle>
              <DialogDescription>Update user details</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditUser}>
              <div className="space-y-4 py-4">
                {editUserError && (
                  <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">{editUserError}</div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="edit-name">Full Name</Label>
                  <Input
                    id="edit-name"
                    value={editUserName}
                    onChange={(e) => setEditUserName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-role">Role</Label>
                  <Select value={editUserRole} onValueChange={setEditUserRole}>
                    <SelectTrigger id="edit-role">
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="manager">Manager</SelectItem>
                      <SelectItem value="owner">Owner</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {editUserRole === "manager" && lots.length > 0 && (
                  <div className="space-y-2">
                    <Label>Assigned Parking Lots</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {lots.map((lot) => (
                        <div key={lot.id} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={`edit-lot-${lot.id}`}
                            checked={editUserLots.includes(lot.id)}
                            onChange={() => handleEditLotSelection(lot.id)}
                            className="h-4 w-4 rounded border-gray-300"
                          />
                          <Label htmlFor={`edit-lot-${lot.id}`}>{lot.name}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isEditingUser}>
                  {isEditingUser ? "Updating..." : "Update User"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  )
}

