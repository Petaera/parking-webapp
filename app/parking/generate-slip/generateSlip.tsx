"use client"

import React, { use, useEffect } from "react"

import { useState } from "react"
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
import { getEntryVehicleDetails, getLots, getSlabByLotId, Lot, saveEntryVehicleDetails, saveVehicleDetails, VehicleStatus, VehicleType } from "@/lib/firestore-service"
import { Timestamp } from "firebase/firestore"
import { useRouter } from "next/navigation";
import { useSearchParams } from 'next/navigation'
import { Toaster, toast } from 'react-hot-toast';
import Loading from "@/components/loading"


export default function GenerateSlip() {
  const [pricingSlabs, setPricingSlabs] = useState<VehicleType[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [vehicleNumber, setVehicleNumber] = useState("")
  const [vehicleType, setVehicleType] = useState("4")
  const [hours, setHours] = useState(1) // 0-24 hours
  const [days, setDays] = useState(0) // 0+ days
  const [manualAmount, setManualAmount] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isFetchingPlate, setIsFetchingPlate] = useState(false)
  const [vehicleImage, setVehicleImage] = useState<File | null>(null)
  const searchParams = useSearchParams()
  const router = useRouter();
  const lot = searchParams.get('lot')
  const { loading, user, userData } = useFirebase()
  // Calculate total duration in hours
  const totalHours = hours + days * 24

  useEffect(() => {
    getLots().then((l) => {
      setLots(l)
    });

  }, [])

  useEffect(() => {
    if (lot === null) return
    getSlabByLotId(lot).then((slabs) => {
      setPricingSlabs(slabs)
    })
  }, [lot])

  const selectSLot = (lotId: string) => {
    if (!lotId) return
    router.replace(`?lot=${lotId}`)
  }
  // Calculate fee based on vehicle type and duration
  const calculateFee = () => {
    const vehicleSlabs = pricingSlabs.find((slab) => slab.id === vehicleType)?.slabs
    if (!vehicleSlabs) return 0

    // For durations longer than 24 hours
    if (totalHours > 24) {
      const fullDays = Math.floor(totalHours / 24)
      const remainingHours = totalHours % 24

      // Find the 24-hour additional slab
      const additionalDaySlab = vehicleSlabs.find(slab => slab.rangeType === "eachAdditional")
      const dayFee = additionalDaySlab ? additionalDaySlab.fee : 0

      // Calculate remaining hours fee
      let remainingFee = 0
      if (remainingHours > 0) {
        for (const slab of vehicleSlabs) {
          if (slab.rangeType === "upTo" && remainingHours <= slab.hours) {
            remainingFee = slab.fee
            break
          }
        }
      }

      return (fullDays * dayFee) + remainingFee
    }

    // For durations less than or equal to 24 hours
    for (const slab of vehicleSlabs) {
      if (slab.rangeType === "upTo" && totalHours <= slab.hours) {
        return slab.fee
      }
    }

    return 0
  }

  // Get the current pricing slab label
  const getCurrentSlabLabel = () => {
    const vehicleSlabs = pricingSlabs.find((slab) => slab.id === vehicleType)?.slabs
    if (!vehicleSlabs) return ""

    if (totalHours > 24) {
      const fullDays = Math.floor(totalHours / 24)
      const remainingHours = totalHours % 24

      const additionalDaySlab = vehicleSlabs.find(slab => slab.rangeType === "eachAdditional")
      let remainingSlabLabel = ""

      if (remainingHours > 0) {
        for (const slab of vehicleSlabs) {
          if (slab.rangeType === "upTo" && remainingHours <= slab.hours) {
            remainingSlabLabel = `${slab.hours}hr @ ₹${slab.fee}`
            break
          }
        }
      }
      
      const daySlabLabel = additionalDaySlab ? `24${additionalDaySlab.hours === 24?'day':'hr'} @ ₹${additionalDaySlab.fee}` : ""
      return `${fullDays} x ${daySlabLabel}${remainingHours > 0 ? ` + ${remainingSlabLabel}` : ""}`
    }

    for (const slab of vehicleSlabs) {
      if (slab.rangeType === "upTo" && totalHours <= slab.hours) {
        return `${slab.hours}hr @ ₹${slab.fee}`
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
    if (!userData || !lot) return

    setIsGenerating(true)
    const vehicleDetails = {
      createdBy: userData.uid,
      createdByName: userData.displayName?? "",
      enteredPlate: vehicleNumber,
      enteredType: vehicleType,
      entryTime: Timestamp.now(),
      exitTime: Timestamp.fromDate(new Date(Date.now() + totalHours * 60 * 60 * 1000)),
      duration: totalHours,
      paymentSlab: getCurrentSlabLabel(),
      fee: Number(manualAmount),
      status: "active" as VehicleStatus,
    }

    try {
      // Create parking slip in Firestore
      await saveEntryVehicleDetails(lot, vehicleDetails)
      toast.success("Parking slip generated successfully!")
      resetForm()
    } catch (error) {
      console.error("Error generating slip:", error)
      toast.error("Failed to generate parking slip. Saving details")
      await saveVehicleDetails(lot, vehicleDetails)
      resetForm();
    } finally {
      setIsGenerating(false)
    }
  }

  const resetForm = () => {
    setVehicleNumber("")
    setVehicleType("4")
    setHours(1)
    setDays(0)
    setManualAmount(null)
    setVehicleImage(null)
  }

  const simulateVehicleScan = async () => {
    // Simulate ML detection

    if (!lot) return
    try {
      console.log("Simulating vehicle scan...")
      setIsFetchingPlate(true)
      const { plate, vehicleType } = await getEntryVehicleDetails(lot);
      setVehicleNumber(plate)
      console.log("Detected plate:", plate)
      console.log("Detected vehicle type:", vehicleType)
      setVehicleType(vehicleType)
    } catch (e: any) {
        toast.error("Failed to fetch vehicle details. Please try again.");
    } finally {
      setIsFetchingPlate(false)
    }
  }

  if (!lot)
    return (
      <div className="flex min-h-screen flex-col">
        <Header title="Generate Parking Slip" />
        <div className="text-center flex flex-col flex-[1_1_0%] items-center justify-center">
          <div className="space-y-4">
            <select
              id="lot-select"
              onChange={(e) => selectSLot(e.target.value)}
              className="border rounded px-2 py-1 mt-2"
              disabled={lots.length === 0}
            >
              <option value="">Select a lot</option>
              {lots.length === 0 ? (
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
        </div>
      </div>
    )

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loading />
      </div>
    )
  if (!user)
    return (
      <div className="flex min-h-screen flex-col">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Unauthorized</h1>
          <p>Please sign in to access this page.</p>
        </div>
      </div>
    )
  return (
    <div className="flex min-h-screen flex-col">
      <Toaster />
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
                  Camera Feed
                </div>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={simulateVehicleScan} disabled={isFetchingPlate}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Scan Vehicle
                </Button>
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
                    <RadioGroupItem value="2" id="2-wheeler" />
                    <Label htmlFor="2-wheeler">2-Wheeler</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="4" id="4-wheeler" />
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
                disabled={!vehicleNumber || isGenerating}
              >
                {isGenerating ? "Generating..." : "Generate Slip"}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  )
}

