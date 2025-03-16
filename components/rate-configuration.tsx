"use client"

import type React from "react"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Plus, Pencil, Trash2, Info } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

// Types for our rate configuration
type TimeRangeType = "upTo" | "eachAdditional" | "between"

interface Slab {
  id: string
  title?: string
  rangeType: TimeRangeType
  hours: number
  hoursEnd?: number // For "between" range type
  fee: number
}

interface VehicleType {
  id: string
  name: string
  slabs: Slab[]
}

// Initial data
const initialVehicleTypes: VehicleType[] = [
  {
    id: "2-wheeler",
    name: "2-Wheeler",
    slabs: [
      { id: "2w-1", rangeType: "upTo", hours: 1, fee: 10 },
      { id: "2w-2", rangeType: "upTo", hours: 24, fee: 20 },
      { id: "2w-3", rangeType: "eachAdditional", hours: 24, fee: 20 },
    ],
  },
  {
    id: "4-wheeler",
    name: "4-Wheeler",
    slabs: [
      { id: "4w-1", rangeType: "upTo", hours: 1, fee: 30 },
      { id: "4w-2", rangeType: "upTo", hours: 2, fee: 40 },
      { id: "4w-3", rangeType: "upTo", hours: 8, fee: 50 },
      { id: "4w-4", rangeType: "upTo", hours: 16, fee: 80 },
      { id: "4w-5", rangeType: "upTo", hours: 24, fee: 100 },
      { id: "4w-6", rangeType: "eachAdditional", hours: 24, fee: 100 },
    ],
  },
]

// Mock function to simulate updating pricing for a lot
// Replace this with your actual Firestore update logic
const updatePricingForLot = async (lotId: string, vehicleType: VehicleType) => {
  // Simulate an API call or database update
  return new Promise((resolve) => {
    console.log(`Updating pricing for lot ${lotId} with:`, vehicleType)
    setTimeout(resolve, 500) // Simulate a network request delay
  })
}

