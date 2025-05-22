"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, RefreshCw, Check, Info } from "lucide-react"
import Header from "@/components/header"
import { useFirebase } from "@/contexts/firebase-context"
import { EntryDetails, getApiUrl, getLots, getSlabByLotId, getVehicle, Lot, updateVehicleDetails, VehicleStatus, VehicleType } from "@/lib/firestore-service"
import { getVehicle as getVehicleFromCam, saveExit} from "@/lib/api-service"
import { Timestamp } from "firebase/firestore"
import { useRouter, useSearchParams } from "next/navigation"
import Loading from "@/components/loading"
import toast, { Toaster } from "react-hot-toast"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@radix-ui/react-tooltip"
import { parseJWT } from "@/lib/utils"

export default function ExitPayment() {
  const { loading, user, userData } = useFirebase()
  const [lots, setLots] = useState<Lot[]>([]);
  const [vehicleNumber, setVehicleNumber] = useState("")
  const [vehicleFound, setVehicleFound] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [isProcessing, setIsProcessing] = useState(false)
  const [pricingSlabs, setPricingSlabs] = useState<VehicleType[]>([]);
  const [totalHours, setTotalHours] = useState(0)
  const [selectedVehicle, setSelectedVehicle] = useState<EntryDetails & { id: string } | null>(null)
  const [manualAmount, setManualAmount] = useState<string | null>(null)
  const [isFetchingPlate, setIsFetchingPlate] = useState(false)
  const [fetchedPlate, setFetchedPlate] = useState<string>("")
  const [vehicleImage, setVehicleImage] = useState<string | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [fee, setFee] = useState(0)
  const searchParams = useSearchParams()
  const router = useRouter();
  const lot = searchParams.get('lot')

  const apiUrl = useRef<string>("");

  useEffect(() => {
    getLots().then((l) => {
      setLots(l)
    });

  }, [])

  useEffect(() => {
    if (lot === null) return
    getSlabByLotId(lot).then((slabs) => {
      setPricingSlabs(slabs)
    });
    getApiUrl(lot).then((url) => {
      apiUrl.current = url;
    });
  }, [lot])

  const selectSLot = (lotId: string) => {
    if (!lotId) return
    router.replace(`?lot=${lotId}`)
  }

  const simulateVehicleScan = async () => {
    if (!lot) return
    setIsFetchingPlate(true);
    try{
    const { token } = await getVehicleFromCam(apiUrl.current, "exit");
    const {vehicle={}} = parseJWT(token); 
    setIsFetchingPlate(false);
    setToken(token);
    if(vehicle.plate){
      setVehicleNumber(vehicle.plate)
      setFetchedPlate(vehicle.plate)
      handleSearch(vehicle.plate)
    }
    if(vehicle.image){
      setVehicleImage(vehicle.image)
    }
    }catch(e){
      console.error("Error fetching vehicle details:", e)
      toast.error("Failed to fetch vehicle details.")
      setIsFetchingPlate(false)
    }
  }

  const handleSearch = async (plateNumber = vehicleNumber) => {
    if (!lot || !plateNumber) return
    const vehicles = await getVehicle(lot, plateNumber)
    const vehicle = vehicles[0]
    if (vehicle) {
      const enTime = (vehicle.entryTime ?? vehicle.enteredEntryTime)
      setSelectedVehicle({ ...vehicle, entryTime: enTime})
      setVehicleFound(true)
      // Calculate fee based on entry time and current time
      const entryTime = vehicle.entryTime!.toDate()
      const currentTime = new Date()
      const durationMs = currentTime.getTime() - entryTime.getTime()
      const durationHours = durationMs / (1000 * 60 * 60)

      if (durationHours > vehicle.duration)
        setTotalHours(durationHours);
      else
        setTotalHours(vehicle.duration);
    } else {
      toast.error("Vehicle not found. Please try again.")
      setSelectedVehicle(null)
      setVehicleFound(false)
    }
  }

  const calculateFee = () => {
    const vehicleSlabs = pricingSlabs.find((slab) => slab.id === selectedVehicle?.enteredType)?.slabs
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
    const vehicleSlabs = pricingSlabs.find((slab) => slab.id === selectedVehicle?.enteredType)?.slabs
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

      const daySlabLabel = additionalDaySlab ? `24${additionalDaySlab.hours === 24 ? 'day' : 'hr'} @ ₹${additionalDaySlab.fee}` : ""
      return `${fullDays} x ${daySlabLabel}${remainingHours > 0 ? ` + ${remainingSlabLabel}` : ""}`
    }

    for (const slab of vehicleSlabs) {
      if (slab.rangeType === "upTo" && totalHours <= slab.hours) {
        return `${slab.hours}hr @ ₹${slab.fee}`
      }
    }

    return ""
  }



  useEffect(() => {
    if(!selectedVehicle?.fee) return
    setManualAmount((selectedVehicle?.fee - calculateFee()).toString())
  }, [selectedVehicle])
  useEffect(() => {
    if (!totalHours || !pricingSlabs) return
    setFee(calculateFee())
  }, [totalHours, pricingSlabs])


  const handlePayment = async () => {
    if (!selectedVehicle || !userData || !lot) return

    setIsProcessing(true)
    const details = {
      docId: selectedVehicle.id,
      feePaid: Number(manualAmount),
      paymentMethod: paymentMethod,
    }
    try {
      await saveExit(apiUrl.current, details, token);
      resetForm()
      toast.success("Recorded successfully!")
    } catch (error) {
      console.error("Error processing payment:", error)
      toast.success("Not captured. Saving details.")
      const details = {
        enteredExitedTime: Timestamp.now(),
        feePaid: Number(manualAmount),
        status: "exited" as VehicleStatus, 
        paymentMethod: paymentMethod,
        exitedByName: userData.displayName ?? ""
      }
      updateVehicleDetails(lot, selectedVehicle.id, details).catch((error) => {
        console.error("Error updating vehicle details:", error)
        toast.error("Failed to update vehicle details.")
      })
      resetForm()
    } finally {
      setIsProcessing(false)
    }
  }

  const resetForm = () => {
    setVehicleNumber("")
    setVehicleFound(false)
    setPaymentMethod("cash")
    setVehicleImage(null)
    setSelectedVehicle(null)
  }

  // Calculate duration for display
  const calculateDuration = (entryTime: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - entryTime.getTime()
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    return `${diffHrs}h ${diffMins}m`
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
      <Header title="Exit & Payment" />
      <Toaster />
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
                    src={vehicleImage || "/placeholder.svg"}
                    alt="Vehicle"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Camera className="h-16 w-16 text-slate-300" />
                  </div>
                )}
                <div className="absolute bottom-0 left-0 right-0 bg-slate-800/70 p-2 text-center text-sm text-white">
                  Exit Camera Feed
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="flex-1" disabled={isFetchingPlate} onClick={simulateVehicleScan}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Scan Vehicle
                </Button>

                <div className="flex flex-1 gap-2">
                  <Input
                    value={vehicleNumber}
                    onChange={(e) => setVehicleNumber(e.target.value)}
                    placeholder="Enter vehicle number"
                    className="flex-1"
                  />
                  <Button onClick={() => handleSearch()}>Search</Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {vehicleFound && selectedVehicle ? (
            <Card>
              <CardHeader>
                <CardTitle>Payment Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-md bg-slate-50 p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Vehicle Number:</span>
                    <span className="font-medium">{selectedVehicle.enteredPlate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Vehicle Type:</span>
                    <span>{selectedVehicle.enteredType === "2" ? "two-wheeler" : "four-wheeler"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Entry Time:</span>
                    <span>{(selectedVehicle.entryTime!).toDate().toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Duration:</span>
                    <span>{calculateDuration((selectedVehicle.entryTime!).toDate())}</span>
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
                  <div className="flex justify-between items-center">
                    <div className="flex items-center">
                      <span className="font-medium">Paid Fee:</span>
                    </div>
                    <span className="font-bold">₹{selectedVehicle?.fee}</span>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="manual-amount">Final Amount (Overdue)</Label>
                    <Input
                      id="manual-amount"
                      type="number"
                      value={manualAmount || ""}
                      onChange={(e) => setManualAmount(e.target.value)}
                      className="w-full"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="payment-method">Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger id="payment-method">
                      <SelectValue placeholder="Select payment method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">Cash</SelectItem>
                      <SelectItem value="card">Card</SelectItem>
                      <SelectItem value="upi">UPI</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" onClick={handlePayment} disabled={isProcessing}>
                  {isProcessing ? (
                    "Processing..."
                  )
                    : (
                      "Process Payment & Checkout"
                    )}
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex h-full items-center justify-center p-6">
                <div className="text-center text-slate-500">
                  <p>No vehicle selected</p>
                  <p className="text-sm">Scan a vehicle or enter a vehicle number to proceed</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

