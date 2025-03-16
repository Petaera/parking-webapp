"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Edit, Trash2, Users } from "lucide-react"
import Header from "@/components/header"

// Mock data
const initialLots = [
  {
    id: 1,
    name: "Lot A",
    address: "123 Main St, Bangalore",
    capacity: 50,
    occupied: 38,
    manager: "John Doe",
  },
  {
    id: 2,
    name: "Lot B",
    address: "456 Park Ave, Mumbai",
    capacity: 30,
    occupied: 25,
    manager: "Jane Smith",
  },
  {
    id: 3,
    name: "Lot C",
    address: "789 Market St, Delhi",
    capacity: 40,
    occupied: 12,
    manager: "Bob Johnson",
  },
]

const managers = [
  { id: 1, name: "John Doe", email: "john@example.com" },
  { id: 2, name: "Jane Smith", email: "jane@example.com" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com" },
  { id: 4, name: "Alice Brown", email: "alice@example.com" },
]

export default function LotManagement() {
  const [user, setUser] = useState<{ role: string } | null>(null)
  const [lots, setLots] = useState(initialLots)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isManagerDialogOpen, setIsManagerDialogOpen] = useState(false)
  const [currentLot, setCurrentLot] = useState<any>(null)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    capacity: "",
    manager: "",
  })

  useEffect(() => {
    // In a real app, you would get this from your auth context
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddLot = () => {
    const newLot = {
      id: lots.length + 1,
      name: formData.name,
      address: formData.address,
      capacity: Number.parseInt(formData.capacity),
      occupied: 0,
      manager: formData.manager || "Unassigned",
    }

    setLots((prev) => [...prev, newLot])
    setIsAddDialogOpen(false)
    resetForm()
  }

  const handleEditLot = () => {
    if (!currentLot) return

    const updatedLots = lots.map((lot) => {
      if (lot.id === currentLot.id) {
        return {
          ...lot,
          name: formData.name,
          address: formData.address,
          capacity: Number.parseInt(formData.capacity),
          manager: formData.manager,
        }
      }
      return lot
    })

    setLots(updatedLots)
    setIsEditDialogOpen(false)
    resetForm()
  }

  const handleDeleteLot = (id: number) => {
    if (confirm("Are you sure you want to delete this parking lot?")) {
      setLots((prev) => prev.filter((lot) => lot.id !== id))
    }
  }

  const openEditDialog = (lot: any) => {
    setCurrentLot(lot)
    setFormData({
      name: lot.name,
      address: lot.address,
      capacity: lot.capacity.toString(),
      manager: lot.manager,
    })
    setIsEditDialogOpen(true)
  }

  const openManagerDialog = (lot: any) => {
    setCurrentLot(lot)
    setIsManagerDialogOpen(true)
  }

  const resetForm = () => {
    setFormData({
      name: "",
      address: "",
      capacity: "",
      manager: "",
    })
    setCurrentLot(null)
  }

  if (!user || user.role !== "owner") {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="mt-2 text-muted-foreground">You don't have permission to access this page.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header title="Parking Lot Management">
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Add New Lot</span>
              <span className="sm:hidden">Add</span>
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Parking Lot</DialogTitle>
              <DialogDescription>Enter the details for the new parking lot.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Lot Name</Label>
                <Input id="name" name="name" value={formData.name} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Input id="address" name="address" value={formData.address} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="capacity">Capacity</Label>
                <Input
                  id="capacity"
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="manager">Assign Manager</Label>
                <Select value={formData.manager} onValueChange={(value) => handleSelectChange("manager", value)}>
                  <SelectTrigger id="manager">
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.name}>
                        {manager.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddLot}>Add Lot</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Header>

      <div className="flex-1 p-4 pt-6 md:p-6">
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {lots.map((lot) => (
            <Card key={lot.id}>
              <CardHeader>
                <CardTitle>{lot.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <p className="text-sm text-muted-foreground">{lot.address}</p>
                <div className="flex justify-between">
                  <span className="text-sm">Capacity:</span>
                  <span className="font-medium">
                    {lot.occupied} / {lot.capacity}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                  <div className="h-full bg-primary" style={{ width: `${(lot.occupied / lot.capacity) * 100}%` }} />
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Manager:</span>
                  <span className="font-medium">{lot.manager}</span>
                </div>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm" onClick={() => openManagerDialog(lot)}>
                  <Users className="mr-2 h-4 w-4" />
                  Managers
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" onClick={() => openEditDialog(lot)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    className="text-destructive"
                    onClick={() => handleDeleteLot(lot.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Edit Lot Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Parking Lot</DialogTitle>
              <DialogDescription>Update the details for this parking lot.</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Lot Name</Label>
                <Input id="edit-name" name="name" value={formData.name} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-address">Address</Label>
                <Input id="edit-address" name="address" value={formData.address} onChange={handleInputChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-capacity">Capacity</Label>
                <Input
                  id="edit-capacity"
                  name="capacity"
                  type="number"
                  value={formData.capacity}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-manager">Assign Manager</Label>
                <Select value={formData.manager} onValueChange={(value) => handleSelectChange("manager", value)}>
                  <SelectTrigger id="edit-manager">
                    <SelectValue placeholder="Select a manager" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">Unassigned</SelectItem>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.name}>
                        {manager.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditLot}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Manager Assignment Dialog */}
        <Dialog open={isManagerDialogOpen} onOpenChange={setIsManagerDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Manage Lot Permissions</DialogTitle>
              <DialogDescription>{currentLot && `Assign managers to ${currentLot.name}`}</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Manager</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Access</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managers.map((manager) => (
                    <TableRow key={manager.id}>
                      <TableCell>{manager.name}</TableCell>
                      <TableCell>{manager.email}</TableCell>
                      <TableCell>
                        <Select defaultValue={currentLot && currentLot.manager === manager.name ? "full" : "none"}>
                          <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Access level" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">No Access</SelectItem>
                            <SelectItem value="view">View Only</SelectItem>
                            <SelectItem value="full">Full Access</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsManagerDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setIsManagerDialogOpen(false)}>Save Permissions</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  )
}

