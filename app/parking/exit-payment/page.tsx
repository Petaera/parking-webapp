"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Camera, RefreshCw, Check } from "lucide-react"
import Header from "@/components/header"
import { useFirebase } from "@/contexts/firebase-context"
import { getActiveVehicles, updateParkingSlip, type ParkingSlip } from "@/lib/firestore-service"
import { Timestamp } from "firebase/firestore"

export default function ExitPayment() {
  const { userData } = useFirebase()
  const [vehicleNumber, setVehicleNumber] = useState("")
  const [vehicleFound, setVehicleFound] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState("cash")
  const [isProcessing, setIsProcessing] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [totalAmount, setTotalAmount] = useState("150")
  const [activeVehicles, setActiveVehicles] = useState<ParkingSlip[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<ParkingSlip | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchActiveVehicles = async () => {
      try {
        const vehicles = await getActiveVehicles()
        setActiveVehicles(vehicles)
      } catch (error) {
        console.error("Error fetching active vehicles:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchActiveVehicles()
  }, [])

  const simulateVehicleScan = () => {
    // In a real app, this would use camera detection
    // For now, just pick a random vehicle from the active vehicles
    if (activeVehicles.length > 0) {
      const randomVehicle = activeVehicles[Math.floor(Math.random() * activeVehicles.length)]
      setVehicleNumber(randomVehicle.enteredPlate)
      handleSearch(randomVehicle.enteredPlate)
    }
  }

  const handleSearch = (plateNumber = vehicleNumber) => {
    const vehicle = activeVehicles.find((v) => v.enteredPlate === plateNumber)
    if (vehicle) {
      setSelectedVehicle(vehicle)
      setVehicleFound(true)

      // Calculate fee based on entry time and current time
      const entryTime = vehicle.entryTime.toDate()
      const currentTime = new Date()
      const durationMs = currentTime.getTime() - entryTime.getTime()
      const durationHours = durationMs / (1000 * 60 * 60)

      // Simple calculation for demo purposes
      // In a real app, you'd use the pricing slabs
      const calculatedFee = Math.ceil(durationHours) * 50
      setTotalAmount(calculatedFee.toString())
    } else {
      alert("Vehicle not found. Please try again.")
      setSelectedVehicle(null)
      setVehicleFound(false)
    }
  }

  const handlePayment = async () => {
    if (!selectedVehicle || !userData) return

    setIsProcessing(true)

    try {
      // Update the parking slip in Firestore
      await updateParkingSlip(selectedVehicle.id!, {
        exitTime: Timestamp.now(),
        feePaid: Number(totalAmount),
        status: "exited",
      })

      setIsComplete(true)

      // Reset form after 3 seconds
      setTimeout(() => {
        setVehicleNumber("")
        setVehicleFound(false)
        setPaymentMethod("cash")
        setTotalAmount("150")
        setSelectedVehicle(null)
        setIsComplete(false)

        // Refresh active vehicles list
        getActiveVehicles().then((vehicles) => {
          setActiveVehicles(vehicles)
        })
      }, 3000)
    } catch (error) {
      console.error("Error processing payment:", error)
      alert("Failed to process payment. Please try again.")
    } finally {
      setIsProcessing(false)
    }
  }

  // Calculate duration for display
  const calculateDuration = (entryTime: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - entryTime.getTime()
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60))
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))

    return `${diffHrs}h ${diffMins}m`
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen flex-col">
        <Header title="Exit & Payment" />
        <div className="flex-1 flex items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header title="Exit & Payment" />

      <div className="flex-1 p-4 pt-6 md:p-6">
        <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Vehicle Detection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative aspect-video overflow-hidden rounded-md bg-slate-100">
                <div className="flex h-full items-center justify-center">
                  <Camera className="h-16 w-16 text-slate-300" />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-slate-800/70 p-2 text-center text-sm text-white">
                  Exit Camera Feed (Simulated)
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <Button variant="outline" className="flex-1" onClick={simulateVehicleScan}>
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
                    <span>{selectedVehicle.vehicleType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Entry Time:</span>
                    <span>{selectedVehicle.entryTime.toDate().toLocaleTimeString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Duration:</span>
                    <span>{calculateDuration(selectedVehicle.entryTime.toDate())}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Parking Lot:</span>
                    <span>{selectedVehicle.lotId}</span>
                  </div>
                </div>

                <div className="rounded-md bg-slate-50 p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Base Amount:</span>
                    <span>₹{Math.round(Number(totalAmount) * 0.8)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-slate-500">Additional Charges:</span>
                    <span>₹{Math.round(Number(totalAmount) * 0.2)}</span>
                  </div>
                  <div className="flex justify-between border-t pt-2 mt-2">
                    <span className="font-medium">Total Amount:</span>
                    <div className="flex items-center">
                      <span className="mr-1">₹</span>
                      <Input
                        type="number"
                        value={totalAmount}
                        onChange={(e) => setTotalAmount(e.target.value)}
                        className="w-20 h-8 text-right font-bold"
                      />
                    </div>
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
                <Button className="w-full" onClick={handlePayment} disabled={isProcessing || isComplete}>
                  {isProcessing ? (
                    "Processing..."
                  ) : isComplete ? (
                    <span className="flex items-center">
                      <Check className="mr-2 h-4 w-4" />
                      Payment Complete
                    </span>
                  ) : (
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

