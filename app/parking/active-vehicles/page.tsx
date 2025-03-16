"use client"

import { useState, useEffect } from "react"
import Header from "@/components/header"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, AlertTriangle } from "lucide-react"

// Mock data
const activeVehicles = [
  {
    id: 1,
    vehicleNumber: "KA01AB1234",
    vehicleType: "4-wheeler",
    entryTime: "09:30 AM",
    duration: "2h 15m",
    lot: "Lot A",
    amount: 150,
    status: "active",
    flagged: false,
  },
  {
    id: 2,
    vehicleNumber: "MH02CD5678",
    vehicleType: "2-wheeler",
    entryTime: "10:15 AM",
    duration: "1h 30m",
    lot: "Lot B",
    amount: 45,
    status: "active",
    flagged: false,
  },
  {
    id: 3,
    vehicleNumber: "DL03EF9012",
    vehicleType: "4-wheeler",
    entryTime: "11:00 AM",
    duration: "45m",
    lot: "Lot A",
    amount: 50,
    status: "active",
    flagged: false,
  },
  {
    id: 4,
    vehicleNumber: "TN04GH3456",
    vehicleType: "4-wheeler",
    entryTime: "11:45 AM",
    duration: "3h 15m",
    lot: "Lot C",
    amount: 200,
    status: "overdue",
    flagged: true,
  },
  {
    id: 5,
    vehicleNumber: "KL05IJ7890",
    vehicleType: "2-wheeler",
    entryTime: "12:30 PM",
    duration: "1h 5m",
    lot: "Lot B",
    amount: 35,
    status: "active",
    flagged: false,
  },
]

export default function ActiveVehicles() {
  const [user, setUser] = useState<{ role: string } | null>(null)
  const [searchTerm, setSearchTerm] = useState("")
  const [lotFilter, setLotFilter] = useState("all")
  const [typeFilter, setTypeFilter] = useState("all")

  useEffect(() => {
    // In a real app, you would get this from your auth context
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const filteredVehicles = activeVehicles.filter((vehicle) => {
    const matchesSearch = vehicle.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesLot = lotFilter === "all" || vehicle.lot === lotFilter
    const matchesType = typeFilter === "all" || vehicle.vehicleType === typeFilter
    return matchesSearch && matchesLot && matchesType
  })

  if (!user) return null

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

              {user.role === "owner" && (
                <Select value={lotFilter} onValueChange={setLotFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter by lot" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Lots</SelectItem>
                    <SelectItem value="Lot A">Lot A</SelectItem>
                    <SelectItem value="Lot B">Lot B</SelectItem>
                    <SelectItem value="Lot C">Lot C</SelectItem>
                  </SelectContent>
                </Select>
              )}

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
                    {user.role === "owner" && <TableHead>Lot</TableHead>}
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredVehicles.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={user.role === "owner" ? 8 : 7} className="text-center">
                        No active vehicles found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredVehicles.map((vehicle) => (
                      <TableRow key={vehicle.id} className={vehicle.flagged ? "bg-amber-50" : ""}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {vehicle.flagged && <AlertTriangle className="h-4 w-4 text-amber-500" />}
                            {vehicle.vehicleNumber}
                          </div>
                        </TableCell>
                        <TableCell>{vehicle.vehicleType}</TableCell>
                        <TableCell>{vehicle.entryTime}</TableCell>
                        <TableCell>{vehicle.duration}</TableCell>
                        {user.role === "owner" && <TableCell>{vehicle.lot}</TableCell>}
                        <TableCell>₹{vehicle.amount}</TableCell>
                        <TableCell>
                          <Badge variant={vehicle.status === "active" ? "outline" : "destructive"}>
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

