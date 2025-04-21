"use client"

import React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, Info } from "lucide-react"
import {
  getLots,
  getSlabByLotId,
  getDefaultSlab,
  Slab,
  TimeRangeType,
  VehicleType,
  setSlabByLotId // export async function setSlabByLotId(lotId: string, slabs: VehicleDetails[])
} from "@/lib/firestore-service"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@radix-ui/react-tooltip"
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@radix-ui/react-dialog"
import { DialogFooter, DialogHeader } from "./ui/dialog"



export default function RateConfiguration() {
  const [defaultVehicleTypes, setDefaultVehicleTypes] = useState<VehicleType[]>([])
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([])
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>("")

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [currentSlab, setCurrentSlab] = useState<Slab | null>(null)
  const [formData, setFormData] = useState<Omit<Slab, "id">>({
    rangeType: "upTo",
    hours: 1,
    fee: 0,
  })

  const [isAddVehicleDialogOpen, setIsAddVehicleDialogOpen] = useState(false)
  const [newVehicleType, setNewVehicleType] = useState("")
  const [hasChanges, setHasChanges] = useState(false)

  const [lots, setLots] = useState<{ id: string; name: string }[]>([])
  const [selectedLot, setSelectedLot] = useState<string>("")
  const [isLoadingLots, setIsLoadingLots] = useState(true)

  // Fetch defaults
  useEffect(() => {
    getDefaultSlab().then(setDefaultVehicleTypes).catch(console.error)
  }, [])

  // Fetch lots
  useEffect(() => {
    setIsLoadingLots(true)
    getLots()
      .then((data) => {
        setLots(data)
        setSelectedLot(data[0]?.id || "")
      })
      .catch(console.error)
      .finally(() => setIsLoadingLots(false))
  }, [])

  // Fetch or init slabs
  useEffect(() => {
    if (!selectedLot) return
    getSlabByLotId(selectedLot)
      .then((slabs) => {
        if (slabs?.length) {
          setVehicleTypes(slabs)
          setSelectedVehicleType(slabs[0].id)
        } 
        setHasChanges(false)
      })
      .catch(console.error)
  }, [selectedLot])

  const currentVehicleTypeObj =
    vehicleTypes.find((vt) => vt.id === selectedVehicleType) ||
    ({ id: "", name: "", slabs: [] } as VehicleType)
  const sortedSlabs = [...currentVehicleTypeObj.slabs].sort((a, b) => {
    if (a.rangeType === "eachAdditional") return 1
    if (b.rangeType === "eachAdditional") return -1
    return a.hours - b.hours
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: ["fee", "hours", "hoursEnd"].includes(name) ? Number(value) : value,
    }))
  }

  const handleRangeTypeChange = (value: TimeRangeType) => {
    setFormData((prev) => ({ ...prev, rangeType: value }))
  }

  const openAddDialog = () => {
    setCurrentSlab(null)
    setFormData({ rangeType: "upTo", hours: 1, fee: 0 })
    setIsAddDialogOpen(true)
  }

  const openEditDialog = (slab: Slab) => {
    setCurrentSlab(slab)
    setFormData({ ...slab })
    setIsEditDialogOpen(true)
  }

  const checkForConflicts = (newSlab: Slab, excludeId?: string) => {
    if (newSlab.rangeType === "eachAdditional") {
      return currentVehicleTypeObj.slabs.some(
        (s) => s.rangeType === "eachAdditional" && s.id !== excludeId
      )
    }
    if (newSlab.rangeType === "upTo") {
      return currentVehicleTypeObj.slabs.some(
        (s) => s.rangeType === "upTo" && s.hours === newSlab.hours && s.id !== excludeId
      )
    }
    if (newSlab.rangeType === "between" && newSlab.hoursEnd) {
      return currentVehicleTypeObj.slabs.some(
        (s) =>
          s.rangeType === "between" &&
          s.hours === newSlab.hours &&
          s.hoursEnd === newSlab.hoursEnd &&
          s.id !== excludeId
      )
    }
    return false
  }

  const handleAddSlab = () => {
    const newSlab: Slab = { id: `${selectedVehicleType}-${Date.now()}`, ...formData }
    if (checkForConflicts(newSlab)) {
      return alert("Conflict detected. Adjust time range.")
    }
    setVehicleTypes((prev) =>
      prev.map((vt) =>
        vt.id === selectedVehicleType
          ? { ...vt, slabs: [...vt.slabs, newSlab] }
          : vt
      )
    )
    setIsAddDialogOpen(false)
    setHasChanges(true)
  }

  const handleEditSlab = () => {
    if (!currentSlab) return
    const updatedSlab: Slab = { ...currentSlab, ...formData }
    if (checkForConflicts(updatedSlab, currentSlab.id)) {
      return alert("Conflict detected. Adjust time range.")
    }
    setVehicleTypes((prev) =>
      prev.map((vt) =>
        vt.id === selectedVehicleType
          ? {
              ...vt,
              slabs: vt.slabs.map((s) =>
                s.id === currentSlab.id ? updatedSlab : s
              ),
            }
          : vt
      )
    )
    setIsEditDialogOpen(false)
    setHasChanges(true)
  }

  const handleDeleteSlab = (slabId: string) => {
    if (!confirm("Delete this slab?")) return
    setVehicleTypes((prev) =>
      prev.map((vt) =>
        vt.id === selectedVehicleType
          ? { ...vt, slabs: vt.slabs.filter((s) => s.id !== slabId) }
          : vt
      )
    )
    setHasChanges(true)
  }

  const handleAddVehicleType = () => {
    if (!newVehicleType.trim()) return alert("Enter a name")
    const id = newVehicleType.toLowerCase().replace(/\s+/g, "-")
    if (vehicleTypes.some((vt) => vt.id === id)) {
      return alert("Type exists")
    }
    const newVT: VehicleType = { id, name: newVehicleType, slabs: [] }
    setVehicleTypes((prev) => [...prev, newVT])
    setSelectedVehicleType(id)
    setNewVehicleType("")
    setIsAddVehicleDialogOpen(false)
    setHasChanges(true)
  }
  const handleSaveChanges = async () => {
    try {
      await setSlabByLotId(selectedLot, vehicleTypes)
      alert("Saved!")
      setHasChanges(false)
    } catch (e) {
      console.error(e)
      alert("Save failed")
    }
  }
  

  const getSlabDescription = (slab: Slab) => {
    switch (slab.rangeType) {
      case "upTo":
        return `Up to ${slab.hours}h`
      case "eachAdditional":
        return `Each additional ${slab.hours}h`
      case "between":
        return `Between ${slab.hours}h and ${slab.hoursEnd}h`
      default:
        return ""
    }
  }

  const generatePricingSummary = () => {
    const regular = sortedSlabs.filter((s) => s.rangeType !== "eachAdditional")
    const additional = sortedSlabs.filter((s) => s.rangeType === "eachAdditional")
    const lines: string[] = []
    regular.forEach((s, i) => {
      const prev = regular[i - 1]
      const start = prev ? `>${prev.hours}h` : "0h"
      lines.push(`- ${start} to ${s.hours}h: ₹${s.fee}`)
    })
    additional.forEach((s) => {
      const last = regular[regular.length - 1]
      lines.push(
        last
          ? `- Beyond ${last.hours}h: ₹${s.fee} per ${s.hours}h`
          : `- Each ${s.hours}h: ₹${s.fee}`
      )
    })
    return lines.join("\n")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parking Rate Configuration</CardTitle>
        <CardDescription>Select a lot and configure its pricing slabs</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Lot Select */}
        <div className="space-y-4">
          <Label htmlFor="lot-select">Select Lot</Label>
          <select
            id="lot-select"
            value={selectedLot}
            onChange={(e) => setSelectedLot(e.target.value)}
            className="border rounded px-2 py-1"
            disabled={isLoadingLots}
          >
            {isLoadingLots ? (
              <option>Loading...</option>
            ) : (
              lots.map((lot) => (
                <option key={lot.id} value={lot.id}>
                  {lot.name}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Vehicle Types & Slabs */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Types & Slabs</CardTitle>
            <CardDescription>Manage your time-based pricing tiers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Tabs and Add Vehicle */}
            <div className="flex items-center justify-between">
              <Tabs
                value={selectedVehicleType}
                onValueChange={setSelectedVehicleType}
                className="w-full"
              >
                <TabsList className="flex-wrap overflow-x-auto">
                  {vehicleTypes.map((vt) => (
                    <TabsTrigger key={vt.id} value={vt.id}>
                      {vt.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
              <Dialog
                open={isAddVehicleDialogOpen}
                onOpenChange={setIsAddVehicleDialogOpen}
              >
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Vehicle Type
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Vehicle Type</DialogTitle>
                  </DialogHeader>
                  <div className="py-4 space-y-2">
                    <Label htmlFor="vehicle-type">Name</Label>
                    <Input
                      id="vehicle-type"
                      value={newVehicleType}
                      onChange={(e) => setNewVehicleType(e.target.value)}
                      placeholder="e.g., EV"
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsAddVehicleDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleAddVehicleType}>Add</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            {/* Slabs Table */}
            <div className="border rounded">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Time Range</TableHead>
                    <TableHead>Fee (₹)</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedSlabs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-6">
                        No slabs defined. Add one below.
                      </TableCell>
                    </TableRow>
                  ) : (
                    sortedSlabs.map((slab, idx) => (
                      <TableRow
                        key={slab.id}
                        className={slab.rangeType === "eachAdditional" ? "bg-slate-50" : ""}
                      >
                        <TableCell>{idx + 1}</TableCell>
                        <TableCell>
                          <div className="flex items-center">
                            {getSlabDescription(slab)}
                            {slab.rangeType === "eachAdditional" && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="ml-1"
                                    >
                                      <Info className="h-4 w-4 text-muted-foreground" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    This rate applies repeatedly
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>₹{slab.fee}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(slab)}
                            >
                              <Pencil className="h-4 w-4" />
                              <span className="sr-only">Edit</span>
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-destructive"
                              onClick={() => handleDeleteSlab(slab.id)}
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

            <Button onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Slab
            </Button>

            {sortedSlabs.length > 0 && (
              <Card className="bg-slate-50">
                <CardHeader>
                  <CardTitle className="text-sm">Preview</CardTitle>
                </CardHeader>
                <CardContent>
                  <pre className="whitespace-pre-line text-sm">
                    {generatePricingSummary()}
                  </pre>
                </CardContent>
              </Card>
            )}

            {/* Add Slab Dialog */}
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Pricing Slab</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <fieldset className="space-y-2">
                    <Label>Time Range Type</Label>
                    <RadioGroup
                      value={formData.rangeType}
                      onValueChange={handleRangeTypeChange}
                      className="flex space-x-4"
                    >
                      <RadioGroupItem value="upTo" id="upTo" />
                      <Label htmlFor="upTo">Up To</Label>
                      <RadioGroupItem value="between" id="between" />
                      <Label htmlFor="between">Between</Label>
                      <RadioGroupItem value="eachAdditional" id="eachAdditional" />
                      <Label htmlFor="eachAdditional">Each Additional</Label>
                    </RadioGroup>
                  </fieldset>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Label htmlFor="hours">Hours</Label>
                      <Input
                        type="number"
                        id="hours"
                        name="hours"
                        value={formData.hours}
                        onChange={handleInputChange}
                        min={1}
                      />
                    </div>
                    {formData.rangeType === "between" && (
                      <div className="flex-1">
                        <Label htmlFor="hoursEnd">Hours End</Label>
                        <Input
                          type="number"
                          id="hoursEnd"
                          name="hoursEnd"
                          value={formData.hoursEnd || ''}
                          onChange={handleInputChange}
                          min={formData.hours}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="fee">Fee (₹)</Label>
                    <Input
                      type="number"
                      id="fee"
                      name="fee"
                      value={formData.fee}
                      onChange={handleInputChange}
                      min={0}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleAddSlab}>Add Slab</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            {/* Edit Slab Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
              <DialogTrigger />
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Pricing Slab</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <fieldset className="space-y-2">
                    <Label>Time Range Type</Label>
                    <RadioGroup
                      value={formData.rangeType}
                      onValueChange={handleRangeTypeChange}
                      className="flex space-x-4"
                    >
                      <RadioGroupItem value="upTo" id="edit-upTo" />
                      <Label htmlFor="edit-upTo">Up To</Label>
                      <RadioGroupItem value="between" id="edit-between" />
                      <Label htmlFor="edit-between">Between</Label>
                      <RadioGroupItem value="eachAdditional" id="edit-eachAdditional" />
                      <Label htmlFor="edit-eachAdditional">Each Additional</Label>
                    </RadioGroup>
                  </fieldset>
                  <div className="flex space-x-2">
                    <div className="flex-1">
                      <Label htmlFor="edit-hours">Hours</Label>
                      <Input
                        type="number"
                        id="edit-hours"
                        name="hours"
                        value={formData.hours}
                        onChange={handleInputChange}
                        min={1}
                      />
                    </div>
                    {formData.rangeType === "between" && (
                      <div className="flex-1">
                        <Label htmlFor="edit-hoursEnd">Hours End</Label>
                        <Input
                          type="number"
                          id="edit-hoursEnd"
                          name="hoursEnd"
                          value={formData.hoursEnd || ''}
                          onChange={handleInputChange}
                          min={formData.hours}
                        />
                      </div>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="edit-fee">Fee (₹)</Label>
                    <Input
                      type="number"
                      id="edit-fee"
                      name="fee"
                      value={formData.fee}
                      onChange={handleInputChange}
                      min={0}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleEditSlab}>Save Changes</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
          <CardFooter className="flex justify-between">
            <Button
              variant="outline"
              disabled={!hasChanges}
              onClick={() => {
                setHasChanges(false)
                getSlabByLotId(selectedLot)
                  .then((data) => {
                    setVehicleTypes(data.length ? data : defaultVehicleTypes)
                    setSelectedVehicleType(
                      data.length ? data[0].id : defaultVehicleTypes[0].id
                    )
                  })
                  .catch(console.error)
              }}
            >
              Reset Changes
            </Button>
            <Button onClick={handleSaveChanges} disabled={!hasChanges}>
              Save Configuration
            </Button>
          </CardFooter>
        </Card>
      </CardContent>
    </Card>
  )
}
