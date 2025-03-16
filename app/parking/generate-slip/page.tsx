"use client"

import React from "react"

import { useState, useRef } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Camera, RefreshCw, Info } from "lucide-react"
import Header from "@/components/header"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { useFirebase } from "@/contexts/firebase-context"
import { createParkingSlip } from "@/lib/firestore-service"
import { Timestamp } from "firebase/firestore"

// Pricing slabs
const pricingSlabs = {
  "2-wheeler": [
    { maxHours: 1, price: 10, label: "Up to 1 hour - ₹10" },
    { maxHours: 24, price: 20, label: "Up to 24 hours - ₹20" },
    { maxHours: Number.POSITIVE_INFINITY, price: 20, label: "Each additional 24 hours - ₹20" },
  ],
  "4-wheeler": [
    { maxHours: 1, price: 30, label: "Up to 1 hour - ₹30" },
    { maxHours: 2, price: 40, label: "Up to 2 hours - ₹40" },
    { maxHours: 8, price: 50, label: "Up to 8 hours - ₹50" },
    { maxHours: 16, price: 80, label: "Up to 16 hours - ₹80" },
    { maxHours: 24, price: 100, label: "Up to 24 hours - ₹100" },
    { maxHours: Number.POSITIVE_INFINITY, price: 100, label: "Each additional 24 hours - ₹100" },
  ],
}

