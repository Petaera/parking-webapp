"use client"

import { useState, useEffect, useMemo } from "react"
import { onSnapshot, collection, query, where, Timestamp } from "firebase/firestore"
import { Combobox, ComboboxInput, ComboboxList, ComboboxItem } from "@/components/ui/combobox"
import { useDebounce } from "../../../hooks/use-debounce"
import { db } from "@/lib/firebase"
import Header from "@/components/header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, AlertTriangle } from "lucide-react"
import { useFirebase } from "@/contexts/firebase-context"
import Loading from "@/components/loading"
import { EntryDetails, VehicleStatus, getLots, getLotsByIds } from "@/lib/firestore-service"

interface Vehicle extends EntryDetails {
  id: string
  lot: string
  status: VehicleStatus
  timestamp?: Timestamp
}

interface Lot {
  id: string
  name: string
  address: string
  active?: boolean
  capacity?: number
  updatedAt?: any
}
export default function ActiveVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [lotFilter, setLotFilter] = useState("")
  const [lots, setLots] = useState<Lot[]>([])
  const [lotPage, setLotPage] = useState(1)
  const [typeFilter, setTypeFilter] = useState("all")
  const { user, userData } = useFirebase()

  useEffect(() => {
    // Fetch lots data
    const fetchLots = async (lots?: string[]) => {
      const lotsData = await (lots ? getLotsByIds(lots) : getLots())
      setLots(lotsData)
    }

    if (userData?.assignedLots && userData.assignedLots.length > 0) {
      fetchLots(userData.assignedLots)
    } else {
      fetchLots()
    }

  }, [userData])

  useEffect(() => {
    if (lots[0]?.id)
      setLotFilter(lots[0].id);
  }, [lots])

  useEffect(() => {
    // TODO: fetch vehicle based on the filter(also deal with pagination)
  }, [lotFilter, typeFilter, searchTerm]);

  if (loading) return <Loading />
  if (!userData) return null

  return (
    <div className="flex min-h-screen flex-col">
      <Header title="Active Vehicles" />

      <div className="flex-1 p-4 pt-6 md:p-6">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
              <div className="flex items-center gap-2">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by vehicle number"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>

              <Combobox value={lotFilter} onValueChange={setLotFilter}>
                <ComboboxList>
                  {lots
                    .map(lot => (
                      <ComboboxItem
                        key={lot.id}
                        value={lot.id}
                      >
                        {lot.name}
                      </ComboboxItem>
                    ))}
                </ComboboxList>
              </Combobox>


              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="2-wheeler">2-Wheeler</SelectItem>
                  <SelectItem value="4-wheeler">4-Wheeler</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Vehicle Number</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Entry Time</TableHead>
                    <TableHead>Duration</TableHead>
                    {userData?.role === "owner" && <TableHead>Lot</TableHead>}
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={userData?.role === "owner" ? 8 : 7} className="text-center">
                        No active vehicles found
                      </TableCell>
                    </TableRow>
                  ) : (
                    vehicles.map((vehicle) => (
                      <TableRow key={vehicle.id} className={vehicle.status === "fraud" ? "bg-amber-50" : ""}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {vehicle.status === "fraud" && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                            {vehicle.enteredPlate}
                          </div>
                        </TableCell>
                        <TableCell>{vehicle.enteredType}</TableCell>
                        <TableCell>
                          {vehicle.timestamp?.toDate().toLocaleTimeString()}
                        </TableCell>
                        <TableCell>
                          {vehicle.duration > 0 ? `${vehicle.duration}h` : 'Calculating...'}
                        </TableCell>
                        {userData?.role === "owner" && <TableCell>{vehicle.lot}</TableCell>}
                        <TableCell>₹{vehicle.fee}</TableCell>
                        <TableCell>
                          <Badge variant={
                            vehicle.status === "fraud" ? "destructive" :
                              vehicle.status === "active" ? "outline" : "default"
                          }>
                            {vehicle.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => (window.location.href = "/parking/exit-payment")}
                          >
                            Checkout
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
