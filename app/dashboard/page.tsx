"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Header from "@/components/header"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { DollarSign, Car, Clock, PercentIcon, AlertTriangle } from "lucide-react"

// Mock data
const recentActivity = [
  {
    id: 1,
    vehicleNumber: "ABC123",
    vehicleType: "4-wheeler",
    entryTime: "09:30 AM",
    lot: "Lot A",
    amount: 50,
    status: "paid",
  },
  {
    id: 2,
    vehicleNumber: "XYZ789",
    vehicleType: "2-wheeler",
    entryTime: "10:15 AM",
    lot: "Lot B",
    amount: 30,
    status: "pending",
  },
  {
    id: 3,
    vehicleNumber: "DEF456",
    vehicleType: "4-wheeler",
    entryTime: "11:00 AM",
    lot: "Lot A",
    amount: 50,
    status: "paid",
  },
  {
    id: 4,
    vehicleNumber: "GHI789",
    vehicleType: "4-wheeler",
    entryTime: "11:45 AM",
    lot: "Lot C",
    amount: 50,
    status: "overdue",
  },
  {
    id: 5,
    vehicleNumber: "JKL012",
    vehicleType: "2-wheeler",
    entryTime: "12:30 PM",
    lot: "Lot B",
    amount: 30,
    status: "paid",
  },
]

const chartData = [
  { name: "Mon", revenue: 1200 },
  { name: "Tue", revenue: 1400 },
  { name: "Wed", revenue: 1300 },
  { name: "Thu", revenue: 1500 },
  { name: "Fri", revenue: 1800 },
  { name: "Sat", revenue: 2000 },
  { name: "Sun", revenue: 1700 },
]

export default function Dashboard() {
  const [user, setUser] = useState<{ role: string } | null>(null)

  useEffect(() => {
    // In a real app, you would get this from your auth context
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  if (!user) return null

  return (
    <div className="flex min-h-screen flex-col">
      <Header title="Dashboard" />

      <div className="flex-1 p-4 pt-6 md:p-6">
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardContent className="flex flex-row items-center p-6">
              <div className="mr-4 rounded-full bg-primary/10 p-2">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {user.role === "owner" ? "Total Revenue Today" : "Pending Dues"}
                </p>
                <h3 className="text-2xl font-bold">₹4,550</h3>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="flex flex-row items-center p-6">
              <div className="mr-4 rounded-full bg-primary/10 p-2">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Vehicles</p>
                <h3 className="text-2xl font-bold">42</h3>
              </div>
            </CardContent>
          </Card>

          {user.role === "owner" && (
            <Card>
              <CardContent className="flex flex-row items-center p-6">
                <div className="mr-4 rounded-full bg-primary/10 p-2">
                  <Clock className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Overdue Payments</p>
                  <h3 className="text-2xl font-bold">5</h3>
                </div>
              </CardContent>
            </Card>
          )}

          {user.role === "owner" && (
            <Card>
              <CardContent className="flex flex-row items-center p-6">
                <div className="mr-4 rounded-full bg-primary/10 p-2">
                  <PercentIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Lot Utilization</p>
                  <h3 className="text-2xl font-bold">78%</h3>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="mt-6 grid gap-6 grid-cols-1 lg:grid-cols-2">
          <Card className="col-span-1">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Vehicle</TableHead>
                      <TableHead>Time</TableHead>
                      {user.role === "owner" && <TableHead>Lot</TableHead>}
                      <TableHead>Amount</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentActivity.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{activity.vehicleNumber}</p>
                            <p className="text-xs text-muted-foreground">{activity.vehicleType}</p>
                          </div>
                        </TableCell>
                        <TableCell>{activity.entryTime}</TableCell>
                        {user.role === "owner" && <TableCell>{activity.lot}</TableCell>}
                        <TableCell>₹{activity.amount}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              activity.status === "paid"
                                ? "default"
                                : activity.status === "pending"
                                  ? "outline"
                                  : "destructive"
                            }
                          >
                            {activity.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          {user.role === "owner" && (
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle>Weekly Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {user.role === "owner" && (
            <Card className="col-span-1 lg:col-span-2">
              <CardHeader className="flex flex-row items-center">
                <CardTitle className="flex items-center">
                  <AlertTriangle className="mr-2 h-5 w-5 text-amber-500" />
                  Alerts & Notifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-md bg-amber-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800">Vehicle GHI789 is overdue by 2 hours</h3>
                        <div className="mt-2 text-sm text-amber-700">
                          <p>Vehicle has been parked in Lot C since 11:45 AM. Current overdue amount: ₹100</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-md bg-amber-50 p-4">
                    <div className="flex">
                      <div className="flex-shrink-0">
                        <AlertTriangle className="h-5 w-5 text-amber-400" />
                      </div>
                      <div className="ml-3">
                        <h3 className="text-sm font-medium text-amber-800">Lot B approaching capacity (85%)</h3>
                        <div className="mt-2 text-sm text-amber-700">
                          <p>Only 6 parking spaces remaining. Consider redirecting vehicles to Lot A.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