export default function GenerateSlip() {
  const { userData } = useFirebase()
  const [vehicleNumber, setVehicleNumber] = useState("")
  const [vehicleType, setVehicleType] = useState("4-wheeler")
  const [hours, setHours] = useState(1) // 0-24 hours
  const [days, setDays] = useState(0) // 0+ days
  const [manualAmount, setManualAmount] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [vehicleImage, setVehicleImage] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Calculate total duration in hours
  const totalHours = hours + days * 24

  // Calculate fee based on vehicle type and duration
  const calculateFee = () => {
    const slabs = pricingSlabs[vehicleType as keyof typeof pricingSlabs]

    // For durations longer than 24 hours
    if (totalHours > 24) {
      const fullDays = Math.floor(totalHours / 24)
      const remainingHours = totalHours % 24

      // Find the price for the remaining hours
      let remainingPrice = 0
      for (const slab of slabs) {
        if (remainingHours <= slab.maxHours) {
          remainingPrice = slab.price
          break
        }
      }

      // Calculate the price for full days (using the 24-hour slab)
      const dayPrice =
        slabs.find((slab) => slab.maxHours === 24)?.price ||
        slabs.find((slab) => slab.maxHours === Number.POSITIVE_INFINITY)?.price ||
        0

      return fullDays * dayPrice + remainingPrice
    }

    // For durations less than or equal to 24 hours
    for (const slab of slabs) {
      if (totalHours <= slab.maxHours) {
        return slab.price
      }
    }

    return 0
  }

  // Get the current pricing slab label
  const getCurrentSlabLabel = () => {
    const slabs = pricingSlabs[vehicleType as keyof typeof pricingSlabs]

    if (totalHours > 24) {
      const fullDays = Math.floor(totalHours / 24)
      const remainingHours = totalHours % 24

      let remainingSlabLabel = ""
      for (const slab of slabs) {
        if (remainingHours <= slab.maxHours) {
          remainingSlabLabel = slab.label
          break
        }
      }

      const daySlabLabel = slabs.find((slab) => slab.maxHours === Number.POSITIVE_INFINITY)?.label || ""

      return `${fullDays} x ${daySlabLabel}${remainingHours > 0 ? ` + ${remainingSlabLabel}` : ""}`
    }

    for (const slab of slabs) {
      if (totalHours <= slab.maxHours) {
        return slab.label
      }
    }

    return ""
  }

  const fee = calculateFee()

  // Update manual amount when fee changes
  React.useEffect(() => {
    setManualAmount(fee.toString())
  }, [fee])

  const handleGenerateSlip = async () => {
    if (!userData) return

    setIsGenerating(true)

    try {
      // Create parking slip in Firestore
      await createParkingSlip(
        {
          lotId: "default", // In a real app, you'd select the lot
          createdBy: userData.uid,
          systemRecordedPlate: vehicleNumber,
          enteredPlate: vehicleNumber,
          vehicleType,
          entryTime: Timestamp.now(),
          status: "active",
          paymentSlab: getCurrentSlabLabel(),
          feePaid: Number(manualAmount || fee),
        },
        vehicleImage || undefined,
      )

      setIsSuccess(true)

      // Reset form after 3 seconds
      setTimeout(() => {
        setVehicleNumber("")
        setVehicleType("4-wheeler")
        setHours(1)
        setDays(0)
        setManualAmount(null)
        setVehicleImage(null)
        setIsSuccess(false)
      }, 3000)
    } catch (error) {
      console.error("Error generating slip:", error)
      alert("Failed to generate slip. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const simulateVehicleScan = () => {
    // Simulate ML detection
    const plates = ["KA01AB1234", "MH02CD5678", "DL03EF9012", "TN04GH3456"]
    const randomPlate = plates[Math.floor(Math.random() * plates.length)]
    setVehicleNumber(randomPlate)

    // Randomly set vehicle type
    setVehicleType(Math.random() > 0.5 ? "4-wheeler" : "2-wheeler")
  }

  const handleImageCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setVehicleImage(e.target.files[0])
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header title="Generate Parking Slip" />

      <div className="flex-1 p-4 pt-6 md:p-6">
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Detection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-video overflow-hidden rounded-md bg-slate-100">
                {vehicleImage ? (
                  <img
                    src={URL.createObjectURL(vehicleImage) || "/placeholder.svg"}
                    alt="Vehicle"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Camera className="h-16 w-16 text-slate-300" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-slate-800/70 p-2 text-center text-sm text-white">
                  Camera Feed (Simulated)
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={simulateVehicleScan}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Scan Vehicle
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => fileInputRef.current?.click()}>
                  <Camera className="mr-2 h-4 w-4" />
                  Upload Image
                </Button>
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageCapture}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Parking Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="vehicle-number">Vehicle Number</Label>
                <div className="flex gap-2">
                  <Input
                    id="vehicle-number"
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="Enter vehicle number"
                    className="flex-1"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Vehicle Type</Label>
                <RadioGroup value={vehicleType} onValueChange={setVehicleType} className="flex gap-4">
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="2-wheeler" id="2-wheeler" />
                    <Label htmlFor="2-wheeler">2-Wheeler</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="4-wheeler" id="4-wheeler" />
                    <Label htmlFor="4-wheeler">4-Wheeler</Label>
                  </div>
                </RadioGroup>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Hours</Label>
                    <span className="text-sm font-medium">
                      {hours} {hours === 1 ? "hour" : "hours"}
                    </span>
                  </div>
                  <Slider value={[hours]} min={0} max={24} step={1} onValueChange={(value) => setHours(value[0])} />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Label>Days</Label>
                    <span className="text-sm font-medium">
                      {days} {days === 1 ? "day" : "days"}
                    </span>
                  </div>
                  <Slider value={[days]} min={0} max={30} step={1} onValueChange={(value) => setDays(value[0])} />
                </div>
              </div>

              <div className="rounded-md bg-slate-50 p-4 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <span className="font-medium">Calculated Fee:</span>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 ml-1">
                            <Info className="h-4 w-4 text-muted-foreground" />
                            <span className="sr-only">Fee information</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Based on: {getCurrentSlabLabel()}</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <span className="font-bold">₹{fee}</span>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manual-amount">Final Amount (Override)</Label>
                  <Input
                    id="manual-amount"
                    type="number"
                    value={manualAmount || ""}
                    onChange={(e) => setManualAmount(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={handleGenerateSlip}
                disabled={!vehicleNumber || isGenerating || isSuccess}
              >
                {isGenerating ? "Generating..." : isSuccess ? "Slip Generated!" : "Generate Slip"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

