"use client"

import { useState, useEffect, useCallback } from "react"
import { collection, query, where, Timestamp, DocumentSnapshot } from "firebase/firestore"
import { getFilteredVehicles } from "@/lib/firestore-service"
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
  const [lastVisible, setLastVisible] = useState<DocumentSnapshot | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [filtersChanged, setFiltersChanged] = useState(false)
  const PAGE_SIZE = 10
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


  // Reset pagination when filters change
  useEffect(() => {
    setVehicles([]);
    setLastVisible(null);
    setHasMore(true);
    setFiltersChanged(true);
    const timer = setTimeout(() => {
      fetchVehicles();
    }, 500);
    return () => clearTimeout(timer);
  }, [lotFilter, typeFilter, searchTerm]);

  const fetchVehicles = useCallback(async () => {
    if (!lotFilter) return;

    setLoading(true);
    try {
      const { vehicles: newVehicles, lastVisible: newLastVisible } =
        await getFilteredVehicles(
          lotFilter,
          {
            searchTerm: searchTerm || undefined,
            typeFilter: typeFilter !== "all" ? typeFilter : undefined
          },
          {
            limit: PAGE_SIZE,
            startAfter: filtersChanged ? null : lastVisible
          }
        );

      setVehicles(prev => filtersChanged ?
        newVehicles.map(v => ({ ...v, lot: lotFilter })) :
        [...prev, ...newVehicles.map(v => ({ ...v, lot: lotFilter }))]
      );
      setLastVisible(newLastVisible);
      setHasMore(newVehicles.length === PAGE_SIZE);
      setFiltersChanged(false);
    } catch (error) {
      console.error("Error fetching vehicles:", error);
    } finally {
      setLoading(false);
    }
  }, [lotFilter, searchTerm, typeFilter, lastVisible, filtersChanged]);

  const calculateDuration = (entryTime: Timestamp) => {
    const now = Timestamp.now();
    const durationInSeconds = now.seconds - entryTime.seconds;
    const hours = Math.floor(durationInSeconds / 3600);
    const days = Math.floor(hours / 24);
    const remainingHours = hours % 24;
    return days > 0 ? `${days}d ${remainingHours}h` : `${hours}h`;
  }

  const isOverdue = (vehicle: Vehicle) => {
    const now = Timestamp.now();
    const entryTime = vehicle.entryTime ?? vehicle.enteredEntryTime;
    if (!entryTime) return false; // No entry time available
    if (!(entryTime instanceof Timestamp)) {
      console.error("Invalid entry time format:", entryTime);
      return false;
    }
    return now.seconds > (entryTime.seconds + (vehicle.duration * 3600));

  }


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

              <Select value={lotFilter} onValueChange={setLotFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a lot" />
                </SelectTrigger>
                <SelectContent>
                  {lots.map(lot => (
                    <SelectItem key={lot.id} value={lot.id}>
                      {lot.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>


              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by vehicle type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="2">2-Wheeler</SelectItem>
                  <SelectItem value="4">4-Wheeler</SelectItem>
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
                    <TableHead>In parking</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Lot</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {vehicles.length === 0 && !loading ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center">
                        {searchTerm || typeFilter !== "all"
                          ? "No vehicles match your filters"
                          : "No active vehicles found"}
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
                          {(vehicle.entryTime ?? vehicle.enteredEntryTime)?.toDate().toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {calculateDuration(vehicle.entryTime ?? vehicle.enteredEntryTime)}
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
                          {isOverdue(vehicle) &&<Badge variant={"destructive"}>
                            overdue
                          </Badge>}
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
      {hasMore && (
        <div className="flex justify-center mt-4">
          <Button
            onClick={() => fetchVehicles()}
            disabled={loading}
            variant="outline"
          >
            {loading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  )
}
