"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"
import { Download, Calendar } from "lucide-react"
import Header from "@/components/header"

// Mock data
const revenueData = [
  { date: "2023-01-01", revenue: 4500, vehicles: 90 },
  { date: "2023-01-02", revenue: 5200, vehicles: 104 },
  { date: "2023-01-03", revenue: 4800, vehicles: 96 },
  { date: "2023-01-04", revenue: 5500, vehicles: 110 },
  { date: "2023-01-05", revenue: 6000, vehicles: 120 },
  { date: "2023-01-06", revenue: 5800, vehicles: 116 },
  { date: "2023-01-07", revenue: 6500, vehicles: 130 },
]

const lotData = [
  { name: "Lot A", value: 38, capacity: 50 },
  { name: "Lot B", value: 25, capacity: 30 },
  { name: "Lot C", value: 12, capacity: 40 },
]

const vehicleTypeData = [
  { name: "2-wheeler", value: 35 },
  { name: "4-wheeler", value: 65 },
]

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"]

export default function Reports() {
  const [user, setUser] = useState<{ role: string } | null>(null)
  const [timeRange, setTimeRange] = useState('week')
  
  useEffect(() => {
    // In a real app, you would get this from your auth context
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  if (!user || user.role !== 'owner') {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold">Access Denied</h2>
            <p className="mt-2 text-muted-foreground">
              You don't have permission to access this page.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header title="Reports & Analytics">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Select time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
                <SelectItem value="year">This Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </Header>

      <div className="flex-1 p-4 pt-6 md:p-6">
        <Tabs defaultValue="revenue">
          <TabsList className="mb-6 flex w-full flex-wrap overflow-x-auto">
            <TabsTrigger value="revenue" className="flex-shrink-0">Revenue</TabsTrigger>
            <TabsTrigger value="occupancy" className="flex-shrink-0">Occupancy</TabsTrigger>
            <TabsTrigger value="fraud" className="flex-shrink-0">Fraud Detection</TabsTrigger>
          </TabsList>

          <TabsContent value="revenue" className="space-y-6">
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹38,300</div>
                <p className="text-xs text-muted-foreground">+12.5% from previous period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Total Vehicles</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">766</div>
                <p className="text-xs text-muted-foreground">+8.2% from previous period</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Average Revenue Per Vehicle</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">₹50</div>
                <p className="text-xs text-muted-foreground">+4.3% from previous period</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Revenue Trend</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(value) => {
                        const date = new Date(value)
                        return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
                      }}
                    />
                    <YAxis />
                    <Tooltip
                      formatter={(value) => [`₹${value}`, "Revenue"]}
                      labelFormatter={(label) => {
                        const date = new Date(label)
                        return date.toLocaleDateString("en-US", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="revenue" stroke="#3b82f6" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Revenue by Lot</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={lotData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`₹${value * 50}`, "Revenue"]} />
                    <Legend />
                    <Bar dataKey="value" name="Revenue (₹)" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="occupancy" className="space-y-6">
          <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Lot Occupancy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={lotData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" />
                      <Tooltip
                        formatter={(value, name) => [`${value} vehicles`, name === "value" ? "Current" : "Capacity"]}
                      />
                      <Legend />
                      <Bar dataKey="value" name="Current" fill="#3b82f6" />
                      <Bar dataKey="capacity" name="Capacity" fill="#e5e7eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Vehicle Type Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={vehicleTypeData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {vehicleTypeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value}%`, "Percentage"]} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Hourly Occupancy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={[
                      { hour: "6 AM", occupancy: 10 },
                      { hour: "8 AM", occupancy: 30 },
                      { hour: "10 AM", occupancy: 45 },
                      { hour: "12 PM", occupancy: 60 },
                      { hour: "2 PM", occupancy: 75 },
                      { hour: "4 PM", occupancy: 85 },
                      { hour: "6 PM", occupancy: 70 },
                      { hour: "8 PM", occupancy: 50 },
                      { hour: "10 PM", occupancy: 25 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hour" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`${value}%`, "Occupancy"]} />
                    <Legend />
                    <Line type="monotone" dataKey="occupancy" stroke="#3b82f6" activeDot={{ r: 8 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fraud" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Fraud Detection Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date & Time</TableHead>
                      <TableHead>Vehicle Number</TableHead>
                      <TableHead>Issue Type</TableHead>
                      <TableHead>Lot</TableHead>
                      <TableHead>Manager</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Jan 5, 2023 14:32</TableCell>
                      <TableCell>KA01AB1234</TableCell>
                      <TableCell>Plate Mismatch</TableCell>
                      <TableCell>Lot A</TableCell>
                      <TableCell>John Doe</TableCell>
                      <TableCell>
                        <span className="rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-800">
                          Under Review
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Jan 4, 2023 11:15</TableCell>
                      <TableCell>MH02CD5678</TableCell>
                      <TableCell>Manual Override</TableCell>
                      <TableCell>Lot B</TableCell>
                      <TableCell>Jane Smith</TableCell>
                      <TableCell>
                        <span className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                          Resolved
                        </span>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Jan 3, 2023 09:45</TableCell>
                      <TableCell>DL03EF9012</TableCell>
                      <TableCell>Duplicate Entry</TableCell>
                      <TableCell>Lot A</TableCell>
                      <TableCell>John Doe</TableCell>
                      <TableCell>
                        <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800">
                          Confirmed Fraud
                        </span>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Fraud Metrics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-3">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Total Suspicious Activities</h3>
                  <p className="text-2xl font-bold">24</p>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Confirmed Fraud Cases</h3>
                  <p className="text-2xl font-bold">7</p>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </div>
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-muted-foreground">Revenue Loss Prevented</h3>
                  <p className="text-2xl font-bold">₹3,500</p>
                  <p className="text-xs text-muted-foreground">Last 30 days</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

