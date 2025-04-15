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
import { useFirebase } from "@/contexts/firebase-context"
import Loading from "../../components/loading"
import { addLot, addLotToManager, deleteLot, getLots, getManagers, Lot, removeLotFromManager, updateLot, UserData } from "@/lib/firestore-service"



export default function LotManagement() {
  const { userData, loading } = useFirebase()
  const [lots, setLots] = useState<Lot[]>([]);
  const [managers, setManagers] = useState<UserData[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [isManagerDialogOpen, setIsManagerDialogOpen] = useState(false)
  const [currentLot, setCurrentLot] = useState<Lot | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    address: "",
    capacity: "",
    manager: "",
  })

  useEffect(() => {
    const fetchData = async () => {
      const managersData = getManagers();
      const lotsData = getLots();
      Promise.all([managersData, lotsData]).then(([managersData, lotsData]) => {
        setManagers(managersData)
        setLots(lotsData)
      });
    }
    fetchData()
  }, [])

  const updateManagerList = async () => {
    const managersData = await getManagers();
    setManagers(managersData)
  }

  const updateLotList = async () => {
    const lotsData = await getLots();
    setLots(lotsData)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    console.log("select", name, value)  
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleAddLot = async () => {
    const newLot = {
      id: "",
      name: formData.name,
      address: formData.address,
      capacity: Number.parseInt(formData.capacity),
      occupied: 0,
    }

    const lot = await addLot(newLot);
    await addLotToManager(lot.id, formData.manager);
    newLot.id = lot.id;
    setLots((prev) => [...prev, newLot])
    setIsAddDialogOpen(false)
    resetForm()
    updateLotList()
    updateManagerList()
  }

  const getManagerForLot = (lotId: string): UserData[] => {
    return managers.filter(m => m.assignedLots?.includes(lotId))
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

    updateLot(currentLot.id, {
      name: formData.name,
      address: formData.address,
      capacity: Number.parseInt(formData.capacity),
    });


    setLots(updatedLots)
    setIsEditDialogOpen(false)
    resetForm()
    updateLotList()
  }


  const handleLotPermission = () => {
    if (!currentLot) return
    console.log("manager", formData.manager)
    if (formData.manager !== "unassigned") {
      addLotToManager(currentLot.id, formData.manager);
    }
    setIsManagerDialogOpen(false)
    resetForm()
    updateManagerList()
  }

  const handleDeleteLot = (id: string) => {
    if (confirm("Are you sure you want to delete this parking lot?")) {
      deleteLot(id);
      setLots((prev) => prev.filter((lot) => lot.id !== id))
    }
  }

  const handleRemoveManager = (managerId: string) => {
    if (confirm("Are you sure you want to remove the manager?")) {
      if (!currentLot) return
      removeLotFromManager(currentLot.id, managerId);
      setIsManagerDialogOpen(false)
      resetForm()
      updateManagerList()
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

  if (loading)
    return <Loading />


  if (!loading && userData?.role !== "owner") {
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
                      <SelectItem key={manager.uid} value={manager.uid!}>
                        {manager.displayName}
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

      {!lots.length ?

        <div className="flex h-full items-center justify-center p-6">
          <Card className="w-full max-w-md">
            <CardContent className="p-6 text-center">
              <h2 className="text-xl font-semibold">No Parking Lots Found</h2>
              <p className="mt-2 text-muted-foreground">Please add a parking lot to get started.</p>
            </CardContent>
          </Card>
        </div>
        :
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
                      {/* {lot.occupied} / {lot.capacity} */}
                      occ/{lot.capacity}
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full bg-primary" style={{ width: `${0.5 * 100}%` }} />
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Managers:</span>
                    <span className="font-medium">{managers.filter((m) => m.assignedLots?.includes(lot.id)).map(m => m.displayName).join(",")}</span>
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
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {managers.filter(m => m.assignedLots?.includes(currentLot?.id ?? "")).map((manager) => (
                      <TableRow key={manager.uid}>
                        <TableCell>{manager.displayName}</TableCell>
                        <TableCell>{manager.email}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleRemoveManager(manager.uid)} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
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
                      <SelectItem key={manager.uid} value={manager.uid!}>
                        {manager.displayName!}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsManagerDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleLotPermission}>Save Permissions</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      }

    </div>
  )
}