export default function RateConfiguration() {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>(initialVehicleTypes)
  const [selectedVehicleType, setSelectedVehicleType] = useState<string>(vehicleTypes[0].id)
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

  // Get the current vehicle type object
  const currentVehicleType = vehicleTypes.find((vt) => vt.id === selectedVehicleType) || vehicleTypes[0]

  // Sort slabs by hours for display
  const sortedSlabs = [...currentVehicleType.slabs].sort((a, b) => {
    // Always put "eachAdditional" at the end
    if (a.rangeType === "eachAdditional") return 1
    if (b.rangeType === "eachAdditional") return -1
    return a.hours - b.hours
  })

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: name === "fee" || name === "hours" || name === "hoursEnd" ? Number(value) : value,
    }))
  }

  // Handle radio group change
  const handleRangeTypeChange = (value: TimeRangeType) => {
    setFormData((prev) => ({ ...prev, rangeType: value }))
  }

  // Open add slab dialog
  const openAddDialog = () => {
    setCurrentSlab(null)
    setFormData({
      rangeType: "upTo",
      hours: 1,
      fee: 0,
    })
    setIsAddDialogOpen(true)
  }

  // Open edit slab dialog
  const openEditDialog = (slab: Slab) => {
    setCurrentSlab(slab)
    setFormData({
      title: slab.title,
      rangeType: slab.rangeType,
      hours: slab.hours,
      hoursEnd: slab.hoursEnd,
      fee: slab.fee,
    })
    setIsEditDialogOpen(true)
  }

  // Add a new slab
  const handleAddSlab = () => {
    const newSlab: Slab = {
      id: `${selectedVehicleType}-${Date.now()}`,
      ...formData,
    }

    // Check for conflicts
    const hasConflict = checkForConflicts(newSlab)
    if (hasConflict) {
      alert("There is a conflict with existing slabs. Please adjust the time range.")
      return
    }

    setVehicleTypes((prev) =>
      prev.map((vt) => (vt.id === selectedVehicleType ? { ...vt, slabs: [...vt.slabs, newSlab] } : vt)),
    )
    setIsAddDialogOpen(false)
    setHasChanges(true)
  }

  // Edit an existing slab
  const handleEditSlab = () => {
    if (!currentSlab) return

    const updatedSlab: Slab = {
      ...currentSlab,
      ...formData,
    }

    // Check for conflicts (excluding the current slab)
    const hasConflict = checkForConflicts(updatedSlab, currentSlab.id)
    if (hasConflict) {
      alert("There is a conflict with existing slabs. Please adjust the time range.")
      return
    }

    setVehicleTypes((prev) =>
      prev.map((vt) =>
        vt.id === selectedVehicleType
          ? {
              ...vt,
              slabs: vt.slabs.map((slab) => (slab.id === currentSlab.id ? updatedSlab : slab)),
            }
          : vt,
      ),
    )
    setIsEditDialogOpen(false)
    setHasChanges(true)
  }

  // Delete a slab
  const handleDeleteSlab = (slabId: string) => {
    if (confirm("Are you sure you want to delete this rate slab?")) {
      setVehicleTypes((prev) =>
        prev.map((vt) =>
          vt.id === selectedVehicleType ? { ...vt, slabs: vt.slabs.filter((slab) => slab.id !== slabId) } : vt,
        ),
      )
      setHasChanges(true)
    }
  }

  // Add a new vehicle type
  const handleAddVehicleType = () => {
    if (!newVehicleType.trim()) {
      alert("Please enter a vehicle type name")
      return
    }

    const newId = newVehicleType.toLowerCase().replace(/\s+/g, "-")

    // Check if vehicle type already exists
    if (vehicleTypes.some((vt) => vt.id === newId)) {
      alert("This vehicle type already exists")
      return
    }

    const newVehicle: VehicleType = {
      id: newId,
      name: newVehicleType,
      slabs: [],
    }

    setVehicleTypes((prev) => [...prev, newVehicle])
    setSelectedVehicleType(newId)
    setNewVehicleType("")
    setIsAddVehicleDialogOpen(false)
    setHasChanges(true)
  }

  // Check for conflicts with existing slabs
  const checkForConflicts = (newSlab: Slab, excludeId?: string) => {
    // For "eachAdditional" type, only allow one per vehicle type
    if (newSlab.rangeType === "eachAdditional") {
      const hasExistingEachAdditional = currentVehicleType.slabs.some(
        (slab) => slab.rangeType === "eachAdditional" && slab.id !== excludeId,
      )
      if (hasExistingEachAdditional) {
        return true
      }
    }

    // For "upTo" type, check for duplicates
    if (newSlab.rangeType === "upTo") {
      return currentVehicleType.slabs.some(
        (slab) => slab.rangeType === "upTo" && slab.hours === newSlab.hours && slab.id !== excludeId,
      )
    }

    return false
  }

  // Save all changes
  const handleSaveChanges = async () => {
    try {
      // In a real app, you would save to Firestore
      // This is a simplified example - you'd need to get the actual lot IDs
      for (const vehicleType of vehicleTypes) {
        await updatePricingForLot("default", {
          ...vehicleType,
        })
      }

      alert("Rate configuration saved successfully!")
      setHasChanges(false)
    } catch (error) {
      console.error("Error saving rate configuration:", error)
      alert("Failed to save rate configuration. Please try again.")
    }
  }

  // Generate a human-readable description of the slab
  const getSlabDescription = (slab: Slab) => {
    if (slab.rangeType === "upTo") {
      return `Up to ${slab.hours} ${slab.hours === 1 ? "hour" : "hours"}`
    } else if (slab.rangeType === "eachAdditional") {
      return `Each additional ${slab.hours} ${slab.hours === 1 ? "hour" : "hours"}`
    } else if (slab.rangeType === "between" && slab.hoursEnd) {
      return `Between ${slab.hours} and ${slab.hoursEnd} hours`
    }
    return ""
  }

  // Generate a summary of the pricing structure
  const generatePricingSummary = () => {
    const slabs = [...sortedSlabs]

    // Filter out "eachAdditional" slabs for the main summary
    const regularSlabs = slabs.filter((slab) => slab.rangeType !== "eachAdditional")
    const additionalSlabs = slabs.filter((slab) => slab.rangeType === "eachAdditional")

    if (regularSlabs.length === 0) {
      return "No pricing slabs defined yet."
    }

    const summary = []

    // Add regular slabs to summary
    for (let i = 0; i < regularSlabs.length; i++) {
      const slab = regularSlabs[i]
      const prevSlab = i > 0 ? regularSlabs[i - 1] : null

      if (slab.rangeType === "upTo") {
        const start = prevSlab ? `>${prevSlab.hours} hour${prevSlab.hours !== 1 ? "s" : ""}` : "0"
        summary.push(`- ${start} - ${slab.hours} hour${slab.hours !== 1 ? "s" : ""}: ₹${slab.fee}`)
      }
    }

    // Add "eachAdditional" slabs to summary
    additionalSlabs.forEach((slab) => {
      const lastRegularSlab = regularSlabs[regularSlabs.length - 1]
      if (lastRegularSlab) {
        summary.push(`- Beyond ${lastRegularSlab.hours} hours: ₹${slab.fee} for every ${slab.hours} hour block`)
      } else {
        summary.push(`- Each ${slab.hours} hour block: ₹${slab.fee}`)
      }
    })

    return summary.join("\n")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Parking Rate Configuration</CardTitle>
        <CardDescription>Create or edit the time-based pricing slabs for each vehicle type</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Vehicle Type Selector */}
        <div className="flex items-center justify-between">
          <Tabs value={selectedVehicleType} onValueChange={setSelectedVehicleType} className="w-full">
            <TabsList className="mb-4 flex w-full flex-wrap overflow-x-auto">
              {vehicleTypes.map((vt) => (
                <TabsTrigger key={vt.id} value={vt.id} className="flex-shrink-0">
                  {vt.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <Dialog open={isAddVehicleDialogOpen} onOpenChange={setIsAddVehicleDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="ml-4">
                <Plus className="mr-2 h-4 w-4" />
                Add Vehicle Type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Vehicle Type</DialogTitle>
                <DialogDescription>Enter a name for the new vehicle type</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="vehicle-type">Vehicle Type Name</Label>
                  <Input
                    id="vehicle-type"
                    value={newVehicleType}
                    onChange={(e) => setNewVehicleType(e.target.value)}
                    placeholder="e.g., Electric Vehicle"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddVehicleDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddVehicleType}>Add Vehicle Type</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Slab Configuration Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Slab</TableHead>
                <TableHead>Time Range</TableHead>
                <TableHead>Fee (₹)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedSlabs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-6">
                    No rate slabs defined yet. Click "Add Slab" to create your first pricing tier.
                  </TableCell>
                </TableRow>
              ) : (
                sortedSlabs.map((slab, index) => (
                  <TableRow key={slab.id} className={slab.rangeType === "eachAdditional" ? "bg-slate-50" : ""}>
                    <TableCell>{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {getSlabDescription(slab)}
                        {slab.rangeType === "eachAdditional" && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                                  <Info className="h-4 w-4 text-muted-foreground" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>This rate applies repeatedly for each time block</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{slab.fee}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(slab)}>
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

        {/* Real-Time Preview / Summary */}
        {sortedSlabs.length > 0 && (
          <Card className="bg-slate-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Effective Pricing</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="text-sm whitespace-pre-line">{generatePricingSummary()}</pre>
            </CardContent>
          </Card>
        )}

        {/* Add Slab Dialog */}
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Rate Slab</DialogTitle>
              <DialogDescription>Define a new pricing tier for {currentVehicleType.name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Slab Title (Optional)</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title || ""}
                  onChange={handleInputChange}
                  placeholder="e.g., Standard Rate"
                />
              </div>

              <div className="space-y-2">
                <Label>Time Range Type</Label>
                <RadioGroup
                  value={formData.rangeType}
                  onValueChange={handleRangeTypeChange}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="upTo" id="upTo" />
                    <Label htmlFor="upTo">Up to X hours</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="eachAdditional" id="eachAdditional" />
                    <Label htmlFor="eachAdditional">Each additional X hours</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="between" id="between" />
                    <Label htmlFor="between">Between X and Y hours</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                {formData.rangeType === "between" ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Label htmlFor="hours">From (hours)</Label>
                      <Input
                        id="hours"
                        name="hours"
                        type="number"
                        min="0"
                        value={formData.hours}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="hoursEnd">To (hours)</Label>
                      <Input
                        id="hoursEnd"
                        name="hoursEnd"
                        type="number"
                        min={formData.hours + 1}
                        value={formData.hoursEnd || formData.hours + 1}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="hours">Hours</Label>
                    <Input
                      id="hours"
                      name="hours"
                      type="number"
                      min="1"
                      value={formData.hours}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fee">Fee (₹)</Label>
                <Input id="fee" name="fee" type="number" min="0" value={formData.fee} onChange={handleInputChange} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddSlab}>Add Slab</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Slab Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Rate Slab</DialogTitle>
              <DialogDescription>Update this pricing tier for {currentVehicleType.name}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="edit-title">Slab Title (Optional)</Label>
                <Input
                  id="edit-title"
                  name="title"
                  value={formData.title || ""}
                  onChange={handleInputChange}
                  placeholder="e.g., Standard Rate"
                />
              </div>

              <div className="space-y-2">
                <Label>Time Range Type</Label>
                <RadioGroup
                  value={formData.rangeType}
                  onValueChange={handleRangeTypeChange}
                  className="flex flex-col space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="upTo" id="edit-upTo" />
                    <Label htmlFor="edit-upTo">Up to X hours</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="eachAdditional" id="edit-eachAdditional" />
                    <Label htmlFor="edit-eachAdditional">Each additional X hours</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="between" id="edit-between" />
                    <Label htmlFor="edit-between">Between X and Y hours</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-2">
                {formData.rangeType === "between" ? (
                  <div className="flex items-center gap-2">
                    <div className="flex-1">
                      <Label htmlFor="edit-hours">From (hours)</Label>
                      <Input
                        id="edit-hours"
                        name="hours"
                        type="number"
                        min="0"
                        value={formData.hours}
                        onChange={handleInputChange}
                      />
                    </div>
                    <div className="flex-1">
                      <Label htmlFor="edit-hoursEnd">To (hours)</Label>
                      <Input
                        id="edit-hoursEnd"
                        name="hoursEnd"
                        type="number"
                        min={formData.hours + 1}
                        value={formData.hoursEnd || formData.hours + 1}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="edit-hours">Hours</Label>
                    <Input
                      id="edit-hours"
                      name="hours"
                      type="number"
                      min="1"
                      value={formData.hours}
                      onChange={handleInputChange}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="edit-fee">Fee (₹)</Label>
                <Input
                  id="edit-fee"
                  name="fee"
                  type="number"
                  min="0"
                  value={formData.fee}
                  onChange={handleInputChange}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleEditSlab}>Save Changes</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button variant="outline">Reset Changes</Button>
        <Button onClick={handleSaveChanges} disabled={!hasChanges}>
          Save Configuration
        </Button>
      </CardFooter>
    </Card>
  )
}

